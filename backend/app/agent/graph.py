"""
Multi-Agent LangGraph — advanced RAG with CRAG + Hybrid Search.

Pipeline:
  router_node  → classifies intent (casual / rag / sql)
  rag_node     → Hybrid Search (BM25 + Vector + RRF fusion) → top-k chunks
  crag_node    → Corrective RAG: score chunk relevance → rewrite + re-retrieve if low quality
  sql_node     → DuckDB Text-to-SQL (respects per-user table restrictions)
  casual_node  → no retrieval; chat.py streams direct LLM response

Why CRAG matters:
  Standard RAG retrieves and blindly feeds chunks to the LLM, even when
  the chunks are irrelevant. CRAG adds a lightweight evaluation step:
  - Scores retrieved chunks for query relevance (0–10)
  - If avg score < QUALITY_THRESHOLD → rewrites the query + re-retrieves
  - Falls back with the best available context rather than hallucinating

Why Hybrid Search matters:
  Pure vector search misses exact keyword matches (names, IDs, codes).
  Pure BM25 misses semantic similarity.
  Hybrid (BM25 + Vector + RRF) captures both — consistently outperforms either alone.

Why this separation from chat.py:
  SSE streaming must happen in the HTTP response generator (chat.py).
  LangGraph nodes are synchronous and can't yield SSE tokens.
  This graph is focused on pure intelligent retrieval — chat.py handles generation.
"""
import boto3
from typing import TypedDict, Literal
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage

from app.services.pinecone_service import (
    index, embeddings, bm25_score, reciprocal_rank_fusion
)
from app.services.sql_service import execute_sql_for_bot
from app.core.config import settings

# ── Corrective RAG threshold ──────────────────────────────────────────────────
# Avg chunk relevance (0–10) below this triggers query rewrite + re-retrieval
QUALITY_THRESHOLD = 4.0
# Number of chunks to initially fetch (wide net for hybrid reranking)
INITIAL_TOP_K = 15
# Final number of chunks sent to the LLM
FINAL_TOP_K = 5


class AgentState(TypedDict):
    bot_id: str
    query: str
    intent: str           # "casual" | "rag" | "sql"
    context: str          # populated by rag_node + refined by crag_node
    sql_result: str       # populated by sql_node
    restricted_tables: list   # filenames the requesting user cannot access
    retrieval_quality: float  # avg CRAG relevance score (0–10), for observability


def _get_llm(max_tokens: int = 512):
    return ChatBedrockConverse(
        client=boto3.client("bedrock-runtime", region_name=settings.AWS_REGION),
        model=settings.BEDROCK_CHAT_MODEL,
        max_tokens=max_tokens,
    )


# ── Node 1: Router ────────────────────────────────────────────────────────────

class RouterDecision(BaseModel):
    """Determination of which tool or system path to route the user towards."""
    intent: Literal["casual", "rag", "sql"] = Field(
        ...,
        description=(
            "Use 'sql' for ANY queries about counts, totals, tables, CSVs, Excel, or numeric aggregations. "
            "Use 'rag' for ALL other questions — about people, documents, policies, facts, resumes, "
            "locations, jobs, companies, or anything that might be found in an uploaded document. "
            "When in doubt, ALWAYS choose 'rag'. "
            "Use 'casual' ONLY for standalone greetings with no question: 'hi', 'hello', 'hey', "
            "'how are you', 'good morning'. If the message contains ANY question word (who, what, "
            "where, when, why, how, which, is, are, was, did, does, can) — use 'rag', not 'casual'."
        )
    )

def router_node(state: AgentState) -> AgentState:
    """LLM-based intent classification via structured output."""
    llm = _get_llm().with_structured_output(RouterDecision)
    try:
        resp = llm.invoke([
            SystemMessage(content="You are an expert intent classifier. Decide the most appropriate execution path."),
            HumanMessage(content=state["query"])
        ])
        intent = resp.intent
    except Exception as e:
        print(f"[router] structured output fallback: {e}")
        intent = "rag"

    intent = intent if intent in ("casual", "rag", "sql") else "rag"
    print(f"[router] '{state['query'][:60]}' → {intent}")
    return {"intent": intent}


def route_decision(state: AgentState) -> Literal["casual", "rag", "sql"]:
    return state["intent"]  # type: ignore


# ── Node 2a: Casual ───────────────────────────────────────────────────────────

def casual_node(state: AgentState) -> AgentState:
    return {"context": "", "sql_result": "", "retrieval_quality": 10.0}


# ── Node 2b: RAG — Hybrid Search (BM25 + Vector + RRF) ───────────────────────

def rag_node(state: AgentState) -> AgentState:
    """
    Hybrid retrieval pipeline:
      1. Embed the query → Pinecone vector search (top INITIAL_TOP_K)
      2. Score the same candidates with BM25 keyword matching
      3. Merge both rankings with Reciprocal Rank Fusion
      4. Return the top FINAL_TOP_K chunks

    This captures both semantic similarity AND exact keyword/entity matches,
    consistently outperforming either method alone.
    """
    try:
        query_vector = embeddings.embed_query(state["query"])
        results = index.query(
            namespace=state["bot_id"],
            vector=query_vector,
            top_k=INITIAL_TOP_K,
            include_metadata=True,
        )
        matches = results.get("matches", [])
        if not matches:
            return {"context": "", "sql_result": "", "retrieval_quality": 0.0}

        # BM25 score each candidate against the query
        bm25_scores = {}
        for match in matches:
            text = match.get("metadata", {}).get("text", "")
            bm25_scores[match["id"]] = bm25_score(state["query"], text)

        # RRF fusion: merge vector rank + BM25 rank
        fused = reciprocal_rank_fusion(matches, bm25_scores)
        top_matches = [m for m, _ in fused[:FINAL_TOP_K]]

        chunks = [
            m["metadata"]["text"]
            for m in top_matches
            if "text" in m.get("metadata", {})
        ]
        context = "\n\n---\n\n".join(chunks)
        print(f"[rag] hybrid search: {len(matches)} candidates → {len(chunks)} after RRF")
        return {"context": context, "sql_result": "", "retrieval_quality": 5.0}

    except Exception as e:
        print(f"[rag] error: {e}")
        return {"context": "", "sql_result": "", "retrieval_quality": 0.0}


# ── Node 2b-2: CRAG — Corrective RAG ─────────────────────────────────────────

def crag_node(state: AgentState) -> AgentState:
    """
    Corrective RAG (CRAG) — evaluates retrieved chunk quality and self-corrects.

    Step 1: Score each chunk for relevance to the query (0–10) using a fast LLM call.
    Step 2: If avg score < QUALITY_THRESHOLD:
              a. Rewrite the query to be more specific/targeted
              b. Re-retrieve with the rewritten query (also hybrid)
              c. Use the new context if it has chunks; otherwise keep original
    Step 3: Annotate state with retrieval_quality for observability.

    This prevents the LLM from hallucinating confident answers based on
    irrelevant retrieved chunks — the most common failure mode in production RAG.
    """
    context = state.get("context", "")
    if not context:
        return {"retrieval_quality": 0.0}

    chunks = [c.strip() for c in context.split("\n\n---\n\n") if c.strip()]
    if not chunks:
        return {"retrieval_quality": 0.0}

    query = state["query"]
    llm = _get_llm(max_tokens=10)

    # ── Score each chunk ──────────────────────────────────────────────────────
    scores = []
    for chunk in chunks[:5]:
        try:
            resp = llm.invoke([
                SystemMessage(content=(
                    "Rate how relevant the following TEXT is to the QUERY. "
                    "Respond with ONLY a single integer 0-10. No other text."
                )),
                HumanMessage(content=f"QUERY: {query}\n\nTEXT: {chunk[:400]}")
            ])
            raw = resp.content.strip().split()[0]
            scores.append(min(10.0, max(0.0, float(raw))))
        except Exception:
            scores.append(5.0)  # assume acceptable on error

    avg_score = sum(scores) / len(scores) if scores else 0.0
    print(f"[crag] relevance scores: {scores} → avg={avg_score:.1f}")

    # ── Corrective action if quality is low ───────────────────────────────────
    if avg_score < QUALITY_THRESHOLD:
        print(f"[crag] quality below threshold ({avg_score:.1f} < {QUALITY_THRESHOLD}) → rewriting query")
        rewrite_llm = _get_llm(max_tokens=80)
        try:
            rewrite_resp = rewrite_llm.invoke([
                SystemMessage(content=(
                    "You are a query optimization expert. Rewrite the following query to be more "
                    "specific and targeted so that a semantic search retrieves better results. "
                    "Return ONLY the rewritten query, no explanation."
                )),
                HumanMessage(content=query)
            ])
            rewritten = rewrite_resp.content.strip()
            print(f"[crag] rewritten query: {rewritten[:80]}")
        except Exception:
            rewritten = query  # fallback to original

        # Re-retrieve with the rewritten query (hybrid)
        try:
            query_vector = embeddings.embed_query(rewritten)
            results = index.query(
                namespace=state["bot_id"],
                vector=query_vector,
                top_k=INITIAL_TOP_K,
                include_metadata=True,
            )
            matches = results.get("matches", [])
            if matches:
                from app.services.pinecone_service import bm25_score as _bm25
                from app.services.pinecone_service import reciprocal_rank_fusion as _rrf
                bm25_scores = {
                    m["id"]: _bm25(rewritten, m.get("metadata", {}).get("text", ""))
                    for m in matches
                }
                fused = _rrf(matches, bm25_scores)
                top_matches = [m for m, _ in fused[:FINAL_TOP_K]]
                new_chunks = [
                    m["metadata"]["text"]
                    for m in top_matches
                    if "text" in m.get("metadata", {})
                ]
                if new_chunks:
                    new_context = "\n\n---\n\n".join(new_chunks)
                    print(f"[crag] corrected context: {len(new_chunks)} new chunks")
                    return {"context": new_context, "retrieval_quality": avg_score}
        except Exception as e:
            print(f"[crag] re-retrieval failed: {e}")

    return {"retrieval_quality": avg_score}


# ── Node 2c: SQL — DuckDB Text-to-SQL ────────────────────────────────────────

def sql_node(state: AgentState) -> AgentState:
    """
    Runs the Text-to-SQL pipeline: lists bot tables → generates SQL → executes via DuckDB.
    Restricted tables are filtered out before the LLM ever sees the schema.
    """
    try:
        result = execute_sql_for_bot(
            state["bot_id"],
            state["query"],
            restricted_tables=state.get("restricted_tables") or [],
        )
        print(f"[sql] result preview: {result[:100]}")
    except Exception as e:
        result = f"SQL error: {e}"
    return {"sql_result": result, "context": "", "retrieval_quality": 10.0}


# ── Graph Assembly ────────────────────────────────────────────────────────────

graph = StateGraph(AgentState)
graph.add_node("router", router_node)
graph.add_node("casual", casual_node)
graph.add_node("rag", rag_node)
graph.add_node("crag", crag_node)   # ← NEW: Corrective RAG evaluator
graph.add_node("sql", sql_node)

graph.set_entry_point("router")
graph.add_conditional_edges("router", route_decision, {
    "casual": "casual",
    "rag": "rag",
    "sql": "sql",
})

graph.add_edge("casual", END)
graph.add_edge("rag", "crag")   # ← RAG always flows through CRAG
graph.add_edge("crag", END)
graph.add_edge("sql", END)

agent_executor = graph.compile()
