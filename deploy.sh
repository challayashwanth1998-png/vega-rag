#!/bin/bash
# VegaRAG Production Deployment

ECR_REGISTRY="519008639833.dkr.ecr.us-east-1.amazonaws.com"

echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

echo "🚀 Building Backend..."
cd backend
docker build --platform linux/amd64 -t vegarag-backend .
docker tag vegarag-backend:latest $ECR_REGISTRY/vegarag-backend:latest
docker push $ECR_REGISTRY/vegarag-backend:latest
cd ..

echo "🚀 Building Frontend..."
cd frontend
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL="$APIBASEURL" -t vegarag-frontend .
docker tag vegarag-frontend:latest $ECR_REGISTRY/vegarag-frontend:latest
docker push $ECR_REGISTRY/vegarag-frontend:latest
cd ..

echo "Refreshing ECS Services..."
aws ecs update-service --cluster vegarag-cluster-v2 --service vegarag-frontend-service --force-new-deployment --region us-east-1
aws ecs update-service --cluster vegarag-cluster-v2 --service vegarag-backend-service --force-new-deployment --region us-east-1

echo "✅ Deployment Successful! Check ECS Console for rollout status."
