# Multi-Tenant RAG Platform — Deep Research
> Build it. Ship it. Learn everything.

---

## What You're Building

A SaaS where anyone can:
1. Sign up & log in
2. Upload their own PDFs/docs
3. Get a private AI chat agent that knows only their docs
4. Share it with their team

Think: **Chatbase.co or Mendable.ai — but you build it from scratch on AWS**

---

## Full Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js — your existing agent-chat-ui adapted)       │
│  Login → Dashboard → Upload → Chat Interface                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────────┐
│  API Gateway + CloudFront CDN                                    │
│  Rate limiting, auth token validation                            │
└──────┬────────────────────────────────────────┬─────────────────┘
       │                                        │
┌──────▼──────────┐                   ┌─────────▼──────────────┐
│  ECS Fargate     │                   │  Lambda Functions       │
│  Main app server │                   │  (async document ingest)│
│  LangGraph graph │                   └─────────┬──────────────┘
└──────┬──────────┘                             │
       │                              ┌──────────▼──────────────┐
┌──────▼──────────┐                   │  S3 (user uploads)       │
│  Cognito         │                   │  s3://bucket/user-id/   │
│  (Auth)          │                   │  file.pdf               │
└─────────────────┘                   └──────────┬──────────────┘
                                                 │
                                      ┌──────────▼──────────────┐
┌────────────────────────────────────▶│  Bedrock Nova Micro      │
│                                      │  (chunk + embed + answer)│
│                                      └──────────┬──────────────┘
│                                                 │
│                                      ┌──────────▼──────────────┐
│                                      │  Pinecone (namespaced)   │
│                                      │  namespace = user-id     │
│                                      │  = perfect isolation     │
│                                      └─────────────────────────┘
│
└── DynamoDB (user accounts, workspaces, doc metadata)
```

---

## Every AWS Service + What You Learn From It

### 1. AWS Cognito — Authentication
**What it does:** Managed user auth — sign up, login, Google/GitHub OAuth, JWT tokens, password reset

**What you learn:**
- User Pools vs Identity Pools
- JWT token validation in your API
- OAuth 2.0 / OIDC flow
- Hosted UI vs custom login screen

**Cost:** Free for first 50,000 monthly active users → **$0**

---

### 2. API Gateway — HTTP Layer
**What it does:** Routes HTTP requests from frontend to your backend, validates JWT, rate limits

**What you learn:**
- REST vs HTTP vs WebSocket APIs
- Authorizers (validate Cognito JWT automatically)
- Rate limiting per user
- Stage deployments (dev/prod)

**Cost:** First 1M calls/month free → **~$0 for learning**

---

### 3. ECS Fargate — Your App Server
**What it does:** Runs your LangGraph agent container without managing EC2 servers

**What you learn:**
- Docker + ECR (container registry)
- Task definitions, service auto-scaling
- Health checks, rolling deploys
- VPC networking (public vs private subnets)

**Cost:** 1 task × 0.5 vCPU × 1GB RAM = **~$15/month**

---

### 4. S3 — Document Storage
**What it does:** Stores uploaded PDFs per user with prefix isolation

**Pattern:**
```
s3://your-bucket/
  user-abc123/doc1.pdf
  user-abc123/doc2.pdf
  user-xyz789/manual.pdf   ← completely separate, user can't access each other's
```

**What you learn:**
- Pre-signed URLs (let users upload directly from browser to S3, bypass your server)
- Bucket policies, IAM roles per-object
- S3 event notifications → triggers Lambda on upload
- Lifecycle policies (auto-delete after 30 days to save cost)

**Cost:** 5 GB storage + requests = **~$0.50/month**

---

### 5. Lambda — Document Processing (Event-Driven)
**What it does:** Automatically fires when a file lands in S3 → reads PDF → chunks it → embeds it → stores in Pinecone

**What you learn:**
- Event-driven architecture (no polling!)
- Lambda layers (package dependencies like PyMuPDF, boto3)
- Async processing patterns
- Dead letter queues for failed processing
- Cold start problem and how to solve it

**Cost:** 1M invocations free → **$0** at this scale

---

### 6. DynamoDB — User & Workspace Metadata
**What it does:** Stores user profiles, workspaces, document lists, usage counters

**Schema example:**
```
PK: USER#abc123  SK: PROFILE      → { email, plan, created_at }
PK: USER#abc123  SK: DOC#doc1     → { filename, status, chunks, pinecone_namespace }
PK: USER#abc123  SK: USAGE#2026   → { queries_this_month: 47 }
```

**What you learn:**
- NoSQL data modeling with single-table design
- Partition keys vs sort keys
- GSIs (Global Secondary Indexes) for queries
- DynamoDB Streams for real-time events
- On-demand vs provisioned capacity

**Cost:** 25 GB free tier → **$0**

---

### 7. Bedrock (Nova Micro) — The LLM
**What it does:** Powers the chat responses using RAG context from Pinecone

**What you learn:**
- Bedrock Converse API (model-agnostic)
- Prompt engineering for RAG (system prompt + context injection)
- Streaming responses (stream tokens to UI)
- Token counting and context window management

**Cost:** 100 users × 20 queries × 2K tokens = 4M tokens/month = **~$0.14/month** ← almost free

---

### 8. Pinecone (not AWS, but the right call) — Vector Store
**Why not OpenSearch Serverless:** OpenSearch charges $175/month minimum. Pinecone free tier = unlimited namespaces = 1 namespace per user = perfect multi-tenant isolation for $0.

**What you learn:**
- Vector embeddings (what they are, why they work)
- Cosine similarity search
- Namespace isolation for multi-tenancy
- Metadata filtering (filter by user_id + doc_id)
- Hybrid search (dense + sparse)

**Cost:** Free tier → **$0** (up to 1M vectors, 100 namespaces)

---

### 9. CloudFront — CDN
**What it does:** Serves your Next.js frontend globally fast, caches static assets

**What you learn:**
- CDN caching strategies
- Origin vs edge
- SSL certificate management (via ACM — free)

**Cost:** 1TB free → **$0**

---

### 10. CloudWatch + X-Ray — Observability
**What it does:** Logs, metrics, traces for every Lambda, ECS task, and API call

**What you learn:**
- Structured logging
- Custom metrics (track: docs uploaded per day, queries per user)
- Distributed tracing across Lambda → Bedrock → Pinecone
- Alarms (alert if error rate > 1%)

**Cost:** 5 GB logs free → **~$2/month**

---

## Full Monthly Cost Breakdown

| Service | Learning Phase | After 100 Users |
|---|---|---|
| ECS Fargate (1 task) | $15 | $15 |
| Bedrock Nova Micro | $0.14 | $2 |
| S3 | $0.50 | $2 |
| Cognito | $0 | $0 |
| API Gateway | $0 | $0 |
| Lambda | $0 | $0 |
| DynamoDB | $0 | $0 |
| Pinecone Free | $0 | $0 |
| CloudFront | $0 | $0 |
| CloudWatch | $2 | $3 |
| Route 53 (domain) | $0.50 | $0.50 |
| **Total** | **~$18/month** | **~$23/month** |

> **Your $300 credit covers 16 months at learning phase cost.**

---

## What You'll Know After Building This

| Skill | Level Before | Level After |
|---|---|---|
| AWS Cognito / Auth | 0 | ✅ Production |
| API Gateway | 0 | ✅ Production |
| Event-driven Lambda | 0 | ✅ Solid |
| Multi-tenant architecture | 0 | ✅ Expert |
| DynamoDB NoSQL modeling | 0 | ✅ Solid |
| Vector DBs + RAG at scale | Basic (Qdrant) | ✅ Expert |
| ECS Fargate + Docker | Basic | ✅ Production |
| LangGraph agents | ✅ Expert | ✅ Expert |
| Bedrock APIs | 0 | ✅ Solid |
| CloudWatch / Observability | Basic | ✅ Solid |

---

## ⚠️ Stripe + Work Visa — Important Legal Reality

### The Honest Answer

**Technical answer:** You CAN set up Stripe. You need an LLC + EIN + US bank account.

**Legal answer for H1B/work visa holders:** This is a real risk zone.

> H1B visa restricts you to income ONLY from your sponsoring employer. Running a business that generates revenue = unauthorized employment = visa violation risk.

### What This Actually Means

| Scenario | Risk Level |
|---|---|
| Build the platform, offer it free, no revenue | ✅ Zero risk — side projects are fine |
| Charge money, receive payments personally | ❌ High risk — immigration violation |
| Have a family member (US citizen/GC) own the LLC | ⚠️ Gray area — consult immigration lawyer |
| Wait until you have a Green Card | ✅ Fully legal, no restrictions |
| O-1 visa (Extraordinary Ability) | ✅ Allows self-employment |

### Practical Path Forward

**Right now (on work visa):**
- Build the entire platform
- Launch it FREE — no payments
- Get real users, build reputation, get GitHub stars
- Add a *waitlist* for a paid tier (collect emails, don't charge yet)

**When you get Green Card (or switch to O-1):**
- Form an LLC (can do online for ~$50 in Wyoming or Delaware)
- Get EIN from IRS (free, takes 1 week)
- Open Mercury or Relay business bank account (fintech-friendly, no branch visit needed)
- Enable Stripe — done

**Alternative payment processors that are easier for non-US:**
- **Lemon Squeezy** — acts as "merchant of record," you're a contractor. Less legal complexity.
- **Gumroad** — same, they handle everything as the seller. You just receive wire transfers.
- **Paddle** — same model, widely used by indie devs internationally.

> With Lemon Squeezy/Gumroad/Paddle, **you are not the merchant** — they are. You receive contractor payments, which are easier to structure. Still consult a lawyer but risk is much lower.

### Bottom Line

**Don't let Stripe stop you.** Build the platform now. Launch free. Get users. The payment infrastructure can come later when your visa situation changes or you find the right legal structure. Many successful SaaS products ran free for months before monetizing.

---

## 4-Week Build Plan

| Week | What You Build | Key Learning |
|---|---|---|
| **1** | Cognito auth + Next.js login, S3 upload, DynamoDB user table | Auth, NoSQL, S3 pre-signed URLs |
| **2** | Lambda ingest pipeline: PDF → chunks → Pinecone namespace | Event-driven, embeddings, vector isolation |
| **3** | LangGraph RAG agent + Bedrock Nova Micro + streaming chat | Full RAG agent, Bedrock API, SSE streaming |
| **4** | ECS deploy, CloudFront, Route 53 domain, CloudWatch alerts | Production deployment, observability |

**End result:** A live URL. Real users can sign up, upload their docs, get a private AI agent.
