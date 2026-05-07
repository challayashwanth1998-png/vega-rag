# DEPLOY.md — VegaRAG Full Deployment Guide for AI Agents

> **Purpose:** This file is written for AI coding agents (Gemini, Claude, GPT-4, etc.) to fully understand, provision infrastructure, and deploy VegaRAG end-to-end from a cold AWS account. Read `AGENTS.md` first for codebase context, then use this file for infrastructure and deployment.

---

## 1. What You Are Deploying

VegaRAG is a **three-service containerized application** running on AWS ECS Fargate:

| Service | Directory | Port | Image Name |
|---------|-----------|------|------------|
| Backend (FastAPI + LangGraph) | `backend/` | 8000 | `vegarag-backend` |
| Frontend (Next.js Admin Dashboard) | `frontend/` | 3000 | `vegarag-frontend` |
| Chat UI (Next.js End-User Interface) | `agent-chat-ui/` | 3001 | `vegarag-chat-ui` |

All three sit behind a **single AWS Application Load Balancer (ALB)** with path-based routing:
- `/chat/*` → Chat UI (port 3001)
- `/api/*` → Backend (port 8000)
- `/*` → Frontend (port 3000)

---

## 2. AWS Prerequisites

Before deploying, provision these resources **once** in `us-east-1`:

### 2.1 DynamoDB Table
```bash
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
```

### 2.2 S3 Bucket (for uploaded documents)
```bash
# Replace <YOUR_UNIQUE_BUCKET_NAME> with a globally unique name
aws s3 mb s3://<YOUR_UNIQUE_BUCKET_NAME> --region us-east-1
aws s3api put-public-access-block \
  --bucket <YOUR_UNIQUE_BUCKET_NAME> \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 2.3 Pinecone Index
1. Create an account at [pinecone.io](https://pinecone.io)
2. Create an index named `vegarag-index` with **1536 dimensions** and **cosine** metric
3. Copy your API key

### 2.4 Enable Amazon Bedrock Models
In the [Bedrock Console](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess), enable:
- **Amazon Titan Text Embeddings v2** (for RAG embeddings)
- **Amazon Nova Micro** (for intent classification + hallucination judge)
- **Amazon Nova Lite** (for SQL generation)
- **Amazon Nova Pro** (for response synthesis)

### 2.5 ECR Repositories
```bash
aws ecr create-repository --repository-name vegarag-backend  --region us-east-1
aws ecr create-repository --repository-name vegarag-frontend --region us-east-1
aws ecr create-repository --repository-name vegarag-chat-ui  --region us-east-1
```

### 2.6 IAM Roles

**Execution Role** (allows ECS to pull images and write logs):
```bash
aws iam create-role --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]
  }'
aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

**Task Role** (grants the running container access to AWS services — no long-lived keys needed):
```bash
aws iam create-role --role-name vegaragTaskRole \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]
  }'
aws iam attach-role-policy --role-name vegaragTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
aws iam attach-role-policy --role-name vegaragTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name vegaragTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

### 2.7 ECS Cluster
```bash
aws ecs create-cluster --cluster-name vegarag-cluster-v2 --region us-east-1
```

### 2.8 VPC, Subnets, Security Group
Use the **default VPC** or create a new one. You need:
- At least 2 public subnets in different AZs
- 1 security group allowing inbound: ports 80, 443, 3000, 3001, 8000 from `0.0.0.0/0`

```bash
# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' --output text)

# Get two subnet IDs
SUBNETS=$(aws ec2 describe-subnets --filters Name=vpcId,Values=$VPC_ID \
  --query 'Subnets[0:2].SubnetId' --output text | tr '\t' ',')

# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name vegarag-sg --description "VegaRAG services" \
  --vpc-id $VPC_ID --query 'GroupId' --output text)

for PORT in 80 443 3000 3001 8000; do
  aws ec2 authorize-security-group-ingress --group-id $SG_ID \
    --protocol tcp --port $PORT --cidr 0.0.0.0/0
done
```

### 2.9 Application Load Balancer
```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name vegarag-alb --type application --scheme internet-facing \
  --subnets $(echo $SUBNETS | tr ',' ' ') \
  --security-groups $SG_ID \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create Target Groups
TG_FRONTEND=$(aws elbv2 create-target-group --name vegarag-tg-frontend \
  --protocol HTTP --port 3000 --vpc-id $VPC_ID --target-type ip \
  --health-check-path /api/health \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

TG_BACKEND=$(aws elbv2 create-target-group --name vegarag-tg-backend \
  --protocol HTTP --port 8000 --vpc-id $VPC_ID --target-type ip \
  --health-check-path /health \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

TG_CHATUI=$(aws elbv2 create-target-group --name vegarag-tg-chatui \
  --protocol HTTP --port 3001 --vpc-id $VPC_ID --target-type ip \
  --health-check-path /chat/api/health \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create Listener (default → Frontend)
LISTENER_ARN=$(aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_FRONTEND \
  --query 'Listeners[0].ListenerArn' --output text)

# Priority 10: /api/* → Backend
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 10 \
  --conditions '[{"Field":"path-pattern","Values":["/api/*"]}]' \
  --actions "[{\"Type\":\"forward\",\"TargetGroupArn\":\"$TG_BACKEND\"}]"

# Priority 5: /chat/* → Chat UI
aws elbv2 create-rule --listener-arn $LISTENER_ARN --priority 5 \
  --conditions '[{"Field":"path-pattern","Values":["/chat/*"]}]' \
  --actions "[{\"Type\":\"forward\",\"TargetGroupArn\":\"$TG_CHATUI\"}]"

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' --output text)
echo "ALB DNS: $ALB_DNS"
```

---

## 3. Environment Variables

### Backend (`backend/.env`)
```env
AWS_REGION=us-east-1
# Local dev only — ECS uses the Task Role automatically (no keys needed in production)
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_TABLE_NAME=PlatformDB
S3_DOCUMENT_BUCKET=<YOUR_UNIQUE_BUCKET_NAME>
PINECONE_API_KEY=<your_pinecone_api_key>
PINECONE_INDEX_NAME=vegarag-index
```

### Frontend (`frontend/.env.local`)
```env
# Local dev
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production (baked at build time — must pass as --build-arg to Docker)
NEXT_PUBLIC_API_URL=http://<ALB_DNS>
```

### Chat UI (`agent-chat-ui/.env.local`)
```env
# Runtime variable (set in ECS task definition, not baked at build)
VEGARAG_BACKEND_URL=http://<ALB_DNS>
NEXT_PUBLIC_API_URL=http://<ALB_DNS>/chat/api/langgraph
PORT=3001
```

> **Critical:** `NEXT_PUBLIC_*` variables are baked into the JavaScript bundle at build time. For ECS, pass `NEXT_PUBLIC_API_URL` as a `--build-arg` in the `docker build` command. Only `VEGARAG_BACKEND_URL` can be set at runtime via ECS task definition.

---

## 4. Build & Push Docker Images

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"
ALB_DNS="<your-alb-dns>.us-east-1.elb.amazonaws.com"

# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# ── Backend ──
cd backend
docker build --platform linux/amd64 -t vegarag-backend .
docker tag vegarag-backend:latest $ECR_REGISTRY/vegarag-backend:latest
docker push $ECR_REGISTRY/vegarag-backend:latest
cd ..

# ── Frontend ──
cd frontend
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=http://$ALB_DNS \
  -t vegarag-frontend .
docker tag vegarag-frontend:latest $ECR_REGISTRY/vegarag-frontend:latest
docker push $ECR_REGISTRY/vegarag-frontend:latest
cd ..

# ── Chat UI ──
cd agent-chat-ui
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=http://$ALB_DNS/chat/api/langgraph \
  -t vegarag-chat-ui .
docker tag vegarag-chat-ui:latest $ECR_REGISTRY/vegarag-chat-ui:latest
docker push $ECR_REGISTRY/vegarag-chat-ui:latest
cd ..
```

---

## 5. ECS Task Definitions & Services

Register task definitions and create services for all three containers. Use the `manage.sh` script (interactive menu) or `agent-chat-ui/deploy-chat-ui.sh` for automated deployment:

```bash
# Interactive deploy menu — covers all 3 services
./manage.sh

# Options:
# 1 — Status: show running/desired counts for all services
# 4 — Redeploy: force-restart tasks without rebuilding (fast, ~2 min)
# 5 — Deploy F+B: build + push Backend + Frontend
# 6 — Deploy Chat: build + push Chat UI
# 7 — Deploy ALL: build + push all 3 services (use after any code change)
```

### ECS Service Configuration (per service)
| Setting | Value |
|---------|-------|
| Launch type | FARGATE |
| CPU | 512 (.5 vCPU) |
| Memory | 1024 (1 GB) |
| Desired count | 1 |
| Assign public IP | ENABLED |
| Subnets | Your 2 public subnets |
| Security group | vegarag-sg |

---

## 6. Local Development

```bash
# 1. Copy env files
cp backend/.env.example backend/.env        # fill in your values
cp frontend/.env.example frontend/.env.local
cp agent-chat-ui/.env.example agent-chat-ui/.env.local

# 2. Start all 3 services
./dev.sh

# Services will be available at:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# Chat UI:   http://localhost:3001/chat
# API docs:  http://localhost:8000/docs
```

---

## 7. Post-Deployment Verification

```bash
ALB_DNS="your-alb-dns.us-east-1.elb.amazonaws.com"

# Backend health
curl http://$ALB_DNS/api/health

# Frontend loads
curl -I http://$ALB_DNS/

# Chat UI loads
curl -I http://$ALB_DNS/chat/

# Create a test bot
curl -X POST http://$ALB_DNS/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Bot"}' | python3 -m json.tool

# List all bots
curl http://$ALB_DNS/api/agents | python3 -m json.tool
```

---

## 8. Custom Domain (Optional)

```bash
# 1. Register domain in Route 53 or transfer existing domain
# 2. Request SSL cert via ACM (free)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names "*.yourdomain.com" \
  --validation-method DNS \
  --region us-east-1

# 3. Add HTTPS listener to ALB pointing to same target groups
# 4. Create Route 53 A record (alias) pointing to ALB DNS
```

---

## 9. Key Files Reference

| File | Purpose |
|------|---------|
| `AGENTS.md` | Codebase intelligence — read this to understand how the code works |
| `DEPLOY.md` | This file — infrastructure and deployment guide |
| `manage.sh` | AWS ECS deploy management (interactive menu) |
| `dev.sh` | Start all 3 services locally |
| `agent-chat-ui/deploy-chat-ui.sh` | Automated Chat UI deployment to ECS |
| `backend/.env` | Backend environment config |
| `frontend/.env.local` | Frontend environment config |
| `agent-chat-ui/.env.local` | Chat UI environment config |
| `.github/workflows/rag_eval.yml` | CI/CD RAG quality gate |
| `.github/workflows/track_traffic.yml` | Daily GitHub traffic snapshot |

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Chat returns empty response | DynamoDB write latency | Stream cache bridges this — check `route.ts` streamCache |
| Video autoplay not working | Browser blocked autoplay | Must be `muted` + `autoPlay` + `playsInline` — already set |
| `/chat/api/*` 404 | basePath mismatch | All client-side Chat UI fetches MUST use `/chat/api/` prefix |
| ECS task keeps stopping | Missing env var | Check CloudWatch logs: `/ecs/vegarag-backend` |
| Bedrock 403 | Model not enabled | Enable models in Bedrock Console → Model Access |
| Pinecone 401 | Wrong API key | Check `PINECONE_API_KEY` in backend env |
| Frontend shows stale build | `NEXT_PUBLIC_*` not updated | Must rebuild Docker image — env is baked at build time |
| `NEXT_PUBLIC_API_URL` wrong in prod | Set at runtime, not build | Pass as `--build-arg` during `docker build`, not in ECS task def |
