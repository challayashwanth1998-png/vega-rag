from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
import os
import uuid
from datetime import datetime

router = APIRouter()

class CreateAgentReq(BaseModel):
    name: str
    user_email: str

@router.post("")
def create_agent(req: CreateAgentReq):
    """Creates a new agent tied specifically to the user's email in DynamoDB"""
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    
    bot_id = f"bot_{uuid.uuid4().hex[:8]}"
    item = {
        "PK": f"USER#{req.user_email}",
        "SK": f"AGENT#{bot_id}",
        "bot_id": bot_id,
        "name": req.name,
        "status": "Draft",
        "createdAt": datetime.utcnow().isoformat()
    }
    table.put_item(Item=item)
    return item

@router.get("")
def list_agents(user_email: str):
    """Lists only the agents belonging to the authenticated user"""
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"USER#{user_email}",
            ":sk_prefix": "AGENT#"
        }
    )
    # Sort backwards so newest is first
    items = sorted(response.get("Items", []), key=lambda x: x.get('createdAt', ''), reverse=True)
    return items

@router.get("/{bot_id}/sources")
def list_sources(bot_id: str):
    """Lists all the URLs/Files uploaded specifically to this Agent's Brain"""
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"AGENT#{bot_id}",
            ":sk_prefix": "SOURCE#"
        }
    )
    return response.get("Items", [])


@router.get("/{bot_id}/analytics")
def get_analytics(bot_id: str):
    """Retrieves the last 30 days of query usage for the bot for Recharts rendering."""
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"STATS#{bot_id}",
            ":sk_prefix": "DAY#"
        }
    )
    items = response.get("Items", [])
    
    chart_data = []
    from datetime import datetime
    for item in items:
        day_str = item["SK"].replace("DAY#", "")
        # Render a pretty date like Mar 26
        try:
            dt = datetime.strptime(day_str, "%Y-%m-%d")
            formatted_date = dt.strftime("%b %d")
        except:
            formatted_date = day_str
            
        chart_data.append({
            "name": formatted_date,
            "raw_date": day_str,
            "queries": int(item.get("query_count", 0))
        })
        
    return sorted(chart_data, key=lambda x: x["raw_date"])


@router.get("/{bot_id}/activity")
def get_activity(bot_id: str):
    """Retrieves all chat logs generated across all user browser instances specifically for this Bot"""
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"ACTIVITY#{bot_id}",
            ":sk_prefix": "ENTRY#"
        }
    )
    
    items = response.get("Items", [])
    # Sort backwards so newest interaction hits the UI first natively
    return sorted(items, key=lambda x: x.get("timestamp", x["SK"]), reverse=True)


class UpdateConfigReq(BaseModel):
    system_prompt: str
    brand_color: str = "#2563eb"
    name: str = "My Custom Agent"

@router.put("/{bot_id}/config")
def update_agent_config(bot_id: str, req: UpdateConfigReq):
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    table.put_item(Item={
        "PK": f"AGENT#{bot_id}",
        "SK": "CONFIG",
        "system_prompt": req.system_prompt,
        "brand_color": req.brand_color,
        "name": req.name
    })
    return {"status": "saved"}
    
@router.get("/{bot_id}/config")
def get_agent_config(bot_id: str):
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION'))
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME'))
    resp = table.get_item(Key={"PK": f"AGENT#{bot_id}", "SK": "CONFIG"})
    if "Item" in resp:
        return resp["Item"]
    return {
        "system_prompt": "You are a brilliant, concise AI assistant. Answer accurately based strictly on the context provided.",
        "brand_color": "#2563eb",
        "name": "Custom Agent"
    }
