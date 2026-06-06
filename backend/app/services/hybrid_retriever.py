"""
Hybrid Retriever — runs vector + structural retrievers, merges results.

Pipeline:
  1. Run vector retriever (existing BM25+Vector+RRF from rag_node logic)
  2. Run structural retriever (tree walking)
  3. Deduplicate overlapping passages by content hash
  4. Rerank the combined set with Nova Micro
  5. Keep top-N
  6. Emit unified contract with source="hybrid" and combined retrieval_trace

The vector retriever reuses the exact same Pinecone + BM25 + RRF logic
from the existing rag_node in graph.py. The structural retriever walks
document trees via LLM scoring.
"""
import hashlib
import boto3
from opentelemetry import trace
from pydantic import BaseModel, Field
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings
from app.services.pinecone_service import (
    index, embeddings, bm25_score, reciprocal_rank_fusion,
)
from app.services.structural_retriever import structural_retrieve

tracer = trace.get_tracer(__name__)

# Reuse the same constants as graph.py
INITIAL_TOP_K = 15
FINAL_TOP_K = 5


class PassageScore(BaseModel):
    """Reranked passage with score."""
    index: int = Field(description="0-based index of the passage")
    score: float = Field(description="Relevance score 0-10")


class RerankedPassages(BaseModel):
    """Structured output: reranked passages."""
    scores: list[PassageScore] = Field(description="Scored passages, best first")


def _get_llm(max_tokens: int = 512):
    return ChatBedrockConverse(
        client=boto3.client("bedrock-runtime", region_name=settings.AWS_REGION),
        model=settings.BEDROCK_CHAT_MODEL,
        max_tokens=max_tokens,
    )


def _content_hash(text: str) -> str:
    """Hash first 200 chars to detect duplicate/overlapping passages."""
    normalized = text.strip()[:200].lower()
    return hashlib.sha256(normalized.encode()).hexdigest()


def _vector_retrieve(query: str, bot_id: str) -> dict:
    """
    Run the vector retriever (same logic as existing rag_node).
    Returns the standardized contract.
    """
    try:
        query_vector = embeddings.embed_query(query)
        results = index.query(
            namespace=bot_id,
            vector=query_vector,
            top_k=INITIAL_TOP_K,
            include_metadata=True,
        )
        matches = results.get("matches", [])
        if not matches:
            return {"contexts": [], "source": "vector", "scores": [], "retrieval_trace": []}

        # BM25 + RRF fusion (same as rag_node)
        bm25_scores_map = {}
        for match in matches:
            text = match.get("metadata", {}).get("text", "")
            bm25_scores_map[match["id"]] = bm25_score(query, text)

        fused = reciprocal_rank_fusion(matches, bm25_scores_map)
        top_matches = [m for m, _ in fused[:FINAL_TOP_K]]

        contexts = [
            m["metadata"]["text"]
            for m in top_matches
            if "text" in m.get("metadata", {})
        ]
        scores = [score for _, score in fused[:FINAL_TOP_K]]

        return {
            "contexts": contexts,
            "source": "vector",
            "scores": scores,
            "retrieval_trace": [],
        }

    except Exception as e:
        print(f"[hybrid_retriever] vector retrieve failed: {e}")
        return {"contexts": [], "source": "vector", "scores": [], "retrieval_trace": []}


def _deduplicate(passages: list[dict]) -> list[dict]:
    """
    Remove duplicate/overlapping passages by content hash.
    Each passage is {"text": str, "score": float, "source": str}.
    """
    seen_hashes = set()
    unique = []
    for p in passages:
        h = _content_hash(p["text"])
        if h not in seen_hashes:
            seen_hashes.add(h)
            unique.append(p)
    return unique


def _rerank(query: str, passages: list[dict]) -> list[dict]:
    """
    Rerank passages using Nova Micro. Scores each passage 0-10 against query.
    Returns passages sorted by rerank score (descending).
    """
    if len(passages) <= 1:
        return passages

    # Build passage list for LLM
    passage_texts = []
    for i, p in enumerate(passages):
        # Truncate to keep prompt reasonable
        text_preview = p["text"][:400]
        passage_texts.append(f"[{i}] {text_preview}")

    passages_str = "\n\n".join(passage_texts)

    llm = _get_llm(max_tokens=1024).with_structured_output(RerankedPassages)
    prompt = (
        f"Score each passage for relevance to the query (0-10).\n\n"
        f"Query: \"{query}\"\n\n"
        f"Passages:\n{passages_str}"
    )

    try:
        result = llm.invoke([
            SystemMessage(content="You are a passage reranker. Score each passage for query relevance."),
            HumanMessage(content=prompt),
        ])

        score_map = {s.index: s.score for s in result.scores}
        for i, p in enumerate(passages):
            p["rerank_score"] = score_map.get(i, p.get("score", 5.0))

        passages.sort(key=lambda p: p.get("rerank_score", 0), reverse=True)
        return passages

    except Exception as e:
        print(f"[hybrid_retriever] reranking failed: {e}")
        # Fall back to original order
        return passages


def hybrid_retrieve(query: str, bot_id: str) -> dict:
    """
    Run both vector and structural retrievers, merge, dedupe, rerank.

    Returns the standardized retrieval contract:
      {
          "contexts": [...],
          "source": "hybrid",
          "scores": [...],
          "retrieval_trace": [...]
      }
    """
    with tracer.start_as_current_span("hybrid_retrieve") as span:
        # Run both retrievers
        vector_result = _vector_retrieve(query, bot_id)
        structural_result = structural_retrieve(query, bot_id)

        span.set_attribute("hybrid.vector_count", len(vector_result["contexts"]))
        span.set_attribute("hybrid.structural_count", len(structural_result["contexts"]))

        # Combine into a unified passage list
        all_passages = []
        for i, ctx in enumerate(vector_result["contexts"]):
            score = vector_result["scores"][i] if i < len(vector_result["scores"]) else 0.5
            all_passages.append({"text": ctx, "score": score, "source": "vector"})

        for i, ctx in enumerate(structural_result["contexts"]):
            score = structural_result["scores"][i] if i < len(structural_result["scores"]) else 5.0
            all_passages.append({"text": ctx, "score": score, "source": "structural"})

        if not all_passages:
            return {
                "contexts": [],
                "source": "hybrid",
                "scores": [],
                "retrieval_trace": structural_result.get("retrieval_trace", []),
            }

        # Deduplicate
        unique_passages = _deduplicate(all_passages)
        span.set_attribute("hybrid.after_dedup", len(unique_passages))

        # Rerank
        reranked = _rerank(query, unique_passages)

        # Take top-N
        top_n = reranked[:FINAL_TOP_K]

        contexts = [p["text"] for p in top_n]
        scores = [p.get("rerank_score", p.get("score", 0)) for p in top_n]

        # Combine retrieval traces
        combined_trace = structural_result.get("retrieval_trace", [])
        combined_trace.append({
            "action": "hybrid_merge",
            "vector_passages": len(vector_result["contexts"]),
            "structural_passages": len(structural_result["contexts"]),
            "after_dedup": len(unique_passages),
            "final_count": len(top_n),
        })

        span.set_attribute("hybrid.final_count", len(contexts))
        print(f"[hybrid_retriever] merged: {len(vector_result['contexts'])} vector + "
              f"{len(structural_result['contexts'])} structural → {len(contexts)} final")

        return {
            "contexts": contexts,
            "source": "hybrid",
            "scores": scores,
            "retrieval_trace": combined_trace,
        }
