# 🌌 VegaRAG

**Enterprise-grade multi-tenant AI Agent SaaS platform — powered by Amazon Bedrock, LangGraph, and Next.js.**



https://github.com/user-attachments/assets/932890c4-fe0c-4bc8-9183-94c8233e1f42




Build, deploy, and manage white-labeled AI chat agents that query your private data. Each agent gets its own branding, users, data sources, and access controls — all managed from a single admin dashboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ What It Does

- **Multi-Tenant Agents** — Create isolated AI agents, each with their own prompt, branding, users, and data
- **Text-to-SQL** — Upload CSV/Excel files; the LLM queries them via DuckDB (no pre-indexing needed)
- **RAG on Documents** — Upload PDFs/URLs; queries are answered via Pinecone vector search + Bedrock Nova
- **Per-User Access Control** — Restrict individual users from querying specific data tables
- **Embedded Chat Widget** — Drop-in `<script>` tag for any website
- **Admin Dashboard** — Monitor usage, spending, data sources, and user access in one place

---

## 🏗 Architecture

```
                        ┌─────────────────────────────┐
                        │   AWS Application Load Balancer │
                        │   (vegarag.com)                 │
                        └────┬────────────┬───────────┬───┘
                             │            │           │
                     /api/*  │    /chat/* │    /*     │
                             ▼            ▼           ▼
                    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
                    │   Backend    │  │ Chat UI  │  │  Frontend    │
                    │  FastAPI     │  │ Next.js  │  │  Next.js     │
                    │  Port 8000   │  │ Port 3001│  │  Port 3000   │
                    └──────┬───────┘  └──────────┘  └──────────────┘
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
        ┌──────────┐  ┌─────────┐  ┌─────────┐
        │ DynamoDB │  │ Bedrock │  │Pinecone │
        │ (state)  │  │  Nova   │  │(vectors)│
        └──────────┘  └─────────┘  └─────────┘
                           │
                    ┌──────────────┐
                    │     S3       │
                    │ (file store) │
                    └──────────────┘
```

### Services

| Service | Directory | Port | Description |
|---------|-----------|------|-------------|
| **Backend** | `backend/` | 8000 | FastAPI — chat, RAG, SQL, agent management |
| **Frontend (Dashboard)** | `frontend/` | 3000 | Next.js admin dashboard |
| **Chat UI** | `agent-chat-ui/` | 3001 | Next.js end-user chat interface |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Amazon Bedrock Nova Micro |
| Embeddings | Amazon Titan Text Embeddings v2 |
| Vector DB | Pinecone |
| In-process SQL | DuckDB |
| Agent Framework | LangGraph |
| Backend | FastAPI + Python 3.11 |
| Frontend | Next.js 14, Tailwind CSS, Framer Motion |
| Chat UI | Next.js 14, LangGraph SDK |
| Storage | AWS DynamoDB (state) + S3 (files) |
| Deployment | AWS ECS Fargate + ECR + ALB |

---

## 🚀 Quick Start — Local Development

### 1. Prerequisites

- **AWS Account** with Bedrock access enabled in `us-east-1`
  - Enable models: `Amazon Nova Micro` + `Amazon Titan Text Embeddings v2` in [Bedrock Model Access](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess)
- **Pinecone** account — [pinecone.io](https://www.pinecone.io/) (free tier works)
- **Node.js** 18+ and **pnpm** (`npm install -g pnpm`)
- **Python** 3.11+
- **Docker** (for production deployment only)

### 2. Configure Environment Variables

Create `backend/.env`:

```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# DynamoDB
DYNAMODB_TABLE_NAME=PlatformDB

# S3
S3_DOCUMENT_BUCKET=your-vegarag-documents-bucket

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=vegarag-index
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Provision AWS Infrastructure (one-time)

```bash
# Create DynamoDB table
aws dynamodb create-table \
  --table-name PlatformDB \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Create S3 bucket (use a globally unique name)
aws s3 mb s3://your-vegarag-documents-bucket --region us-east-1
aws s3api put-public-access-block \
  --bucket your-vegarag-documents-bucket \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create Pinecone index (via Pinecone console or SDK)
# Dimension: 1536, Metric: cosine, Cloud: AWS us-east-1
```

### 4. Start All Services

```bash
chmod +x dev.sh
./dev.sh
```

This starts:
- **Backend** → http://localhost:8000 (FastAPI + auto-reload)
- **Frontend** → http://localhost:3000 (Admin dashboard)
- **Chat UI** → http://localhost:3001/chat (End-user chat)

Press `Ctrl+C` to stop all services.

### 5. Open the Dashboard

1. Go to http://localhost:3000
2. Click **New Agent** to create your first AI agent
3. Upload data sources (CSV, Excel, PDF, or URLs)
4. Add end-users in the **Users** tab
5. Share the chat link: `http://localhost:3001/chat?assistantId=<bot_id>`

---

## ☁️ Production Deployment (AWS ECS Fargate)

### Prerequisites

- AWS CLI configured (`aws configure`)
- Docker installed and running
- Domain name (optional but recommended)

### One-Command Deploy

After configuring your AWS credentials:

```bash
chmod +x manage.sh
./manage.sh
# Choose option 7 → Deploy ALL
```

The deploy script handles everything:
1. Builds Docker images for all 3 services
2. Pushes to ECR
3. Registers ECS task definitions
4. Creates/updates ECS services
5. Configures ALB routing rules
6. Waits for services to stabilize

### Manual AWS Setup (First-Time)

If this is your first deployment, provision the infrastructure first:

```bash
# 1. Create ECS cluster
aws ecs create-cluster --cluster-name vegarag-cluster-v2 --region us-east-1

# 2. Create IAM execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# 3. Create IAM task role (gives app access to Bedrock, S3, DynamoDB)
aws iam create-role \
  --role-name vegaragTaskRole \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# 4. Create ECR repositories
aws ecr create-repository --repository-name vegarag-backend --region us-east-1
aws ecr create-repository --repository-name vegarag-frontend --region us-east-1
aws ecr create-repository --repository-name vegarag-chat-ui --region us-east-1

# 5. Create ALB + target groups (see manage.sh / deploy-chat-ui.sh for exact commands)
```

### ALB Routing Rules

The single ALB routes traffic to the correct service by path:

| Path Pattern | Target | Service |
|---|---|---|
| `/api/*` | Backend TG | FastAPI on port 8000 |
| `/chat/*` | Chat UI TG | Next.js on port 3001 |
| `/*` (default) | Frontend TG | Next.js on port 3000 |

### Environment Variables in Production

Set these in ECS task definitions:

**Backend:**
```
DYNAMODB_TABLE_NAME=PlatformDB
S3_DOCUMENT_BUCKET=your-bucket-name
PINECONE_API_KEY=your-key
PINECONE_INDEX_NAME=vegarag-index
AWS_REGION=us-east-1
```
> No AWS credentials needed — the ECS task role (vegaragTaskRole) provides access via IAM.

**Frontend:**
```
NEXT_PUBLIC_API_URL=https://your-alb-domain.com
```

**Chat UI:**
```
NEXT_PUBLIC_API_URL=/chat/api/langgraph
VEGARAG_BACKEND_URL=http://<alb-internal-dns>
PORT=3001
```

---

## 📁 Project Structure

```
vegaRAG/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── agent/
│   │   │   └── graph.py        # LangGraph agent state machine
│   │   ├── api/routers/
│   │   │   ├── agents.py       # Agent CRUD + config + tables
│   │   │   ├── chat.py         # SSE chat streaming endpoint
│   │   │   ├── tables.py       # Data source upload/management
│   │   │   └── users.py        # End-user management + restrictions
│   │   ├── services/
│   │   │   ├── sql_service.py  # DuckDB Text-to-SQL engine
│   │   │   ├── rag_service.py  # Pinecone RAG engine
│   │   │   └── bedrock.py      # Bedrock Nova client
│   │   └── schemas/models.py   # Pydantic request/response models
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # Admin dashboard (Next.js)
│   └── src/app/
│       ├── (dashboard)/agents/[botId]/
│       │   ├── settings/       # Agent config, branding, prompts
│       │   ├── data-sources/   # Upload CSV, PDF, URLs
│       │   ├── users/          # End-user management + restrictions
│       │   ├── analytics/      # Usage charts
│       │   └── deploy/         # Embed code, chat URL
│       └── (dashboard)/usage/  # Global usage/spending
│
├── agent-chat-ui/              # End-user chat interface (Next.js)
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Root page with LoginGate
│       │   └── api/
│       │       ├── langgraph/  # SSE proxy → backend /api/chat
│       │       ├── vegarag-auth/  # Login/logout proxy
│       │       └── vegarag-config/ # Agent config/branding proxy
│       ├── components/
│       │   ├── LoginGate.tsx   # Auth gate (shows login if bot has users)
│       │   └── thread/         # Chat UI components
│       └── providers/
│           ├── Stream.tsx      # LangGraph stream + branding fetch
│           └── Branding.tsx    # Brand context (name, logo)
│
├── dev.sh                      # Start all 3 services locally
├── manage.sh                   # AWS ECS management (status/deploy/stop)
└── docker-compose.yml          # Local Docker alternative to dev.sh
```

---

## 🔑 Key Features Deep-Dive

### Text-to-SQL Pipeline

1. User uploads CSV/Excel → stored in S3 + metadata in DynamoDB
2. On chat request, `sql_service.py` loads files from S3 into DuckDB (in-memory)
3. LLM generates SQL → DuckDB executes → result returned
4. Per-user restrictions filter tables before loading (admin can block access)

### RAG Pipeline

1. User uploads PDF/URL → text extracted → chunked → embedded via Bedrock Titan
2. Embeddings stored in Pinecone under `namespace={bot_id}`
3. On chat request, query embedded → top-k chunks retrieved → fed to Nova Micro

### Per-User Data Restrictions

Admins can restrict individual users from querying specific tables:
- Stored as `restricted_tables: [filename, ...]` in DynamoDB under `AGENT#{bot_id} / ENDUSER#{email}`
- Enforced in `sql_service.py` — restricted tables are never loaded into DuckDB
- The LLM never sees schema, column names, or data from restricted sources

### Chat Authentication

When a bot has users configured, the Chat UI shows a login page:
1. `LoginGate.tsx` checks `/api/vegarag-auth?bot_id=xxx` for users
2. If users exist → login form; if no users → open access (backwards compatible)
3. Session stored in `sessionStorage` after login
4. User email passed as `X-VegaRAG-User-Email` header → enforces data restrictions

---

## 🗄 DynamoDB Schema

Single table design (`PlatformDB`):

| PK | SK | Description |
|----|----|-------------|
| `AGENT#{bot_id}` | `CONFIG` | Agent settings (prompt, branding, welcome message) |
| `AGENT#{bot_id}` | `TABLE#{filename}` | Uploaded data source metadata |
| `AGENT#{bot_id}` | `URL#{url}` | Scraped URL metadata |
| `AGENT#{bot_id}` | `ENDUSER#{email}` | End-user record + restricted_tables |
| `ACTIVITY#{bot_id}` | `ENTRY#{session_id}#{ts}` | Chat history (user msg + AI response) |
| `GLOBAL` | `AGENT#{bot_id}` | Global agent registry |

---

## 🛡 Security

- **No credentials in containers**: Backend uses `vegaragTaskRole` IAM task role
- **Httponly cookies** for vegatoken session (future Cognito integration point)
- **Data restrictions enforced server-side**: Restricted tables never loaded into DuckDB
- **Multi-tenant isolation**: All queries scoped to `bot_id` namespace
- **S3 private**: All buckets block public access; files downloaded via server-side presigned URLs

---

## 📜 License

MIT — see [LICENSE](LICENSE)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit and push
4. Open a Pull Request

---

Built with ❤️ by the VegaRAG team · [vegarag.com](https://vegarag.com)
