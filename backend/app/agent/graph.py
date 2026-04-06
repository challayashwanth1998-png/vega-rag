"""
Multi-Agent LangGraph — intent router + retrieval only.

The graph's job is ONLY to:
  1. Classify intent (router_node)
  2. Retrieve the appropriate context/data based on intent

Answer GENERATION is handled by chat.py's SSE streaming generator,
which uses `final_state["intent"]` to pick the right prompt & context.

Why this separation?
- SSE streaming must happen in the HTTP response generator (chat.py)
- LangGraph nodes are synchronous and can't yield SSE tokens
- This keeps the graph focused on pure data retrieval

Routing:
  casual → sets intent="casual"  (chat.py does direct LLM stream)
  rag    → Pinecone retrieval → context (chat.py streams RAG answer)
  sql    → DuckDB Text-to-SQL  → sql_result (chat.py streams formatted table)
"""
import boto3
from typing import TypedDict, Literal
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage

from app.services.pinecone_service import index, embeddings
from app.services.sql_service import execute_sql_for_bot
from app.core.config import settings


class AgentState(TypedDict):
    bot_id: str
    query: str
    intent: str      # "casual" | "rag" | "sql"
    context: str     # populated by rag_node
    sql_result: str  # populated by sql_node
    restricted_tables: list  # filenames the requesting user cannot access


def _get_llm():
    return ChatBedrockConverse(
        client=boto3.client("bedrock-runtime", region_name=settings.AWS_REGION),
        model=settings.BEDROCK_CHAT_MODEL,
    )


# ── Node 1: Router ────────────────────────────────────────────────────────────

class RouterDecision(BaseModel):
    """Determination of which tool or system path to route the user towards."""
    intent: Literal["casual", "rag", "sql"] = Field(
        ...,
        description=(
            "Use 'sql' for ANY queries regarding counts, totals, tables, csvs, excels, or numeric aggregations. "
            "Use 'rag' for general knowledge, text documents, or company policies. "
            "Use 'casual' for standard chat, greetings, and generic banter."
        )
    )

def router_node(state: AgentState) -> AgentState:
    """LLM-based intent classification via Schema Tool Calling."""
    llm = _get_llm().with_structured_output(RouterDecision)
    try:
        resp = llm.invoke([
            SystemMessage(content="You are an expert intent classifier and query router. Decide the most appropriate execution path."),
            HumanMessage(content=state["query"])
        ])
        intent = resp.intent
    except Exception as e:
        print(f"[router] Structured output fallback: {e}")
        intent = "rag"  # Fallback to general RAG

    intent = intent if intent in ("casual", "rag", "sql") else "rag"
    print(f"[router] '{state['query'][:60]}' → {intent}")
    return {"intent": intent}


def route_decision(state: AgentState) -> Literal["casual", "rag", "sql"]:
    return state["intent"]  # type: ignore


# ── Node 2a: Casual — no retrieval needed ────────────────────────────────────

def casual_node(state: AgentState) -> AgentState:
    """Casual path: nothing to retrieve, chat.py streams a direct LLM answer."""
    return {"context": "", "sql_result": ""}


# ── Node 2b: RAG — Pinecone retrieval ────────────────────────────────────────

def rag_node(state: AgentState) -> AgentState:
    """
    Queries Pinecone (namespace=bot_id) with Bedrock Titan embeddings.
    Returns the top-5 chunks as context for chat.py to stream.
    """
    try:
        query_vector = embeddings.embed_query(state["query"])
        results = index.query(
            namespace=state["bot_id"],
            vector=query_vector,
            top_k=5,
            include_metadata=True,
        )
        chunks = [
            m["metadata"]["text"]
            for m in results["matches"]
            if "text" in m.get("metadata", {})
        ]
        context = "\n\n---\n\n".join(chunks)
        print(f"[rag] retrieved {len(chunks)} chunks")
    except Exception as e:
        print(f"[rag] Pinecone error: {e}")
        context = ""
    return {"context": context, "sql_result": ""}


# ── Node 2c: SQL — DuckDB Text-to-SQL ────────────────────────────────────────

def sql_node(state: AgentState) -> AgentState:
    """
    Runs the Text-to-SQL pipeline: lists bot tables → generates SQL → executes via DuckDB.
    Restricted tables are filtered out before the LLM ever sees the schema.
    Returns formatted result string for chat.py to stream.
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
    return {"sql_result": result, "context": ""}


# ── Graph Assembly ────────────────────────────────────────────────────────────

graph = StateGraph(AgentState)
graph.add_node("router", router_node)
graph.add_node("casual", casual_node)
graph.add_node("rag", rag_node)
graph.add_node("sql", sql_node)

graph.set_entry_point("router")
graph.add_conditional_edges("router", route_decision, {
    "casual": "casual",
    "rag": "rag",
    "sql": "sql",
})
graph.add_edge("casual", END)
graph.add_edge("rag", END)
graph.add_edge("sql", END)

agent_executor = graph.compile()
