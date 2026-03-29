"""
Agents router — CRUD for agents, sources, analytics, activity, config, and workflow.
All DynamoDB access uses the single-table design (PlatformDB).

Key Patterns:
  USER#<email>   / AGENT#<bot_id>    — agent metadata
  AGENT#<bot_id> / SOURCE#<...>      — ingested data sources
  AGENT#<bot_id> / CONFIG            — system prompt & brand settings
  AGENT#<bot_id> / WORKFLOW          — ReactFlow canvas state (nodes + edges)
  STATS#<bot_id> / DAY#<YYYY-MM-DD>  — daily query count
  ACTIVITY#<bot_id> / ENTRY#<...>    — chat logs
"""
from fastapi import APIRouter, HTTPException
import boto3
import uuid
from datetime import datetime

from app.core.config import settings
from app.schemas.models import CreateAgentReq, UpdateConfigReq, WorkflowReq

router = APIRouter()


def _get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)


# ── Agent CRUD ────────────────────────────────────────────────────────────────

@router.post("")
def create_agent(req: CreateAgentReq):
    """Creates a new agent tied to the user's email (Cognito sub or email as PK)."""
    table = _get_table()
    bot_id = f"bot_{uuid.uuid4().hex[:8]}"
    item = {
        "PK": f"USER#{req.user_email}",
        "SK": f"AGENT#{bot_id}",
        "bot_id": bot_id,
        "name": req.name,
        "status": "Draft",
        "createdAt": datetime.utcnow().isoformat(),
    }
    table.put_item(Item=item)
    return item


@router.get("")
def list_agents(user_email: str):
    """Lists all agents for a user, newest first."""
    table = _get_table()
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"USER#{user_email}",
            ":sk_prefix": "AGENT#",
        },
    )
    return sorted(response.get("Items", []), key=lambda x: x.get("createdAt", ""), reverse=True)


# ── Data Sources ──────────────────────────────────────────────────────────────

@router.get("/{bot_id}/sources")
def list_sources(bot_id: str):
    """Lists all ingested sources (URLs, PDFs, text) for this agent's Pinecone namespace."""
    table = _get_table()
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"AGENT#{bot_id}",
            ":sk_prefix": "SOURCE#",
        },
    )
    return response.get("Items", [])


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/{bot_id}/analytics")
def get_analytics(bot_id: str):
    """Returns daily query counts for the last 30 days, formatted for Recharts."""
    table = _get_table()
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"STATS#{bot_id}",
            ":sk_prefix": "DAY#",
        },
    )
    chart_data = []
    for item in response.get("Items", []):
        day_str = item["SK"].replace("DAY#", "")
        try:
            formatted_date = datetime.strptime(day_str, "%Y-%m-%d").strftime("%b %d")
        except ValueError:
            formatted_date = day_str
        chart_data.append({"name": formatted_date, "raw_date": day_str, "queries": int(item.get("query_count", 0))})
    return sorted(chart_data, key=lambda x: x["raw_date"])


# ── Activity ──────────────────────────────────────────────────────────────────

@router.get("/{bot_id}/activity")
def get_activity(bot_id: str):
    """Returns all chat logs for this agent, newest first."""
    table = _get_table()
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"ACTIVITY#{bot_id}",
            ":sk_prefix": "ENTRY#",
        },
    )
    return sorted(response.get("Items", []), key=lambda x: x.get("timestamp", x["SK"]), reverse=True)


# ── Agent Config (system prompt, brand color) ─────────────────────────────────

@router.put("/{bot_id}/config")
def update_agent_config(bot_id: str, req: UpdateConfigReq):
    table = _get_table()
    table.put_item(Item={
        "PK": f"AGENT#{bot_id}",
        "SK": "CONFIG",
        "system_prompt": req.system_prompt,
        "brand_color": req.brand_color,
        "name": req.name,
    })
    return {"status": "saved"}


@router.get("/{bot_id}/config")
def get_agent_config(bot_id: str):
    table = _get_table()
    resp = table.get_item(Key={"PK": f"AGENT#{bot_id}", "SK": "CONFIG"})
    if "Item" in resp:
        return resp["Item"]
    return {
        "system_prompt": "You are a brilliant, concise AI assistant. Answer accurately based strictly on the context provided.",
        "brand_color": "#2563eb",
        "name": "Custom Agent",
    }


# ── Workflow (ReactFlow canvas state) ─────────────────────────────────────────

@router.put("/{bot_id}/workflow")
def update_agent_workflow(bot_id: str, req: WorkflowReq):
    """Persists the visual Workflow Studio canvas state to DynamoDB."""
    table = _get_table()
    table.put_item(Item={
        "PK": f"AGENT#{bot_id}",
        "SK": "WORKFLOW",
        "nodes": req.nodes,
        "edges": req.edges,
        "updatedAt": datetime.utcnow().isoformat(),
    })
    return {"status": "workflow saved"}


@router.get("/{bot_id}/workflow")
def get_agent_workflow(bot_id: str):
    """Retrieves the saved Workflow Studio canvas; returns starter template if not yet saved."""
    table = _get_table()
    resp = table.get_item(Key={"PK": f"AGENT#{bot_id}", "SK": "WORKFLOW"})
    if "Item" in resp:
        return resp["Item"]
    # Default starter canvas
    return {
        "nodes": [
            {"id": "1", "type": "start", "position": {"x": 250, "y": 50}, "data": {"message": "Hello! How can I help you?"}},
            {"id": "2", "type": "chat", "position": {"x": 250, "y": 350}, "data": {"label": "AI Engine"}},
        ],
        "edges": [
            {"id": "e1-2", "source": "1", "target": "2", "animated": True, "style": {"stroke": "#94a3b8", "strokeWidth": 2}},
        ],
    }
