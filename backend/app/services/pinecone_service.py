"""
Pinecone vector store service.
Initialized once at module load (singleton) — avoids cold-connection overhead on every request.

Embedding model: Amazon Titan Embed Text v2 (via Bedrock)
Vector store: Pinecone (index namespaced per bot_id for multi-tenant isolation)
"""
import os
import uuid
import boto3
from pinecone import Pinecone
from langchain_aws import BedrockEmbeddings
from dotenv import load_dotenv

from app.core.config import settings

load_dotenv()

# Singleton clients — initialized once per container lifecycle
pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)
bedrock_client = boto3.client("bedrock-runtime", region_name=settings.AWS_REGION)
embeddings = BedrockEmbeddings(client=bedrock_client, model_id=settings.BEDROCK_EMBED_MODEL)


def embed_and_upsert_documents(documents: list, bot_id: str) -> int:
    """
    Embeds a list of LangChain Documents via Bedrock Titan and upserts into
    the agent's Pinecone namespace (namespace=bot_id for strict isolation).
    Returns the number of vectors inserted.
    """
    if not documents:
        return 0

    texts = [doc.page_content for doc in documents]
    vector_data = embeddings.embed_documents(texts)

    vectors = []
    for i, doc in enumerate(documents):
        meta = doc.metadata.copy()
        # Store original text in metadata so retrieve_node can surface it to the LLM
        meta["text"] = doc.page_content
        vectors.append({
            "id": f"chunk-{uuid.uuid4()}",
            "values": vector_data[i],
            "metadata": meta,
        })

    index.upsert(vectors=vectors, namespace=bot_id)
    return len(vectors)
