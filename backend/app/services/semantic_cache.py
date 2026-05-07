import hashlib
from app.services.pinecone_service import index, embeddings
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

CACHE_NAMESPACE_PREFIX = "cache_"
SIMILARITY_THRESHOLD = 0.95

def get_semantic_cache(bot_id: str, query: str):
    """
    Search the semantic cache for a highly similar query.
    If found (score > 0.95), return the cached response.
    """
    namespace = f"{CACHE_NAMESPACE_PREFIX}{bot_id}"
    with tracer.start_as_current_span("semantic_cache_get") as span:
        try:
            query_vector = embeddings.embed_query(query)
            results = index.query(
                namespace=namespace,
                vector=query_vector,
                top_k=1,
                include_metadata=True
            )
            matches = results.get("matches", [])
            if matches:
                best_match = matches[0]
                score = best_match.get("score", 0)
                span.set_attribute("cache.best_score", score)
                
                if score >= SIMILARITY_THRESHOLD:
                    span.set_attribute("cache.hit", True)
                    return best_match.get("metadata", {}).get("response")
            
            span.set_attribute("cache.hit", False)
            return None
        except Exception as e:
            span.record_exception(e)
            return None

def set_semantic_cache(bot_id: str, query: str, response: str):
    """
    Save a query and its response to the semantic cache.
    """
    namespace = f"{CACHE_NAMESPACE_PREFIX}{bot_id}"
    with tracer.start_as_current_span("semantic_cache_set") as span:
        try:
            query_vector = embeddings.embed_query(query)
            # Use hash of query as vector ID
            vector_id = hashlib.sha256(query.encode()).hexdigest()
            index.upsert(
                vectors=[{
                    "id": vector_id,
                    "values": query_vector,
                    "metadata": {"query": query, "response": response}
                }],
                namespace=namespace
            )
        except Exception as e:
            span.record_exception(e)
