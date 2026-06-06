"""
Retrieval Router — picks vector | structural | hybrid strategy per query.

Called when intent == rag. Uses Nova Micro structured output to classify
the query and select the optimal retrieval strategy.

Decision logic:
  1. If retrieval_mode is pinned (not "auto") → use that mode directly
  2. If no document trees exist → always "vector" (backward-compatible)
  3. If "auto" → LLM classifies query type:
     - Section-oriented / structural queries → "structural"
     - Semantic / conversational queries → "vector"
     - Mixed or ambiguous → "hybrid"
"""
import boto3
from opentelemetry import trace
from pydantic import BaseModel, Field
from typing import Literal
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings
from app.services.tree_service import has_document_trees

tracer = trace.get_tracer(__name__)


class RetrievalStrategy(BaseModel):
    """LLM decision on which retrieval strategy to use."""
    strategy: Literal["vector", "structural", "hybrid"] = Field(
        ...,
        description=(
            "Choose 'structural' for queries asking about specific sections, chapters, "
            "headings, or document structure (e.g. 'what does section 3 say', "
            "'where does the document mention X', 'summarize the benefits section'). "
            "Choose 'vector' for open-ended semantic queries, conversational questions, "
            "or paraphrase-style lookups (e.g. 'what are the company policies on remote work'). "
            "Choose 'hybrid' when the query mixes both patterns, references multiple "
            "document types, or you are not confident in either choice."
        )
    )
    confidence: float = Field(
        description="Confidence in the strategy choice, 0.0-1.0"
    )


def _get_llm(max_tokens: int = 256):
    return ChatBedrockConverse(
        client=boto3.client("bedrock-runtime", region_name=settings.AWS_REGION),
        model=settings.BEDROCK_CHAT_MODEL,
        max_tokens=max_tokens,
    )


def pick_retrieval_strategy(
    query: str,
    bot_id: str,
    retrieval_mode: str = "auto",
) -> str:
    """
    Determine which retrieval strategy to use for this query.

    Args:
        query: The user's query text
        bot_id: The agent ID (to check for tree existence)
        retrieval_mode: Agent config setting — "auto", "vector", "structural", or "hybrid"

    Returns:
        One of: "vector", "structural", "hybrid"
    """
    with tracer.start_as_current_span("pick_retrieval_strategy") as span:
        span.set_attribute("retrieval.configured_mode", retrieval_mode)

        # ── Pinned mode: skip all logic ───────────────────────────────────────
        if retrieval_mode in ("vector", "structural", "hybrid"):
            # For structural/hybrid, verify trees exist; fall back to vector if not
            if retrieval_mode in ("structural", "hybrid"):
                if not has_document_trees(bot_id):
                    print(f"[retrieval_router] mode={retrieval_mode} but no trees → fallback to vector")
                    span.set_attribute("retrieval.fallback", "no_trees")
                    return "vector"
            span.set_attribute("retrieval.strategy", retrieval_mode)
            print(f"[retrieval_router] pinned mode: {retrieval_mode}")
            return retrieval_mode

        # ── Auto mode ─────────────────────────────────────────────────────────
        # First check: do trees even exist?
        trees_exist = has_document_trees(bot_id)
        span.set_attribute("retrieval.trees_exist", trees_exist)

        if not trees_exist:
            print(f"[retrieval_router] auto mode, no trees → vector")
            span.set_attribute("retrieval.strategy", "vector")
            return "vector"

        # Trees exist — ask LLM to classify the query
        try:
            llm = _get_llm().with_structured_output(RetrievalStrategy)
            result = llm.invoke([
                SystemMessage(content=(
                    "You are a retrieval strategy classifier. Based on the user's query, "
                    "decide the best retrieval approach. Consider:\n"
                    "- 'structural': query asks about specific sections, chapters, or document structure\n"
                    "- 'vector': query is semantic, conversational, or paraphrase-based\n"
                    "- 'hybrid': query is ambiguous or mixes both patterns"
                )),
                HumanMessage(content=f"Query: {query}"),
            ])

            strategy = result.strategy
            confidence = result.confidence
            span.set_attribute("retrieval.strategy", strategy)
            span.set_attribute("retrieval.confidence", confidence)

            # Low confidence → upgrade to hybrid for safety
            if confidence < 0.6 and strategy != "hybrid":
                print(f"[retrieval_router] low confidence ({confidence:.2f}) → upgrading to hybrid")
                strategy = "hybrid"
                span.set_attribute("retrieval.upgraded_to_hybrid", True)

            print(f"[retrieval_router] auto → {strategy} (confidence={confidence:.2f})")
            return strategy

        except Exception as e:
            print(f"[retrieval_router] LLM classification failed: {e} → fallback to vector")
            span.record_exception(e)
            span.set_attribute("retrieval.strategy", "vector")
            span.set_attribute("retrieval.fallback", "llm_error")
            return "vector"
