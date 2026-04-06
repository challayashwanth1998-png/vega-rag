"""
End-Users API — manages authenticated end-users for the Hosted UI.
Stores hashed credentials in DynamoDB.
Keys: PK = AGENT#{bot_id}, SK = ENDUSER#{email}

Restriction model:
  Per-user `restricted_tables` list stores filenames the user CANNOT access.
  Empty list / absent field = full access to all tables.
"""
from fastapi import APIRouter, HTTPException, Response, Cookie
import boto3
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import uuid
import hashlib

from app.core.config import settings

router = APIRouter()

def _get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)

class CreateUserReq(BaseModel):
    email: str
    password: str

@router.post("/{bot_id}/users")
def add_end_user(bot_id: str, req: CreateUserReq):
    table = _get_table()
    
    # Simple sha256 hash for demo/boilerplate. In full production use bcrypt.
    pw_hash = hashlib.sha256(req.password.encode()).hexdigest()
    
    sk = f"ENDUSER#{req.email}"
    item = {
        "PK": f"AGENT#{bot_id}",
        "SK": sk,
        "email": req.email,
        "password_hash": pw_hash,
        "restricted_tables": [],   # default: no restrictions
        "createdAt": datetime.utcnow().isoformat(),
    }
    table.put_item(Item=item)
    return {"status": "success", "email": req.email}

@router.get("/{bot_id}/users")
def list_end_users(bot_id: str):
    table = _get_table()
    response = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
        ExpressionAttributeValues={
            ":pk": f"AGENT#{bot_id}",
            ":sk_prefix": "ENDUSER#",
        },
    )
    users = response.get("Items", [])
    # strip password hashes
    for u in users:
        u.pop("password_hash", None)
    return sorted(users, key=lambda x: x.get("createdAt", ""), reverse=True)

@router.delete("/{bot_id}/users/{email}")
def delete_end_user(bot_id: str, email: str):
    table = _get_table()
    table.delete_item(Key={
        "PK": f"AGENT#{bot_id}",
        "SK": f"ENDUSER#{email}"
    })
    return {"status": "deleted"}


# ── Table Access Restrictions ─────────────────────────────────────────────────

class RestrictionsReq(BaseModel):
    restricted_tables: list[str]  # filenames the user CANNOT access

@router.get("/{bot_id}/users/{email}/restrictions")
def get_user_restrictions(bot_id: str, email: str):
    """Returns which table filenames this user is restricted from accessing."""
    table = _get_table()
    resp = table.get_item(Key={"PK": f"AGENT#{bot_id}", "SK": f"ENDUSER#{email}"})
    if "Item" not in resp:
        raise HTTPException(status_code=404, detail="User not found")
    return {"restricted_tables": resp["Item"].get("restricted_tables", [])}

@router.put("/{bot_id}/users/{email}/restrictions")
def update_user_restrictions(bot_id: str, email: str, req: RestrictionsReq):
    """Sets the list of table filenames this user is NOT allowed to query."""
    table = _get_table()
    # Verify user exists
    resp = table.get_item(Key={"PK": f"AGENT#{bot_id}", "SK": f"ENDUSER#{email}"})
    if "Item" not in resp:
        raise HTTPException(status_code=404, detail="User not found")
    
    table.update_item(
        Key={"PK": f"AGENT#{bot_id}", "SK": f"ENDUSER#{email}"},
        UpdateExpression="SET restricted_tables = :r",
        ExpressionAttributeValues={":r": req.restricted_tables},
    )
    return {"status": "updated", "restricted_tables": req.restricted_tables}


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginReq(BaseModel):
    email: str
    password: str

@router.post("/{bot_id}/login")
def login_end_user(bot_id: str, req: LoginReq, response: Response):
    table = _get_table()
    resp = table.get_item(Key={"PK": f"AGENT#{bot_id}", "SK": f"ENDUSER#{req.email}"})
    
    if "Item" not in resp:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    pw_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if resp["Item"].get("password_hash") != pw_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Generate simple JWT/Token structure
    token = f"{bot_id}::{req.email}::{uuid.uuid4().hex}"
    
    # Store token securely in an HttpOnly cookie
    response.set_cookie(
        key="vegatoken", 
        value=token,
        httponly=True,
        max_age=86400 * 7, # 7 days
        samesite="lax",
        secure=False # Set to true in prod HTTPS
    )
    return {"status": "authenticated", "email": req.email}

@router.post("/{bot_id}/logout")
def logout_end_user(bot_id: str, response: Response):
    response.delete_cookie("vegatoken")
    return {"status": "logged_out"}
