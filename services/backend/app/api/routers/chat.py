"""
Chat router — SSE streaming endpoint.

Flow per request:
  1. Increment DynamoDB daily query counter
  2. Run LangGraph: classifies intent → retrieves context / SQL result
  3. Based on intent, build the right prompt and stream via Bedrock Nova SSE
     - casual → direct LLM, no context
     - rag    → RAG prompt with Pinecone chunks injected
     - sql    → format the DuckDB result table as a natural language answer
  4. Log full conversation to DynamoDB ACTIVITY after stream closes
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import boto3
import json
import datetime

from app.core.config import settings
from app.schemas.models import ChatRequest
from app.agent.graph import agent_executor
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage

router = APIRouter()


def _get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)


def _get_llm():
    return ChatBedrockConverse(
        client=boto3.client("bedrock-runtime", region_name=settings.AWS_REGION),
        model=settings.BEDROCK_CHAT_MODEL,
    )


def _extract_text(chunk) -> str:
    """Safely extract text from a Bedrock streaming chunk."""
    if isinstance(chunk.content, list) and chunk.content:
        first = chunk.content[0]
        return first.get("text", "") if isinstance(first, dict) else (first if isinstance(first, str) else "")
    elif isinstance(chunk.content, str):
        return chunk.content
    return ""


@router.post("/chat")
async def chat_stream(req: ChatRequest):
    table = _get_table()
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")

    # 1. Track usage
    try:
        table.update_item(
            Key={"PK": f"STATS#{req.bot_id}", "SK": f"DAY#{today}"},
            UpdateExpression="ADD query_count :inc",
            ExpressionAttributeValues={":inc": 1},
        )
    except Exception as e:
        print(f"[chat] usage skip: {e}")

    # 2. Run LangGraph — router + retrieval only (no generation inside graph)
    try:
        final_state = agent_executor.invoke({
            "bot_id": req.bot_id,
            "query": req.query,
            "intent": "",
            "context": "",
            "sql_result": "",
        })
    except Exception as e:
        print(f"[chat] graph error: {e}")
        final_state = {"intent": "rag", "context": "", "sql_result": ""}

    intent = final_state.get("intent", "rag")
    context = final_state.get("context", "")
    sql_result = final_state.get("sql_result", "")
    print(f"[chat] intent={intent}, context_len={len(context)}, sql_result_len={len(sql_result)}")

    # 3. Fetch agent system prompt
    system_prompt = "You are a helpful AI assistant for VegaRAG."
    try:
        cfg = table.get_item(Key={"PK": f"AGENT#{req.bot_id}", "SK": "CONFIG"})
        if "Item" in cfg:
            system_prompt = cfg["Item"].get("system_prompt", system_prompt)
    except Exception as e:
        print(f"[chat] config skip: {e}")

    # 4. Build messages based on intent
    if intent == "casual":
        # Direct conversational answer — no context needed
        messages = [
            SystemMessage(content=f"{system_prompt} Be friendly and concise."),
            HumanMessage(content=req.query),
        ]

    elif intent == "sql":
        # SQL result → ask LLM to format it as natural language
        if not sql_result or sql_result.startswith("No CSV"):
            human_content = f"The user asked: {req.query}\n\nUnfortunately, no data tables have been uploaded to this agent yet. Please ask them to upload a CSV or Excel file first."
        else:
            human_content = f"""The user asked: {req.query}

Here is the result from running a SQL query on their uploaded data:

{sql_result}

Present this result clearly in natural language. Include key numbers and insights."""
        messages = [
            SystemMessage(content="You are a data analyst AI. Present query results clearly and helpfully."),
            HumanMessage(content=human_content),
        ]

    else:
        # RAG — inject Pinecone context
        if context:
            human_content = f"""Answer the question using ONLY the following context from the user's documents.
If you cannot find the answer in the context, say: "I don't have enough information about that in my knowledge base."

<context>
{context}
</context>

Question: {req.query}"""
        else:
            human_content = f"""The user asked: {req.query}

No relevant documents were found in the knowledge base. Let them know they should upload relevant documents (PDFs, URLs, or text) to the Data Sources section first."""
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_content),
        ]

    # 5. Stream response via SSE
    llm = _get_llm()

    async def event_generator():
        full_response = ""
        try:
            for chunk in llm.stream(messages):
                text = _extract_text(chunk)
                if text and text != "[]":
                    full_response += text
                    yield f"data: {json.dumps({'text': text})}\n\n"
        except Exception as e:
            err_msg = f"[Stream error: {e}]"
            yield f"data: {json.dumps({'text': err_msg})}\n\n"
            full_response += err_msg

        yield "data: [DONE]\n\n"

        # 6. Log conversation to DynamoDB
        try:
            table.put_item(Item={
                "PK": f"ACTIVITY#{req.bot_id}",
                "SK": f"ENTRY#{req.session_id}#{datetime.datetime.utcnow().isoformat()}",
                "session_id": req.session_id,
                "user_msg": req.query,
                "ai_response": full_response,
                "intent": intent,
                "timestamp": datetime.datetime.utcnow().isoformat(),
            })
        except Exception as e:
            print(f"[chat] activity log skip: {e}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")
