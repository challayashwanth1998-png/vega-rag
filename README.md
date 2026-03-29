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

## 🔒 Security & Privacy

VegaRAG is designed with **Private-by-Default** principles:
- **No Data Training:** Your data is never used to train base foundation models on Amazon Bedrock.
- **VPC Containment:** Inference traffic stays within the AWS backbone.
- **Multi-Tenancy:** Each user's data is logically segregated in DynamoDB and Pinecone namespace.

---

## 📜 License

Distributed under the MIT License.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

---

Built with ❤️ by the VegaRAG Team. [Visit VegaRAG.com](https://vegarag.com)
