"""
Pinecone vector store service — with Contextual Retrieval (Anthropic, 2024).

Standard RAG embeds each chunk in isolation, losing surrounding context.
Example problem: chunk says "He approved it" — but who is "He"?

Contextual Retrieval fix:
  Before embedding each chunk, an LLM generates a 1-2 sentence description
  of where that chunk sits in the document and what it's about.
  That context is prepended to the chunk text before embedding.

  Result: every vector now carries full-document awareness.
  Retrieval precision improves 30-50% on real enterprise docs (Anthropic study).

This is distinct from LangChain's ParentDocumentRetriever — we enrich the
*embedding input*, not the returned text. The LLM still receives the original
clean chunk, not the enriched version.

Embedding model : Amazon Titan Embed Text v2 (via Bedrock)
Vector store    : Pinecone (namespaced per bot_id for multi-tenant isolation)
"""
import os
import uuid
import math
import boto3
from collections import Counter
from pinecone import Pinecone
from langchain_aws import BedrockEmbeddings, ChatBedrockConverse
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

from app.core.config import settings

load_dotenv()

# ── Singleton clients ─────────────────────────────────────────────────────────
pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)
bedrock_client = boto3.client("bedrock-runtime", region_name=settings.AWS_REGION)
embeddings = BedrockEmbeddings(client=bedrock_client, model_id=settings.BEDROCK_EMBED_MODEL)


# ── Contextual Retrieval (Anthropic, 2024) ────────────────────────────────────

def _generate_chunk_context(full_text: str, chunk_text: str) -> str:
    """
    Uses Nova Micro to generate a succinct 1-2 sentence context for a chunk
    within the scope of its parent document.

    This implements 'Contextual Retrieval' — the key insight is that chunks
    embedded IN CONTEXT of the whole document produce dramatically better
    retrieval than chunks embedded in isolation.
    """
    llm = ChatBedrockConverse(
        client=bedrock_client,
        model=settings.BEDROCK_CHAT_MODEL,
        max_tokens=120,
    )
    prompt = (
        "<document>\n"
        f"{full_text[:4000]}\n"
        "</document>\n\n"
        "<chunk>\n"
        f"{chunk_text[:500]}\n"
        "</chunk>\n\n"
        "Write 1-2 sentences of context explaining where this chunk fits in the "
        "document and what it discusses. Be extremely concise. Output ONLY the context, "
        "no preamble, no labels."
    )
    try:
        resp = llm.invoke([HumanMessage(content=prompt)])
        ctx = resp.content.strip()
        # Sanity check — don't use garbage output
        return ctx if len(ctx) > 10 else ""
    except Exception as e:
        print(f"[contextual_retrieval] context generation failed: {e}")
        return ""


# ── Ingestion ─────────────────────────────────────────────────────────────────

def embed_and_upsert_documents(
    documents: list,
    bot_id: str,
    full_text: str = "",
    use_contextual_retrieval: bool = True,
) -> int:
    """
    Embeds a list of LangChain Documents and upserts into Pinecone.

    If `full_text` is provided and `use_contextual_retrieval=True`:
      - Generates LLM context for each chunk (contextual retrieval)
      - Embeds the ENRICHED text (context + chunk)
      - Stores the ORIGINAL chunk text in metadata (so LLM gets clean output)

    Returns the number of vectors inserted.
    """
    if not documents:
        return 0

    texts_to_embed = []
    for doc in documents:
        if full_text and use_contextual_retrieval:
            ctx = _generate_chunk_context(full_text, doc.page_content)
            if ctx:
                # Prepend context to chunk for embedding only
                enriched = f"{ctx}\n\n{doc.page_content}"
                print(f"[contextual_retrieval] enriched chunk: {ctx[:60]}…")
            else:
                enriched = doc.page_content
        else:
            enriched = doc.page_content
        texts_to_embed.append(enriched)

    vector_data = embeddings.embed_documents(texts_to_embed)

    vectors = []
    for i, doc in enumerate(documents):
        meta = doc.metadata.copy()
        # Always store ORIGINAL text — LLM receives clean chunks
        meta["text"] = doc.page_content
        vectors.append({
            "id": f"chunk-{uuid.uuid4()}",
            "values": vector_data[i],
            "metadata": meta,
        })

    index.upsert(vectors=vectors, namespace=bot_id)
    print(f"[pinecone] upserted {len(vectors)} contextual vectors for bot {bot_id}")
    return len(vectors)


# ── BM25 Keyword Scoring (for Hybrid Search) ──────────────────────────────────

def bm25_score(query: str, text: str, avg_doc_len: int = 150, k1: float = 1.5, b: float = 0.75) -> float:
    """
    Lightweight in-memory BM25 score for a query against a document chunk.
    Used by the hybrid search pipeline to provide keyword-match signals
    alongside semantic vector similarity.
    """
    query_terms = query.lower().split()
    doc_terms = text.lower().split()
    doc_len = len(doc_terms)
    term_freq = Counter(doc_terms)

    score = 0.0
    for term in query_terms:
        tf = term_freq.get(term, 0)
        if tf == 0:
            continue
        numerator = tf * (k1 + 1)
        denominator = tf + k1 * (1 - b + b * doc_len / avg_doc_len)
        score += numerator / denominator
    return score


def reciprocal_rank_fusion(
    vector_matches: list,
    bm25_scores: dict,
    k: int = 60,
) -> list:
    """
    Merges vector search results and BM25 keyword scores into a single
    ranked list using Reciprocal Rank Fusion (RRF).

    RRF formula: score(d) = Σ 1 / (k + rank(d))

    Returns list of (match_dict, rrf_score) sorted best-first.
    """
    match_by_id = {m["id"]: m for m in vector_matches}
    rrf: dict[str, float] = {}

    # Vector ranks (Pinecone returns already sorted by cosine score)
    for rank, match in enumerate(vector_matches):
        mid = match["id"]
        rrf[mid] = rrf.get(mid, 0.0) + 1.0 / (k + rank + 1)

    # BM25 ranks
    bm25_ranked = sorted(bm25_scores.items(), key=lambda x: x[1], reverse=True)
    for rank, (mid, _) in enumerate(bm25_ranked):
        rrf[mid] = rrf.get(mid, 0.0) + 1.0 / (k + rank + 1)

    sorted_ids = sorted(rrf.items(), key=lambda x: x[1], reverse=True)
    return [(match_by_id[mid], score) for mid, score in sorted_ids if mid in match_by_id]
