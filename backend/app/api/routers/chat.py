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
import structlog

logger = structlog.get_logger("vega.api.chat")
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.semantic_cache import get_semantic_cache, set_semantic_cache

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
    log = logger.bind(tenant_id=req.bot_id, session_id=req.session_id, user_email=req.user_email)
    log.info("chat_request_started")
    
    # 0. Enforce Rate Limit (Token Bucket algorithm)
    from app.core.rate_limit import check_rate_limit
    check_rate_limit(req.bot_id, tier="free")
    
    # 0.5 Input Guardrails (Prompt Injection & PII Scrubbing)
    from app.core.guardrails import scrub_pii, check_prompt_injection
    try:
        check_prompt_injection(req.query)
        # Redact PII so the LLM never sees SSNs, Emails, or Credit Cards
        req.query = scrub_pii(req.query)
    except Exception as e:
        log.warning("security_guardrail_blocked", query=req.query)
        raise e
        
    table = _get_table()
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    current_month = datetime.datetime.utcnow().strftime("%Y-%m")

    # 1. Enforce Token Limit
    try:
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"STATS#{req.bot_id}",
                ":sk": f"DAY#{current_month}"
            }
        )
        month_tokens = sum(int(item.get("token_count", 0)) for item in response.get("Items", []))
        if month_tokens >= 250000:
            async def error_stream():
                yield f"data: {json.dumps({'text': 'Error: Monthly token limit of 250,000 reached. Please upgrade your plan.'})}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(error_stream(), media_type="text/event-stream")
    except Exception as e:
        log.error("limit_check_failed", error=str(e))

    # 2. Track usage
    try:
        table.update_item(
            Key={"PK": f"STATS#{req.bot_id}", "SK": f"DAY#{today}"},
            UpdateExpression="ADD query_count :inc",
            ExpressionAttributeValues={":inc": 1},
        )
    except Exception as e:
        log.error("usage_tracking_failed", error=str(e))

    # 3. Resolve per-user data source restrictions
    restricted_tables: list[str] = req.restricted_tables or []
    if req.user_email and not req.restricted_tables:
        # Fetch restrictions from DynamoDB unless caller already provided them
        try:
            user_resp = table.get_item(
                Key={"PK": f"AGENT#{req.bot_id}", "SK": f"ENDUSER#{req.user_email}"}
            )
            if "Item" in user_resp:
                restricted_tables = user_resp["Item"].get("restricted_tables", [])
                if restricted_tables:
                    log.info("user_restrictions_loaded", restricted_tables=restricted_tables)
        except Exception as e:
            log.error("restriction_lookup_failed", error=str(e))

    # 3.5 Semantic Cache Check
    cached_response = get_semantic_cache(req.bot_id, req.query)
    if cached_response:
        log.info("semantic_cache_hit")
        async def cached_event_generator():
            yield f"data: {json.dumps({'tools': {'intent': 'cache', 'cache_hit': True}})}\n\n"
            yield f"data: {json.dumps({'text': cached_response})}\n\n"
            yield "data: [DONE]\n\n"
            try:
                table.put_item(Item={
                    "PK": f"ACTIVITY#{req.bot_id}",
                    "SK": f"ENTRY#{req.session_id}#{datetime.datetime.utcnow().isoformat()}",
                    "session_id": req.session_id,
                    "user_msg": req.query,
                    "ai_response": cached_response,
                    "intent": "cache",
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                })
            except Exception as e:
                log.error("activity_log_write_failed", error=str(e))
        return StreamingResponse(cached_event_generator(), media_type="text/event-stream")

    # 4. Run LangGraph — router + retrieval only (no generation inside graph)
    try:
        final_state = agent_executor.invoke({
            "bot_id": req.bot_id,
            "query": req.query,
            "intent": "",
            "context": "",
            "sql_result": "",
            "restricted_tables": restricted_tables,
        })
    except Exception as e:
        log.error("langgraph_execution_failed", error=str(e))
        final_state = {"intent": "rag", "context": "", "sql_result": ""}

    intent = final_state.get("intent", "rag")
    context = final_state.get("context", "")
    sql_result = final_state.get("sql_result", "")
    log.info("langgraph_execution_success", intent=intent, context_len=len(context), sql_result_len=len(sql_result))

    # 4. Fetch agent system prompt
    system_prompt = "You are a helpful AI assistant."
    agent_name = "Custom Agent"
    try:
        cfg = table.get_item(Key={"PK": f"AGENT#{req.bot_id}", "SK": "CONFIG"})
        if "Item" in cfg:
            agent_name = cfg["Item"].get("name", agent_name)
            user_prompt = cfg["Item"].get("system_prompt", system_prompt)
            system_prompt = f"Your name is {agent_name}. {user_prompt}"
    except Exception as e:
        log.error("config_lookup_failed", error=str(e))
        system_prompt = f"Your name is {agent_name}. {system_prompt}"

    # 5. Build messages based on intent
    if intent == "casual":
        # Direct conversational answer — strict limits to prevent token waste
        strict_casual_prompt = (
            f"{system_prompt}\n\n"
            "STRICT INSTRUCTIONS:\n"
            "You are a specialized AI assistant. You are ONLY allowed to respond to standard greetings (e.g., 'hello', 'how are you') and questions specifically about your identity or purpose. "
            "DO NOT answer general knowledge questions, DO NOT entertain vague prompts, and DO NOT act as a general search engine. "
            "If the user asks anything outside of basic greetings or your direct purpose, politely decline and instruct them to ask questions related to your configured data sources."
            "Keep your responses extremely concise."
        )
        messages = [
            SystemMessage(content=strict_casual_prompt),
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

    # 6. Stream response via SSE
    llm = _get_llm()

    async def event_generator():
        # Emit debugging/tool logic payload first
        tools_payload = {
            "intent": intent,
            "sql_query_result": sql_result[:1500] if intent == "sql" else None,
            "rag_chunks_found": len(context.split("\\n\\n---\\n\\n")) if intent == "rag" and context else 0
        }
        yield f"data: {json.dumps({'tools': tools_payload})}\n\n"
        
        full_response = ""
        total_tokens = 0
        has_error = False
        try:
            for chunk in llm.stream(messages):
                text = _extract_text(chunk)
                if text and text != "[]":
                    full_response += text
                    yield f"data: {json.dumps({'text': text})}\n\n"
                # Capture token usage from last chunk (LangChain populates this)
                if hasattr(chunk, "usage_metadata") and chunk.usage_metadata:
                    usage = chunk.usage_metadata
                    total_tokens = (
                        usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
                    )
        except Exception as e:
            has_error = True
            err_msg = f"[Stream error: {e}]"
            yield f"data: {json.dumps({'text': err_msg})}\n\n"
            full_response += err_msg

        yield "data: [DONE]\n\n"

        # 7. Output Guardrails (Toxicity & Hallucination Check)
        from app.core.guardrails import check_toxicity, verify_output_groundedness
        is_toxic = check_toxicity(full_response)
        is_grounded = True
        if intent == "rag" and context:
            is_grounded = verify_output_groundedness(context, full_response)
            
        if is_toxic or not is_grounded:
            log.warning("output_guardrail_flagged", is_toxic=is_toxic, is_grounded=is_grounded)
            warning_msg = "⚠ WARNING: This response may contain unverified information or policy violations."
            yield f"data: {json.dumps({'warning': warning_msg})}\\n\\n"

        # Write to Semantic Cache if successful and SAFE
        if full_response and not has_error and not is_toxic and is_grounded:
            set_semantic_cache(req.bot_id, req.query, full_response)

        # Write real token count to DynamoDB STATS
        if total_tokens > 0:
            try:
                table.update_item(
                    Key={"PK": f"STATS#{req.bot_id}", "SK": f"DAY#{today}"},
                    UpdateExpression="ADD token_count :t",
                    ExpressionAttributeValues={":t": total_tokens},
                )
            except Exception as e:
                log.error("token_count_write_failed", error=str(e))

        # 7. Log conversation to DynamoDB
        try:
            table.put_item(Item={
                "PK": f"ACTIVITY#{req.bot_id}",
                "SK": f"ENTRY#{req.session_id}#{datetime.datetime.utcnow().isoformat()}",
                "session_id": req.session_id,
                "user_msg": req.query,
                "ai_response": full_response,
                "intent": intent,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "flagged_toxic": is_toxic,
                "flagged_hallucination": not is_grounded,
            })
            log.info("chat_request_completed", total_tokens=total_tokens)
        except Exception as e:
            log.error("activity_log_write_failed", error=str(e))

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/activity/session/{session_id}")
async def get_session_activity(session_id: str):
    try:
        table = _get_table()
        # Scan for session_id explicitly since we don't know the bot_id PK from UI side
        from boto3.dynamodb.conditions import Attr
        response = table.scan(FilterExpression=Attr("session_id").eq(session_id))
        items = response.get("Items", [])
        # Sort by timestamp
        items.sort(key=lambda x: x.get("timestamp", ""))
        return items
    except Exception as e:
        logger.error("scan_activities_failed", session_id=session_id, error=str(e))
        return []
