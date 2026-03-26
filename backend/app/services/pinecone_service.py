import os
import boto3
from pinecone import Pinecone
from langchain_aws import BedrockEmbeddings
import uuid
from dotenv import load_dotenv

load_dotenv()

# Initialize globally to prevent waking up API on every single web request
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))
bedrock_client = boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION"))
embeddings = BedrockEmbeddings(client=bedrock_client, model_id="amazon.titan-embed-text-v2:0")

def embed_and_upsert_documents(documents: list, bot_id: str):
    """Takes chunked Langchain Documents, embeds them via Amazon, and sends to Pinecone."""
    if not documents:
        return 0
        
    # Extract raw text array for bulk embedding
    texts = [doc.page_content for doc in documents]
    
    # Bedrock Titan V2 bulk math conversion
    vector_data_list = embeddings.embed_documents(texts)
    
    # Format exactly how Pinecone expects the JSON
    vectors_to_upsert = []
    for i, doc in enumerate(documents):
        # We MUST manually add the text content into metadata so we can read it back out later!
        meta = doc.metadata.copy()
        meta["text"] = doc.page_content
        
        vectors_to_upsert.append({
            "id": f"chunk-{uuid.uuid4()}",
            "values": vector_data_list[i],
            "metadata": meta
        })
        
    # Bulk insert into the specific bot's walled garden (Namespace)
    index.upsert(vectors=vectors_to_upsert, namespace=bot_id)
    return len(vectors_to_upsert)
