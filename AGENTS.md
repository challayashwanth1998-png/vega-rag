# AGENTS.md — VegaRAG Codebase Intelligence Guide

> **Purpose:** This document is written for agentic AI systems (Claude, Gemini, GPT-4, etc.) that need to understand, modify, debug, or deploy the VegaRAG codebase. Read this before making any changes.

---

## 1. System Overview

VegaRAG is a **multi-tenant AI Agent SaaS platform**. Businesses ("admins") create AI "bots" (agents) that their end-users chat with. Each bot can:
- Answer questions using uploaded documents (RAG via Pinecone)
- Query uploaded CSV/Excel files (Text-to-SQL via DuckDB)
- Restrict specific users from accessing specific data tables

**Three deployable services:**

| Service | Tech | Port | Role |
|---------|------|------|------|
| `backend/` | FastAPI + Python 3.11 | 8000 | Brain — LangGraph agent, data, chat |
| `frontend/` | Next.js 14 | 3000 | Admin dashboard (multi-tenant management) |
| `agent-chat-ui/` | Next.js 14 | 3001 | End-user chat interface |

---

## 2. Critical File Map

### Backend (`backend/app/`)

```
app/
├── main.py                        # FastAPI app init, CORS, router registration
├── schemas/
│   └── models.py                  # ALL Pydantic models (ChatRequest, AgentConfig, etc.)
├── agent/
│   └── graph.py                   # LangGraph state machine — THE chat brain
├── api/routers/
│   ├── chat.py                    # POST /api/chat — SSE streaming chat endpoint
│   ├── agents.py                  # Agent CRUD, config, tables listing
│   ├── tables.py                  # Data source upload (CSV/Excel/PDF/URL)
│   └── users.py                   # End-user management + per-user restrictions
└── services/
    ├── sql_service.py             # DuckDB Text-to-SQL (loads S3 files, enforces restrictions)
    ├── rag_service.py             # Pinecone RAG (embed query, search, return chunks)
    └── bedrock.py                 # Amazon Bedrock Nova client wrapper
```

### Frontend (`frontend/src/app/`)

```
(dashboard)/agents/[botId]/
├── settings/page.tsx              # Agent name, prompt, branding, colors
├── data-sources/page.tsx          # Upload/manage CSV, PDF, URLs
├── users/page.tsx                 # End-user list + per-user table restrictions ← KEY
├── analytics/page.tsx             # Usage charts
└── deploy/page.tsx                # Embed code + chat URL generator
(dashboard)/usage/page.tsx         # Global spending/usage
```

### Chat UI (`agent-chat-ui/src/`)

```
app/
├── page.tsx                       # Root: LoginGate wrapper + config fetch
└── api/
    ├── langgraph/[...path]/route.ts  # SSE proxy → backend /api/chat ← KEY
    ├── vegarag-auth/route.ts         # Login/logout proxy
    └── vegarag-config/route.ts       # Agent config/branding proxy
components/
└── LoginGate.tsx                  # Auth gate (login form if bot has users)
providers/
├── Stream.tsx                     # LangGraph stream + branding + user email header
└── Branding.tsx                   # Brand context (appName, logoUrl)
```

---

## 3. Data Flow — Chat Request

A complete end-to-end trace of a user message:

```
1. User types message in Chat UI (agent-chat-ui)
   └── LoginGate checks sessionStorage for email

2. Stream.tsx calls LangGraph SDK
   └── POST /chat/api/langgraph/threads/{id}/runs/stream
   └── Header: X-VegaRAG-User-Email: user@email.com (if logged in)

3. Next.js API proxy (route.ts) receives it
   └── Extracts: {bot_id, session_id, query, user_email}
   └── POST http://backend:8000/api/chat

4. Backend chat.py receives request
   └── Fetches user's restricted_tables from DynamoDB (if user_email provided)
   └── Invokes LangGraph with: {query, bot_id, session_id, restricted_tables}

5. LangGraph graph.py runs:
   └── classify_intent: "sql" or "rag"
   └── If "sql": sql_node → sql_service.execute_sql_for_bot()
      └── Filters out restricted tables BEFORE loading into DuckDB
      └── LLM never sees restricted table schema or data
   └── If "rag": rag_node → rag_service.search()

6. Backend streams SSE back → proxy re-streams → Chat UI renders
   └── Thread component renders messages with markdown
```

---

## 4. DynamoDB Schema (Single Table: `PlatformDB`)

```
PK                      SK                          Attributes
────────────────────    ──────────────────────────  ──────────────────────────────────────
AGENT#{bot_id}         CONFIG                      name, system_prompt, welcome_message,
                                                    brand_color, chat_title, chat_logo_url

AGENT#{bot_id}         TABLE#{filename}            table_name, filename, s3_key, row_count,
                                                    columns (list), uploaded_at

AGENT#{bot_id}         URL#{url_hash}             url, title, status, scraped_at

AGENT#{bot_id}         ENDUSER#{email}            email, password_hash, createdAt,
                                                    restricted_tables (list of filenames)

ACTIVITY#{bot_id}      ENTRY#{session_id}#{ts}    user_msg, ai_response, intent, timestamp

GLOBAL                 AGENT#{bot_id}              name, bot_id, createdAt
```

**Key patterns:**
- To list all agents: Query PK=GLOBAL
- To list tables for a bot: Query PK=AGENT#{bot_id}, SK begins_with TABLE#
- To get user restrictions: GetItem PK=AGENT#{bot_id}, SK=ENDUSER#{email}

---

## 5. API Endpoints (Backend — Port 8000)

### Chat
```
POST /api/chat
Body: { bot_id, session_id, query, user_email? }
Response: SSE stream of text chunks
```

### Agents
```
GET    /api/agents                           List all agents
POST   /api/agents                           Create agent → returns {bot_id}
GET    /api/agents/{bot_id}/config           Get config (name, prompt, branding)
PUT    /api/agents/{bot_id}/config           Update config
GET    /api/agents/{bot_id}/tables           List all data tables for agent
GET    /api/agents/{bot_id}/activity         Chat history for agent
```

### Data Sources (Tables)
```
POST   /api/agents/{bot_id}/tables           Upload CSV/Excel file
GET    /api/agents/{bot_id}/tables/{id}      Get table metadata
DELETE /api/agents/{bot_id}/tables/{id}      Delete table
POST   /api/agents/{bot_id}/urls             Add URL for scraping
```

### Users (End-users)
```
GET    /api/agents/{bot_id}/users                          List users
POST   /api/agents/{bot_id}/users                          Create user
DELETE /api/agents/{bot_id}/users/{email}                  Delete user
GET    /api/agents/{bot_id}/users/{email}/restrictions    Get table restrictions
PUT    /api/agents/{bot_id}/users/{email}/restrictions    Update restrictions
POST   /api/agents/{bot_id}/login                          Authenticate user
POST   /api/agents/{bot_id}/logout                         Logout user
```

### Usage/Analytics
```
GET    /api/usage                           Global usage summary
GET    /api/usage/{bot_id}                  Per-agent usage
```

---

## 6. Chat UI Proxy Architecture

The `agent-chat-ui` Next.js app has a critical server-side proxy at:
`src/app/api/langgraph/[...path]/route.ts`

**Why the proxy exists:** The LangGraph SDK expects a LangGraph Server API format. This proxy translates those calls to the VegaRAG backend's `/api/chat` format.

**Key proxy logic:**
```
GET  /threads/{id}/state     → Returns message history from DynamoDB (with retry)
POST /threads                → Creates a fake thread ID (UUID)
POST /threads/{id}/runs/stream → Calls backend /api/chat, re-streams SSE
POST /threads/search         → Returns clickable thread history list
GET  /info                   → Returns fake version info
```

**Stream cache:** The proxy maintains an in-memory `streamCache` (Map) per thread. After streaming, the exact messages are cached for 60s. This prevents the "blank second message" bug caused by DynamoDB write latency.

**User email flow:**
```
LoginGate → sessionStorage → Stream.tsx defaultHeaders →
X-VegaRAG-User-Email header → proxy route.ts → backend chat request → restriction enforcement
```

---

## 7. Per-User Table Restrictions — Complete Flow

1. **Admin UI** (`users/page.tsx`): Toggle switches per table → `PUT /api/agents/{bot_id}/users/{email}/restrictions`
2. **Backend store** (`users.py`): Updates `restricted_tables: [filename, ...]` in DynamoDB
3. **Chat request** (`chat.py`): Fetches `restricted_tables` from DynamoDB using `user_email`
4. **Graph state** (`graph.py`): `AgentState` includes `restricted_tables: list[str]`
5. **SQL enforcement** (`sql_service.py`): Before loading any file into DuckDB, filter out restricted ones:
   ```python
   tables = [t for t in all_tables if t["filename"] not in restricted_tables]
   ```
6. **Result**: LLM has no knowledge of restricted table schema, columns, or data

---

## 8. LangGraph Agent State

```python
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    query: str
    bot_id: str
    session_id: str
    intent: str              # "sql" or "rag"
    sql_result: str
    rag_result: str
    restricted_tables: list  # ← enforced in sql_node
    final_response: str
```

**Graph nodes:** `classify_intent` → `sql_node` OR `rag_node` → `respond`

---

## 9. Authentication System

### Admin Authentication (Frontend)
- Currently uses email/password stored in DynamoDB (not Cognito yet)
- Session managed via Next.js cookies
- Admin login is separate from end-user login

### End-User Authentication (Chat UI)
- Bot must have users configured (if no users → open access, backwards compatible)
- `LoginGate.tsx` checks `GET /api/vegarag-auth?bot_id=xxx`
- Login: `POST /api/vegarag-auth` → proxies to backend → sets HttpOnly `vegatoken` cookie
- Session: email stored in `sessionStorage` (cleared on tab close)
- Key: `vegaChat_{bot_id}_user`

---

## 10. Environment Variables

### Backend (`backend/.env`)
```
AWS_REGION                = us-east-1
AWS_ACCESS_KEY_ID         = (local only, not needed in ECS — uses task role)
AWS_SECRET_ACCESS_KEY     = (local only)
DYNAMODB_TABLE_NAME       = PlatformDB
S3_DOCUMENT_BUCKET        = your-bucket-name
PINECONE_API_KEY          = your-pinecone-key
PINECONE_INDEX_NAME       = vegarag-index
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL       = http://localhost:8000  (local)
                          = https://your-domain.com (production)
```

### Chat UI (env at runtime via ECS task definition)
```
VEGARAG_BACKEND_URL       = http://localhost:8000  (local)
                          = http://alb-dns          (production, internal)
NEXT_PUBLIC_API_URL       = http://localhost:3001/chat/api/langgraph  (local)
                          = /chat/api/langgraph                         (production)
PORT                      = 3001
```

---

## 11. Deploy Scripts

### `dev.sh` — Local Development
Starts all 3 services with correct env vars. Usage: `./dev.sh`

### `manage.sh` — AWS ECS Management
Interactive menu:
- `1` Status — show running/desired counts
- `4` Redeploy — force-restart without rebuild (fast)  
- `5` Deploy F+B — build + push Backend + Frontend
- `6` Deploy Chat — build + push Chat UI (calls `agent-chat-ui/deploy-chat-ui.sh`)
- `7` Deploy ALL — build + push all 3 services ← use this after code changes

### `agent-chat-ui/deploy-chat-ui.sh`
Full chat UI deployment: ECR push → task definition → ECS service update/create → ALB rule

---

## 12. Common Tasks for AI Agents

### Adding a new backend API endpoint
1. Add the route function in `backend/app/api/routers/<router>.py`
2. Add Pydantic models to `backend/app/schemas/models.py` if needed
3. Register the router in `backend/app/main.py` (already done for existing routers)
4. Add the client method to `frontend/src/lib/api.ts`
5. Use it in the relevant page component

### Adding a new frontend page
1. Create `frontend/src/app/(dashboard)/agents/[botId]/<name>/page.tsx`
2. Add nav item to `frontend/src/components/AgentSidebar.tsx`
3. The page receives `params: Promise<{botId: string}>` — resolve with `use(params)`

### Modifying the LangGraph agent behavior
- Edit `backend/app/agent/graph.py`
- `AgentState` defines all state fields
- Nodes: `classify_intent`, `sql_node`, `rag_node`, `respond`
- Add state fields → add to TypedDict → pass through nodes

### Adding a new Chat UI API proxy route
- Create `agent-chat-ui/src/app/api/<name>/route.ts`
- Use `VEGARAG_BACKEND_URL` env var for backend URL
- All client-side fetches use `/chat/api/<name>` (basePath is always `/chat`)

### Changing DynamoDB schema
- Backend reads/writes directly via boto3 (no ORM)
- Update the relevant router file
- Use `PK=AGENT#{bot_id}` and the appropriate SK prefix convention

---

## 13. Known Gotchas

1. **basePath `/chat`**: The Chat UI ALWAYS uses `basePath: "/chat"` (in both local dev and production). Client-side fetch calls to internal Next.js API routes must use `/chat/api/...` prefix.

2. **Stream cache**: The in-memory stream cache in `route.ts` is per-process. If ECS runs multiple tasks, cache misses may cause a DynamoDB retry fetch. This is expected and handled with retry logic.

3. **NEXT_PUBLIC_* vars are baked at build time**: Changing `NEXT_PUBLIC_API_URL` in ECS task definition does NOT affect the built JS. Only `VEGARAG_BACKEND_URL` (server-side) can be set at runtime in ECS for the Chat UI.

4. **DynamoDB write latency**: After a chat completes, there's ~1-2s before the activity is written to DynamoDB. The stream cache bridges this gap for the immediate GET /state call.

5. **Pinecone namespace isolation**: Each bot gets its own namespace `{bot_id}` in Pinecone. This ensures complete data isolation between tenants even within the same index.

6. **SQL restriction timing**: Restrictions are fetched fresh from DynamoDB on each chat request (no caching). This ensures restriction changes take effect immediately without restart.

---

## 14. Production Infrastructure (AWS)

```
Account ID:    519008639833
Region:        us-east-1
Cluster:       vegarag-cluster-v2
ALB:           vegarag-alb-1907307840.us-east-1.elb.amazonaws.com
DynamoDB:      PlatformDB
ECR repos:     vegarag-backend, vegarag-frontend, vegarag-chat-ui

ECS Services:
  vegarag-backend-service   (port 8000)
  vegarag-frontend-service  (port 3000)
  vegarag-chat-ui-service   (port 3001)

ALB Listener Rules (priority order):
  Priority 5:  /chat/* → TG-ChatUI
  Priority 10: /api/*  → TG-Backend
  Default:     /*      → TG-Frontend

IAM Roles:
  ecsTaskExecutionRole  (ECR pull, CloudWatch logs)
  vegaragTaskRole       (Bedrock, S3, DynamoDB access)
```

---

## 15. Quick Reference — Where Is X?

| Thing | Location |
|-------|----------|
| Chat SSE streaming | `backend/app/api/routers/chat.py` |
| LangGraph agent graph | `backend/app/agent/graph.py` |
| SQL execution + restrictions | `backend/app/services/sql_service.py` |
| User restriction storage | `backend/app/api/routers/users.py` |
| Chat UI proxy (SSE) | `agent-chat-ui/src/app/api/langgraph/[...path]/route.ts` |
| Login gate | `agent-chat-ui/src/components/LoginGate.tsx` |
| Admin API client | `frontend/src/lib/api.ts` |
| User restriction UI | `frontend/src/app/(dashboard)/agents/[botId]/users/page.tsx` |
| Agent branding config | `frontend/src/app/(dashboard)/agents/[botId]/settings/page.tsx` |
| Dev startup | `dev.sh` |
| AWS deploy | `manage.sh` |
| Chat UI AWS deploy | `agent-chat-ui/deploy-chat-ui.sh` |
