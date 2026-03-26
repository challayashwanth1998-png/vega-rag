# VegaRAG Exhaustive Fargate Deployment Guide

Because you lack a custom domain right now, we will map this entire system directly through an **Amazon Application Load Balancer (ALB)**. The ALB automatically assigns you a massive public URL (e.g. `vegarag-alb-1249A.us-east-1.elb.amazonaws.com`). This acts as your temporary domain!

---

## 🔒 1. AWS Systems Manager (Environment Secure Keys)
Your `.env` files currently sit on your local Macbook. When you push this to AWS, you **NEVER** package `.env` strings into GitHub or Docker. 
Instead, open the **AWS Console** -> **Systems Manager** -> **Parameter Store** and create these exact keys (Type: `SecureString`):

- `/vegarag/prod/AWS_REGION` -> `us-east-1`
- `/vegarag/prod/DYNAMODB_TABLE_NAME` -> `VegaRAG_DB`
- `/vegarag/prod/PINECONE_API_KEY` -> `<Copy from your backend/.env>`
- `/vegarag/prod/PINECONE_ENVIRONMENT` -> `us-east-1`
- `/vegarag/prod/NEXT_PUBLIC_COGNITO_USER_POOL_ID` -> `<Copy from frontend/.env.local>`
- `/vegarag/prod/NEXT_PUBLIC_COGNITO_APP_CLIENT_ID` -> `<Copy from frontend/.env.local>`

*In Step 5, we will tell AWS ECS natively how to inject these keys into RAM securely at boot.*

---

## ⚖️ 2. Create The Load Balancer (To Get Your URL)
You need to generate your public URL *before* building your code. 
1. Go to AWS **EC2 -> Target Groups**.
   * Create **TG-Frontend**: Choose "IP Addresses", Port 3000.
   * Create **TG-Backend**: Choose "IP Addresses", Port 8000.
2. Go to **EC2 -> Load Balancers -> Create ALB**.
   * Scheme: Internet-facing
   * Security Group: Auto-create one allowing `Port 80 Inbound`.
   * **Default Action Rule**: Forward all traffic directly to `TG-Frontend`.
   * **Custom Rule**: If Path matches `/api/*`, Forward to `TG-Backend`.
3. **Save your ALB DNS Name** (e.g. `vegarag-alb-129...elb.amazonaws.com`).

---

## ✏️ 3. Map The URL Inside Your Code (CRITICAL)
Your Chat Widget is embedded on external Client Websites (like Shopify). The Javascript file must point back to the ALB DNS you successfully generated in Step 2.

1. Open `/Users/challa/Documents/vegaRAG/frontend/public/widget.js`.
2. Go to **Line 11**.
3. Change `const HOST_URL = 'http://localhost:3000';` to `const HOST_URL = 'http://YOUR-ALB-DNS-NAME.com';`
4. Save the file.

---

## 📦 4. Build & Push Your Production Docker Images
Now that your code contains the live production URL, build the containers.

1. Head to **ECR (Elastic Container Registry)**.
2. Create 2 Private Repos: `vegarag-frontend` and `vegarag-backend`.
3. Open your Mac Terminal and run:
```bash
# Login to AWS Docker securely
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 1. Build and Push Backend 
cd backend
docker build -t vegarag-backend:latest .
docker tag vegarag-backend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest

# 2. Build and Push Frontend 
cd ../frontend
docker build -t vegarag-frontend:latest .
docker tag vegarag-frontend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-frontend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/vegarag-frontend:latest
```

---

## 🚀 5. Spin Up Fargate Serverless Containers
Now we connect your images to your Target Groups!

1. Go to **AWS ECS** -> Create a new Fargate Cluster.
2. Create **Task Definitions** (One for Frontend, One for Backend).
3. Inside the "Environment Variables" configurator, select `ValueFrom` instead of Value, and paste the ARN paths of the SecureStrings you made in Step 1.
4. Go to the "Cluster Services" tab and launch both tools mapping them directly to the Target Groups from Step 4.

### 🏁 Final Test
Once the ECS Tasks read "RUNNING", grab your ALB's physical `.amazonaws.com` DNS name, paste it into Chrome, and your production-grade AI platform will instantly load!
