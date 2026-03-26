from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import boto3
import os
import json
from app.agent.graph import agent_executor
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    bot_id: str
    session_id: str = "default_session"

@router.post("/chat")
async def chat_stream(req: ChatRequest):
    """
    Executes the LangGraph to grab memory context, then streams the Nova Micro answer.
    """
    # 1. Track Usage Analytics atomically in DynamoDB
    import datetime
    try:
        dynamodb = boto3.resource('dynamodb', region_name=os.getenv("AWS_REGION"))
        table = dynamodb.Table(os.getenv("DYNAMODB_TABLE_NAME"))
        today_str = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        table.update_item(
            Key={'PK': f"STATS#{req.bot_id}", 'SK': f"DAY#{today_str}"},
            UpdateExpression="ADD query_count :inc",
            ExpressionAttributeValues={":inc": 1}
        )
    except Exception as e:
        print(f"Skipping usage metrics insertion: {e}")

    # 2. Run the LangGraph Node to fetch Pinecone Memory
    state = {"bot_id": req.bot_id, "query": req.query, "context": ""}
    final_state = agent_executor.invoke(state)
    retrieved_memory = final_state["context"]

    # 2.5 Retrieve the Dynamic Override Persona Config
    try:
        config_resp = table.get_item(Key={"PK": f"AGENT#{req.bot_id}", "SK": "CONFIG"})
        if "Item" in config_resp:
            system_prompt = config_resp["Item"].get("system_prompt", "You are a brilliant, concise AI assistant for VegaRAG.")
        else:
            system_prompt = "You are a brilliant, concise AI assistant for VegaRAG. Answer accurately based on the context."
    except Exception as e:
        print(f"DynamoDB Prompt Override failed: {e}")
        system_prompt = "You are a brilliant, concise AI assistant for VegaRAG. Answer accurately based on the context."

    # Smaller models like Nova Micro perform radically better when context is deeply injected into the Human prompt
    human_payload = f"""Answer the question using ONLY the following context.
If you cannot answer the question using the context, simply say "I don't have enough information in my memory banks."

<context>
{retrieved_memory}
</context>

Question: {req.query}"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_payload)
    ]

    # Initialize Nova Micro LLM for Speed
    nova_client = boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION"))
    llm = ChatBedrockConverse(
        client=nova_client,
        model="amazon.nova-micro-v1:0"
    )

    # 4. Create the Server-Sent Event (SSE) Generator
    async def event_generator():
        full_synthetic_response = ""
        # Stream character by character matching ChatGPT fluidity
        for chunk in llm.stream(messages):
            text = ""
            
            # Bedrock Converse sometimes outputs empty arrays `[]` 
            # for initial connection and closing connection events.
            if isinstance(chunk.content, list):
                if len(chunk.content) > 0:
                    if isinstance(chunk.content[0], dict):
                        text = chunk.content[0].get("text", "")
                    elif isinstance(chunk.content[0], str):
                        text = chunk.content[0]
            elif isinstance(chunk.content, str):
                text = chunk.content
                
            if text and text != "[]":
                full_synthetic_response += text
                # Format into standard SSE output
                yield f"data: {json.dumps({'text': text})}\n\n"
        
        # Closing event
        yield "data: [DONE]\n\n"

        # 5. Log the entire conversation natively into DynamoDB Activity Store
        try:
            dynamodb = boto3.resource('dynamodb', region_name=os.getenv("AWS_REGION"))
            table = dynamodb.Table(os.getenv("DYNAMODB_TABLE_NAME"))
            table.put_item(Item={
                "PK": f"ACTIVITY#{req.bot_id}",
                "SK": f"ENTRY#{req.session_id}#{datetime.datetime.utcnow().isoformat()}",
                "session_id": req.session_id,
                "user_msg": req.query,
                "ai_response": full_synthetic_response,
                "timestamp": datetime.datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"Skipping activity insert: {e}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")
