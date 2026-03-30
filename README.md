# 🌌 VegaRAG

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

## 🏁 Getting Started (Local Development)

### 1. Prerequisites
- [AWS Account](https://aws.amazon.com/) with Bedrock Nova access enabled in `us-east-1`.
- [Pinecone API Key](https://www.pinecone.io/) for high-speed Vector storage.
- [Docker](https://www.docker.com/) for containerization.

### 2. Configure Environment Variables
Create a `.env` file in both `backend/` and `frontend/` directories.

**Backend (.env):**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_TABLE_NAME=PlatformDB
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=vegarag-index
```

### 3. Run with Docker Compose
```bash
docker-compose up --build
```
Your dashboard will be available at `http://localhost:3000` and the API at `http://localhost:8000`.

---

## ☁️ Complete AWS Setup Guide (CLI)

To deploy VegaRAG to production or use it locally with a remote AWS environment, you need to provision the core infrastructure. You can do this instantly via the AWS CLI.

### 1. Create the DynamoDB Table
VegaRAG uses a single DynamoDB table to store all multi-tenant state (Agents, Users, Data Sources, DuckDB Schemas).

```bash
aws dynamodb create-table \\
    --table-name vegarag_table \\
    --attribute-definitions \\
        AttributeName=PK,AttributeType=S \\
        AttributeName=SK,AttributeType=S \\
    --key-schema \\
        AttributeName=PK,KeyType=HASH \\
        AttributeName=SK,KeyType=RANGE \\
    --billing-mode PAY_PER_REQUEST \\
    --region us-east-1
```

### 2. Create the S3 Document Bucket
This bucket stores uploaded PDFs, website scrapes, and CSV/Excel files for the Text-to-SQL pipeline.

```bash
# S3 bucket names must be globally unique. Change 'vegarag-documents-123' to your own unique name.
aws s3 mb s3://vegarag-documents-123 --region us-east-1

# Block public access (Security Best Practice)
aws s3api put-public-access-block \\
    --bucket vegarag-documents-123 \\
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

*Don't forget to update your `.env` with your unique `S3_DOCUMENT_BUCKET` name!*

### 3. Enable Amazon Bedrock Models
AWS Bedrock models are disabled by default. You cannot enable them via CLI without accepting the EULA. 
1. Open the [AWS Bedrock Console (us-east-1)](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess).
2. Click **Modify model access**.
3. Check the boxes for **Amazon Titan Text Embeddings v2** and **Amazon Nova Micro**.
4. Click **Save changes**. Approval is usually instant.

### 4. Create ECR Repositories and Push Images
To deploy the Docker containers to AWS ECS Fargate, create the container registries:

```bash
# 1. Create Repositories
aws ecr create-repository --repository-name vegarag-backend --region us-east-1
aws ecr create-repository --repository-name vegarag-frontend --region us-east-1

# 2. Authenticate Docker to your ECR Registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build and Push Backend
cd backend
docker build --platform linux/amd64 -t vegarag-backend .
docker tag vegarag-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest

# 4. Build and Push Frontend (Requires the future Backend URL for Next.js build step)
cd ../frontend
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL=https://your-alb-domain.com -t vegarag-frontend .
docker tag vegarag-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-frontend:latest
```

---

## 🚢 AWS ECS Fargate Deployment Guide

Deploying a multi-container application on AWS involves provisioning a Cluster, an Application Load Balancer (ALB), and Task Definitions. By using **Fargate**, you don't need to manage EC2 instances.

### Step 1: Create an ECS Cluster
```bash
aws ecs create-cluster --cluster-name vegarag-cluster --region us-east-1
```

### Step 2: Create execution and task roles (Zero-Key Security)
DO NOT put your `AWS_ACCESS_KEY_ID` in the container environment variables. Create an IAM Role instead natively assigned to the Fargate instances.

```bash
# Create the standard execution role (allows Fargate to pull from ECR and write logs)
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://ecs-trust-policy.json
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create the Task Role (this gives the running python app access to Bedrock, S3, and DynamoDB)
aws iam create-role --role-name vegaragTaskRole --assume-role-policy-document file://ecs-trust-policy.json
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name vegaragTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

### Step 3: Register Task Definitions
You must define `backend-task.json` and `frontend-task.json` telling ECS how to run your pushed images.

**Example `backend-task.json`**:
```json
{
  "family": "vegarag-backend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/vegaragTaskRole",
  "containerDefinitions": [
    {
      "name": "vegarag-backend",
      "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest",
      "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
      "environment": [
        {"name": "PINECONE_API_KEY", "value": "your-key-here"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/vegarag",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```
**Register it:**
```bash
aws ecs register-task-definition --cli-input-json file://backend-task.json
```

### Step 4: Create an Application Load Balancer (ALB) and Target Groups
Because we have two services (Next.js on 3000, FastAPI on 8000), we want to route them through a single domain name (e.g. `your-domain.com`).

```bash
# 1. Create Target Groups
aws elbv2 create-target-group --name vegarag-tg-frontend --protocol HTTP --port 3000 --vpc-id <YOUR_VPC_ID> --target-type ip
aws elbv2 create-target-group --name vegarag-tg-backend --protocol HTTP --port 8000 --vpc-id <YOUR_VPC_ID> --target-type ip

# 2. Create the Load Balancer
aws elbv2 create-load-balancer --name vegarag-alb --subnets <SUBNET_1> <SUBNET_2> --security-groups <SG_ID>

# 3. Create a Listener on Port 80 (or 443 for HTTPS) resolving to Frontend initially
aws elbv2 create-listener --load-balancer-arn <ALB_ARN> --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=<FRONTEND_TG_ARN>

# 4. Create an ALB Rule for Backend Routing
aws elbv2 create-rule --listener-arn <LISTENER_ARN> --priority 10 \\
  --conditions Field=path-pattern,Values='/api/*' \\
  --actions Type=forward,TargetGroupArn=<BACKEND_TG_ARN>
```

### Step 5: Launch the ECS Services
Finally, launch the containers into the cluster! AWS will boot them, attach them to the ALB target groups, and keep them alive.

```bash
# Launch Backend Service
aws ecs create-service \\
    --cluster vegarag-cluster \\
    --service-name vegarag-backend-svc \\
    --task-definition vegarag-backend-task \\
    --desired-count 1 \\
    --launch-type FARGATE \\
    --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_1>,<SUBNET_2>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}" \\
    --load-balancers "targetGroupArn=<BACKEND_TG_ARN>,containerName=vegarag-backend,containerPort=8000"

# Launch Frontend Service
aws ecs create-service \\
    --cluster vegarag-cluster \\
    --service-name vegarag-frontend-svc \\
    --task-definition vegarag-frontend-task \\
    --desired-count 1 \\
    --launch-type FARGATE \\
    --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_1>,<SUBNET_2>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}" \\
    --load-balancers "targetGroupArn=<FRONTEND_TG_ARN>,containerName=vegarag-frontend,containerPort=3000"
```

Everything is now deployed! Traffic hitting your ALB will cleanly route `/api/*` to the FastAPI backend and all other traffic to your Next.js frontend!

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

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for more details.

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

---

Built with ❤️ by the VegaRAG Team. [Visit VegaRAG.com](https://vegarag.com)
