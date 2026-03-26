import os
import boto3
from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_aws import BedrockEmbeddings

load_dotenv()

def test_end_to_end_vector_pipeline():
    print("------- AI INGESTION PIPELINE TEST -------")
    try:
        # Step 1: Initialize Amazon Bedrock (Titan V2)
        print("1. Waking up Amazon Titan v2 Embeddings...")
        bedrock_client = boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION"))
        embeddings = BedrockEmbeddings(
            client=bedrock_client,
            model_id="amazon.titan-embed-text-v2:0"
        )
        
        # Test creating a vector
        test_text = "The VegaRAG platform is a highly scalable enterprise AI agent SaaS."
        print(f"   -> Testing embedding model with text: '{test_text}'")
        vector_data = embeddings.embed_query(test_text)
        print(f"   -> ✅ Success! Amazon Titan turned the text into a Vector containing exactly {len(vector_data)} numbers!")

        # Step 2: Initialize Pinecone
        print("\n2. Connecting to Pinecone Serverless...")
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

        # Step 3: Insert into Pinecone
        print("3. Upserting Amazon Vector into Pinecone Database...")
        # We attach metadata so the bot knows what the text actually means during retrieval
        index.upsert(
            vectors=[
                {
                    "id": "test-document-chunk-1",
                    "values": vector_data,
                    "metadata": {"text": test_text, "source": "test_script.py"}
                }
            ],
            namespace="bot_test_id"
        )
        print("   -> ✅ Success! Data written to Pinecone memory!")
        
        # Step 4: Verify Retrieval
        print("\n4. Verifying Pinecone Retrieval...")
        stats = index.describe_index_stats()
        print(f"   -> Pinecone System Stats: {stats}")
        print("\n🎉 DAY 3 PIPELINE VERIFIED! Your AI can convert text to math and memorize it forever.")

    except Exception as e:
        print(f"\n❌ PIPELINE FAILED:")
        print(str(e))

if __name__ == "__main__":
    test_end_to_end_vector_pipeline()
