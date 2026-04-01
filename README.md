# 🌌 VegaRAG

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)

**The Enterprise-Grade SaaS boilerplate for building AI Agents with Amazon Bedrock Nova.**  
Deploy a multi-tenant RAG (Retrieval-Augmented Generation) platform locally or on AWS Fargate in minutes.

---

## 🚀 Overview

VegaRAG is a full-stack, open-source engine that allows you to:
- **Build AI Agents:** Connect Amazon Bedrock to your private documentation, website URLs, or raw files.
- **Scale on AWS:** Designed for high-performance serverless execution using ECS Fargate and DynamoDB.
- **Embedded Widget:** A drop-in Javascript widget for any website that inherits your brand colors automatically.
- **Admin Ops Center:** Built-in dashboard to monitor user activity and LLM expenditure.

## 🛠 Tech Stack

- **Frontend:** Next.js, Tailwind CSS, Framer Motion, Recharts.
- **Backend:** FastAPI, Python 3.11+, Boto3.
- **AI Engine:** Amazon Bedrock (Nova Micro), LangGraph, Pinecone (Vector DB).
- **Deployment:** Docker, AWS Fargate, AWS ECR, AWS Cognito.

---

## 📁 Repository Structure

We use an industry-standard Monorepo layout for efficient development and deployment.

```text
vega-rag/
├── apps/
│   ├── frontend/         # Next.js web application
│   └── widget/           # Vite Javascript embed widget
├── services/
│   └── backend/          # FastAPI Python backend
├── .github/              # GitHub Actions workflows
├── docker-compose.yml    # Local development orchestration
├── deploy.sh             # Deployment automation script
└── Makefile              # Task runner for build/deploy
```

---

## 🏁 Getting Started (Local Development)

### 1. Prerequisites
- [AWS Account](https://aws.amazon.com/) with Bedrock Nova access enabled in `us-east-1`.
- [Pinecone API Key](https://www.pinecone.io/) for high-speed Vector storage.
- [Docker](https://www.docker.com/) for containerization.

### 2. Configure Environment Variables
Create a `.env` file in both `services/backend/` and `apps/frontend/` directories.

**Backend (.env):**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_TABLE_NAME=PlatformDB
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=vegarag-index
```

### 3. Run Locally

You can use the provided `Makefile` to quickly start the application:

```bash
make up
```
Or use Docker Compose directly:
```bash
docker-compose up --build
```
Your dashboard will be available at `http://localhost:3000` and the API at `http://localhost:8000`.

---

## ☁️ Complete AWS Setup Guide (CLI)

To deploy VegaRAG to production or use it locally with a remote AWS environment, you need to provision the core infrastructure. You can do this instantly via the AWS CLI.

### 1. Create the DynamoDB Table
VegaRAG uses a single DynamoDB table to store all multi-tenant state.

```bash
aws dynamodb create-table \
    --table-name vegarag_table \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2. Create the S3 Document Bucket
This bucket stores uploaded PDFs, website scrapes, and CSV/Excel files.

```bash
# S3 bucket names must be globally unique. Change 'vegarag-documents-123' to your own unique name.
aws s3 mb s3://vegarag-documents-123 --region us-east-1

# Block public access (Security Best Practice)
aws s3api put-public-access-block \
    --bucket vegarag-documents-123 \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 3. Enable Amazon Bedrock Models
1. Open the [AWS Bedrock Console (us-east-1)](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess).
2. Click **Modify model access**.
3. Check the boxes for **Amazon Titan Text Embeddings v2** and **Amazon Nova Micro**.
4. Click **Save changes**.

### 4. Create ECR Repositories and Push Images

```bash
# 1. Create Repositories
aws ecr create-repository --repository-name vegarag-backend --region us-east-1
aws ecr create-repository --repository-name vegarag-frontend --region us-east-1

# 2. Authenticate Docker to your ECR Registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build and Push Backend
cd services/backend
docker build --platform linux/amd64 -t vegarag-backend .
docker tag vegarag-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest

# 4. Build and Push Frontend
cd ../../apps/frontend
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL=https://your-alb-domain.com -t vegarag-frontend .
docker tag vegarag-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-frontend:latest
```

---

## 🚢 AWS ECS Fargate Deployment Guide

Deploying a multi-container application on AWS involves provisioning a Cluster, an Application Load Balancer (ALB), and Task Definitions.

### Step 1: Create an ECS Cluster
```bash
aws ecs create-cluster --cluster-name vegarag-cluster --region us-east-1
```

### Step 2: Create IAM Roles
```bash
# Create the standard execution role
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://services/backend/ecs-trust-policy.json
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create the Task Role (access to Bedrock, S3, and DynamoDB)
aws iam create-role --role-name vegaragTaskRole --assume-role-policy-document file://services/backend/ecs-trust-policy.json
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

### Step 3: Register Task Definitions
You must define `backend-task.json` and `frontend-task.json` (see examples in `services/backend`).

```bash
aws ecs register-task-definition --cli-input-json file://services/backend/backend-task.json
```

### Step 4: Create Load Balancer (ALB)
Set up your ALB and Target Groups to route traffic. `/api/*` should route to the FastAPI backend (port 8000), and all other traffic to the Next.js frontend (port 3000).

### Step 5: Launch ECS Services
Finally, launch the containers into the cluster!

```bash
make deploy
```

---

## 🔒 Security & Privacy

VegaRAG is designed with **Private-by-Default** principles:
- **No Data Training:** Your data is never used to train base foundation models on Amazon Bedrock.
- **VPC Containment:** Inference traffic stays within the AWS backbone.
- **Multi-Tenancy:** Each user's data is logically segregated in DynamoDB and Pinecone namespace.

---

## 📜 License

Distributed under the [MIT License](LICENSE).

---

## 🤝 Contributing

We welcome contributions! See our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

Built with ❤️ by the VegaRAG Team. [Visit VegaRAG.com](https://vegarag.com)
