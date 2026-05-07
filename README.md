<div align="center">

# 🤖 VegaRAG

**Enterprise-Grade Multi-Tenant AI Agent SaaS Platform**

[![AWS](https://img.shields.io/badge/AWS-ECS_Fargate-FF9900?logo=amazon-aws)](https://aws.amazon.com/fargate/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-1A1A2E)](https://github.com/langchain-ai/langgraph)
[![Bedrock](https://img.shields.io/badge/Amazon_Bedrock-Nova-FF9900?logo=amazon-aws)](https://aws.amazon.com/bedrock/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-00B388)](https://pinecone.io)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

*Build, deploy, and manage intelligent AI chatbots backed by your own documents and data — with enterprise security, multi-tenancy, and zero infrastructure headaches.*

</div>

---

## 📖 What is VegaRAG?

VegaRAG is a **production-ready, multi-tenant AI Agent SaaS platform** that lets businesses ("admins") create AI chatbots ("bots") their end-users can chat with. Each bot can:

- 📄 **Answer questions from uploaded documents** — RAG (Retrieval-Augmented Generation) via Pinecone + Amazon Bedrock Titan Embeddings
- 📊 **Query uploaded CSV/Excel files** — Natural language Text-to-SQL via DuckDB and Amazon Nova
- 🔐 **Restrict specific users from specific data tables** — per-user row-level access control
- 🌐 **Scrape and ingest URLs** — async web crawling with BeautifulSoup
- 🛡️ **Enterprise guardrails** — PII redaction, hallucination detection, rate limiting, semantic caching

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS ECS Fargate (us-east-1)                  │
│                                                                      │
│  ┌──────────────────┐   ┌────────────────────┐   ┌───────────────┐  │
│  │  Frontend :3000   │   │  Backend :8000      │   │ Chat UI :3001 │  │
│  │  Next.js 14       │   │  FastAPI + Python   │   │  Next.js 14   │  │
│  │  Admin Dashboard  │   │  LangGraph Agent    │   │  End-User UI  │  │
│  └──────────────────┘   └────────────────────┘   └───────────────┘  │
│            │                      │                       │          │
│            └──────────────────────┼───────────────────────┘          │
│                                   │                                  │
│                            AWS ALB (HTTPS)                           │
│                   /api/* → Backend  /chat/* → Chat UI                │
│                   /*    → Frontend                                   │
└─────────────────────────────────────────────────────────────────────┘
         │                │                  │              │
    DynamoDB          Pinecone            Amazon S3    Amazon Bedrock
   PlatformDB       Vector Index         Documents     Nova + Titan
```

### Three Deployable Services

| Service | Tech | Port | Role |
|---------|------|------|------|
| `backend/` | FastAPI + Python 3.11 | 8000 | Brain — LangGraph agent, chat, data |
| `frontend/` | Next.js 14 | 3000 | Admin dashboard (multi-tenant management) |
| `agent-chat-ui/` | Next.js 14 | 3001 | End-user chat interface |

---

## ✨ Features

### Core Platform
| Feature | Description |
|---------|-------------|
| **RAG Pipeline** | Upload PDFs/text → auto-chunk → Titan embed → Pinecone → Nova Pro synthesis |
| **Text-to-SQL** | Upload CSV/Excel → DuckDB in-process → Nova Lite generates SQL → results in prose |
| **URL Ingestion** | Add any URL → async BeautifulSoup scrape → chunked into vector store |
| **Multi-tenant** | Complete data isolation per bot via Pinecone namespaces + DynamoDB PK scoping |
| **SSE Streaming** | Token-level streaming from Bedrock → FastAPI → ALB → browser EventSource |
| **Chat History** | Per-session thread history with retry-safe DynamoDB caching |

### Enterprise Security
| Feature | Description |
|---------|-------------|
| **PII Redaction** | Microsoft Presidio + SpaCy NER scrubs emails, SSNs, phone numbers before LLM call |
| **Hallucination Detection** | Nova Micro judges every response asynchronously; flags stored in DynamoDB |
| **Token Bucket Rate Limiting** | Per-bot-id throttling (free: 20 burst / pro: 100 burst / enterprise: 500 burst) |
| **Per-User Table Restrictions** | Admin toggles which CSV tables each end-user can query — enforced before LLM sees schema |
| **IAM Zero-Trust** | Fargate Task Role (no long-lived keys) + SG allow-lists + read-only DB connections |
| **Semantic Caching** | Pinecone-backed similarity cache (threshold 0.95) — avoids redundant Bedrock calls |

### LangGraph Agent
```
classify_intent (Nova Lite)
       │
       ├── "rag"  → rag_node  → Pinecone Top-5 → Nova Pro → SSE stream
       ├── "sql"  → sql_node  → DuckDB → Nova Pro → SSE stream  
       └── "casual" → respond → Nova Pro → SSE stream
```

### CI/CD Quality Gate
- **GitHub Actions** workflow on every PR to `main`
- Runs **LLM-as-a-Judge** RAG evaluation (faithfulness + context relevance)
- Uses Amazon Bedrock Nova Micro as the evaluator
- Blocks merge if quality score drops below threshold

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Python 3.11+
- Node.js 18+
- pnpm
- AWS credentials (Bedrock + DynamoDB + S3 access)
- Pinecone API key

### 1. Clone & Setup

```bash
git clone https://github.com/challayashwanth1998-png/vega-rag.git
cd vega-rag
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key          # local only; ECS uses task role
AWS_SECRET_ACCESS_KEY=your_secret
DYNAMODB_TABLE_NAME=PlatformDB
S3_DOCUMENT_BUCKET=your-bucket-name
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=vegarag-index
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Chat UI** (`agent-chat-ui/.env.local`):
```env
VEGARAG_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3001/chat/api/langgraph
PORT=3001
```

### 3. Run All Services

```bash
./dev.sh
```

This starts:
- Backend at `http://localhost:8000`
- Frontend at `http://localhost:3000`
- Chat UI at `http://localhost:3001/chat`

---

## 📡 API Reference

### Chat
```
POST /api/chat
Body: { bot_id, session_id, query, user_email? }
Response: Server-Sent Events (SSE) token stream
```

### Agents (Bot Management)
```
GET    /api/agents                          List all agents
POST   /api/agents                          Create agent → { bot_id }
GET    /api/agents/{bot_id}/config          Get config
PUT    /api/agents/{bot_id}/config          Update name, prompt, branding, colors
GET    /api/agents/{bot_id}/tables          List data sources
GET    /api/agents/{bot_id}/activity        Chat history
```

### Data Sources
```
POST   /api/agents/{bot_id}/tables          Upload CSV/Excel/PDF
DELETE /api/agents/{bot_id}/tables/{id}     Delete data source
POST   /api/agents/{bot_id}/urls            Add URL for async scraping
```

### End-User Management
```
GET    /api/agents/{bot_id}/users                        List users
POST   /api/agents/{bot_id}/users                        Create user
DELETE /api/agents/{bot_id}/users/{email}                Delete user
GET    /api/agents/{bot_id}/users/{email}/restrictions   Get table restrictions
PUT    /api/agents/{bot_id}/users/{email}/restrictions   Update restrictions
POST   /api/agents/{bot_id}/login                        Authenticate user
```

---

## 🗄️ DynamoDB Schema (Single Table: `PlatformDB`)

| PK | SK | Key Attributes |
|----|-----|---------------|
| `AGENT#{bot_id}` | `CONFIG` | name, system_prompt, brand_color, welcome_message, chat_logo_url |
| `AGENT#{bot_id}` | `TABLE#{filename}` | table_name, s3_key, columns[], row_count, uploaded_at |
| `AGENT#{bot_id}` | `ENDUSER#{email}` | password_hash, restricted_tables[], createdAt |
| `ACTIVITY#{bot_id}` | `ENTRY#{session}#{ts}` | user_msg, ai_response, intent, flagged_hallucination, flagged_toxic |
| `STATS#{bot_id}` | `DAY#{date}` | query_count, token_count |
| `USER#{email}` | `AGENT#{bot_id}` | name, bot_id, status, createdAt |
| `GLOBAL` | `AGENT#{bot_id}` | name, bot_id, createdAt |

---

## ☁️ Production Deployment (AWS ECS Fargate)

### Infrastructure
```
Account:  519008639833 (us-east-1)
Cluster:  vegarag-cluster-v2
ALB:      vegarag-alb-*.us-east-1.elb.amazonaws.com
DynamoDB: PlatformDB
ECR:      vegarag-backend, vegarag-frontend, vegarag-chat-ui

ALB Routing:
  Priority 5:  /chat/*  → Chat UI (port 3001)
  Priority 10: /api/*   → Backend (port 8000)
  Default:     /*       → Frontend (port 3000)
```

### Deploy Commands

```bash
# Deploy everything (build + push all 3 services)
./manage.sh   # choose option 7

# Fast redeploy (no rebuild, just restart ECS tasks)
./manage.sh   # choose option 4

# Deploy only Chat UI
./agent-chat-ui/deploy-chat-ui.sh

# Check ECS service status
./manage.sh   # choose option 1
```

---

## 🧠 How RAG Works

```
1. Admin uploads PDF/CSV/URL via dashboard
   └── FastAPI → S3 upload → DynamoDB TABLE# record
   └── Background task: chunk (512 chars, 200 overlap) → Titan Embed v2 → Pinecone upsert

2. End-user sends chat message
   └── Chat UI → Next.js proxy → Backend /api/chat

3. LangGraph classifies intent (Nova Lite ~50ms)
   └── "rag"  → Titan embed query → Pinecone HNSW ANN → Top-5 chunks → Nova Pro
   └── "sql"  → Fetch TABLE# schemas from DynamoDB → Nova Lite generates SQL
              → DuckDB executes (restricted tables filtered out) → Nova Pro

4. Response streams back token-by-token via SSE
   └── Nova Micro judges hallucination in background (async)
   └── Activity logged to DynamoDB ACTIVITY# record
```

---

## 🔒 Security Architecture

- **No long-lived AWS keys in production** — ECS Task Role provides ephemeral STS credentials
- **PII redaction before LLM** — Microsoft Presidio + SpaCy scrubs sensitive data
- **Per-user data isolation** — `restricted_tables` enforced before LLM sees schema
- **Rate limiting** — Token bucket algorithm per `bot_id` (free/pro/enterprise tiers)
- **Semantic caching** — Pinecone similarity cache prevents redundant calls (threshold: 0.95)
- **Read-only SQL** — DuckDB connections are read-only; DROP/INSERT/UPDATE blocked
- **VPC isolation** — All ECS tasks in private subnets; only ALB is public-facing

---

## 📁 Project Structure

```
vega-rag/
├── backend/                    # FastAPI + LangGraph backend
│   ├── app/
│   │   ├── agent/graph.py      # LangGraph state machine (classify → rag/sql → respond)
│   │   ├── api/routers/        # chat, agents, tables, users, crawl
│   │   ├── core/
│   │   │   ├── guardrails.py   # Microsoft Presidio PII redaction + hallucination judge
│   │   │   ├── rate_limit.py   # Token bucket rate limiting (per bot_id)
│   │   │   ├── logger.py       # Structured JSON logging
│   │   │   └── tracer.py       # OpenTelemetry tracing
│   │   └── services/
│   │       ├── sql_service.py  # DuckDB Text-to-SQL with table restrictions
│   │       ├── rag_service.py  # Pinecone RAG search
│   │       ├── semantic_cache.py  # Pinecone-backed semantic query cache
│   │       └── bedrock.py      # Amazon Bedrock Nova client wrapper
├── frontend/                   # Next.js 14 admin dashboard
│   └── src/app/(dashboard)/agents/[botId]/
│       ├── settings/           # Bot config, prompt, branding
│       ├── data-sources/       # Upload CSV, PDF, URLs
│       ├── users/              # End-user mgmt + table restrictions
│       ├── analytics/          # Usage charts, token spend
│       └── deploy/             # Embed code + chat URL
├── agent-chat-ui/              # Next.js 14 end-user chat interface
│   └── src/
│       ├── app/api/langgraph/  # SSE proxy → backend /api/chat
│       ├── components/LoginGate.tsx
│       └── providers/Stream.tsx
├── .github/workflows/
│   └── rag_eval.yml            # LLM-as-a-Judge CI quality gate
├── dev.sh                      # Start all 3 services locally
└── manage.sh                   # AWS ECS deploy & management menu
```

---

## 🛣️ Roadmap

- [ ] **Cognito SSO** — replace custom auth with AWS Cognito for admin login
- [ ] **Multi-region** — DynamoDB Global Tables + Pinecone multi-region
- [ ] **ElastiCache** — move semantic cache from Pinecone to Redis for lower latency
- [ ] **Analytics dashboard** — token spend, hallucination rate, cache hit ratio per bot
- [ ] **Webhook support** — notify admins when hallucination rate exceeds threshold
- [ ] **SAML/OIDC** — enterprise SSO for end-users
- [ ] **Custom domain** — per-bot branded domains (bot.yourdomain.com)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Push to the branch and open a Pull Request against `main`
4. The RAG evaluation CI pipeline will automatically run quality checks

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ using Amazon Bedrock, LangGraph, Pinecone, and Next.js
</div>
