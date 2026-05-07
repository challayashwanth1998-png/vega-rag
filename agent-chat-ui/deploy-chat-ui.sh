#!/usr/bin/env bash
# =============================================================================
# deploy-chat-ui.sh
# Deploys agent-chat-ui to AWS ECS Fargate alongside existing vegarag services.
#
# What this script does:
#   1. Creates ECR repo (vegarag-chat-ui) if it doesn't exist
#   2. Builds & pushes Docker image
#   3. Registers ECS task definition (port 3001, same cluster/roles as frontend)
#   4. Creates ECS service (vegarag-chat-ui-service)
#   5. Creates ALB target group (TG-ChatUI, port 3001)
#   6. Adds ALB listener rule: /chat/* → TG-ChatUI
#
# Usage:
#   chmod +x deploy-chat-ui.sh
#   ./deploy-chat-ui.sh
# =============================================================================
set -euo pipefail

# Ensure Homebrew and custom binaries are in PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# ── Config ────────────────────────────────────────────────────────────────────
AWS_REGION="us-east-1"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null)}"
CLUSTER="vegarag-cluster-v2"
ECR_REPO="vegarag-chat-ui"
IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:latest"
SERVICE_NAME="vegarag-chat-ui-service"
TASK_FAMILY="vegarag-chat-ui-task"
CONTAINER_PORT=3001

# Reuse existing infra identifiers from the frontend service
SUBNETS="subnet-06f909831a5e8473a,subnet-0c4755bad35e553f3,subnet-005e55e815c989d12,subnet-09255c6da377db969,subnet-08ce89cd77b9a46ff,subnet-0ac1fd99a66132bfe"
SECURITY_GROUP="sg-09b19e83f734d6be9"
EXECUTION_ROLE="arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole"
ALB_ARN="${ALB_ARN:-$(aws elbv2 describe-load-balancers --names vegarag-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null)}"
LISTENER_ARN="${LISTENER_ARN:-$(aws elbv2 describe-listeners --load-balancer-arn "${ALB_ARN}" --query 'Listeners[0].ListenerArn' --output text 2>/dev/null)}"

# The backend URL reachable from inside the VPC (via ALB) — used by the SSE proxy at runtime
ALB_DNS="${ALB_DNS:-your-alb-dns.us-east-1.elb.amazonaws.com}"
BACKEND_URL="http://${ALB_DNS}"   # /api/* is routed to backend by existing ALB rule

echo "════════════════════════════════════════"
echo " VegaRAG Chat UI — AWS Deploy"
echo "════════════════════════════════════════"

# ── Step 1: Create ECR repo ────────────────────────────────────────────────
echo ""
echo "▶ Step 1: Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names "${ECR_REPO}" --region "${AWS_REGION}" > /dev/null 2>&1 || \
  aws ecr create-repository \
    --repository-name "${ECR_REPO}" \
    --region "${AWS_REGION}" \
    --image-scanning-configuration scanOnPush=true \
    --output json | jq -r '.repository.repositoryUri'
echo "  ✓ ECR repo: ${IMAGE_URI}"

# ── Step 2: Build & push image ─────────────────────────────────────────────
echo ""
echo "▶ Step 2: Building Docker image..."
cd "$(dirname "$0")"

aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL="/chat/api/langgraph" \
  --build-arg NEXT_PUBLIC_ASSISTANT_ID="" \
  --build-arg NEXT_PUBLIC_APP_NAME="VegaRAG" \
  -t "${IMAGE_URI}" \
  -f Dockerfile \
  .

echo ""
echo "▶ Step 2b: Pushing image to ECR..."
docker push "${IMAGE_URI}"
echo "  ✓ Image pushed: ${IMAGE_URI}"

# ── Step 3: Register task definition ──────────────────────────────────────
echo ""
echo "▶ Step 3: Registering ECS task definition..."
TASK_DEF=$(cat <<EOF
{
  "family": "${TASK_FAMILY}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${EXECUTION_ROLE}",
  "containerDefinitions": [
    {
      "name": "chat-ui-container",
      "image": "${IMAGE_URI}",
      "portMappings": [
        {
          "containerPort": ${CONTAINER_PORT},
          "hostPort": ${CONTAINER_PORT},
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "VEGARAG_BACKEND_URL",
          "value": "${BACKEND_URL}"
        },
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "/chat/api/langgraph"
        },
        {
          "name": "PORT",
          "value": "${CONTAINER_PORT}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/vegarag-chat-ui",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "essential": true
    }
  ]
}
EOF
)

TASK_DEF_ARN=$(echo "${TASK_DEF}" | aws ecs register-task-definition \
  --cli-input-json "$(echo "${TASK_DEF}" | cat)" \
  --region "${AWS_REGION}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)
echo "  ✓ Task definition: ${TASK_DEF_ARN}"

# ── Step 4: Create ALB Target Group ───────────────────────────────────────
echo ""
echo "▶ Step 4: Creating target group TG-ChatUI on port ${CONTAINER_PORT}..."

# Get VPC ID from existing target group
VPC_ID=$(aws elbv2 describe-target-groups \
  --names "TG-Frontend" \
  --query 'TargetGroups[0].VpcId' \
  --output text \
  --region "${AWS_REGION}" 2>/dev/null || echo "")

if [ -z "${VPC_ID}" ]; then
  VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' --output text --region "${AWS_REGION}")
fi

TG_ARN=$(aws elbv2 describe-target-groups --names "TG-ChatUI" \
  --query 'TargetGroups[0].TargetGroupArn' --output text --region "${AWS_REGION}" 2>/dev/null || echo "")

if [ -z "${TG_ARN}" ] || [ "${TG_ARN}" = "None" ]; then
  TG_ARN=$(aws elbv2 create-target-group \
    --name "TG-ChatUI" \
    --protocol HTTP \
    --port "${CONTAINER_PORT}" \
    --vpc-id "${VPC_ID}" \
    --target-type ip \
    --health-check-path "/" \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region "${AWS_REGION}" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)
  echo "  ✓ Created TG-ChatUI: ${TG_ARN}"
else
  echo "  ✓ TG-ChatUI already exists: ${TG_ARN}"
fi

# ── Step 5: Add ALB listener rule /chat/* ────────────────────────────────
echo ""
echo "▶ Step 5: Adding ALB listener rule for /chat/* ..."

# Check if rule already exists
EXISTING_RULE=$(aws elbv2 describe-rules \
  --listener-arn "${LISTENER_ARN}" \
  --query "Rules[?Conditions[?PathPatternConfig.Values[?contains(@, '/chat/*')]]].[RuleArn]" \
  --output text --region "${AWS_REGION}" 2>/dev/null || echo "")

if [ -z "${EXISTING_RULE}" ] || [ "${EXISTING_RULE}" = "None" ]; then
  aws elbv2 create-rule \
    --listener-arn "${LISTENER_ARN}" \
    --priority 5 \
    --conditions '[{"Field":"path-pattern","PathPatternConfig":{"Values":["/chat/*"]}}]' \
    --actions "[{\"Type\":\"forward\",\"TargetGroupArn\":\"${TG_ARN}\"}]" \
    --region "${AWS_REGION}" \
    --output json > /dev/null
  echo "  ✓ Listener rule created: /chat/* → TG-ChatUI"
else
  echo "  ✓ Listener rule already exists"
fi

# ── Step 6: Create / update ECS service ────────────────────────────────────
echo ""
echo "▶ Step 6: Creating/updating ECS service..."

SERVICE_EXISTS=$(aws ecs describe-services \
  --cluster "${CLUSTER}" \
  --services "${SERVICE_NAME}" \
  --query 'services[0].status' \
  --output text --region "${AWS_REGION}" 2>/dev/null || echo "MISSING")

if [ "${SERVICE_EXISTS}" = "ACTIVE" ]; then
  echo "  Service exists — updating task definition..."
  aws ecs update-service \
    --cluster "${CLUSTER}" \
    --service "${SERVICE_NAME}" \
    --task-definition "${TASK_DEF_ARN}" \
    --force-new-deployment \
    --region "${AWS_REGION}" \
    --output json > /dev/null
  echo "  ✓ Service updated with new task definition"
else
  aws ecs create-service \
    --cluster "${CLUSTER}" \
    --service-name "${SERVICE_NAME}" \
    --task-definition "${TASK_DEF_ARN}" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${SECURITY_GROUP}],assignPublicIp=ENABLED}" \
    --load-balancers "[{\"targetGroupArn\":\"${TG_ARN}\",\"containerName\":\"chat-ui-container\",\"containerPort\":${CONTAINER_PORT}}]" \
    --region "${AWS_REGION}" \
    --output json > /dev/null
  echo "  ✓ Service created: ${SERVICE_NAME}"
fi

echo ""
echo "════════════════════════════════════════"
echo " ✅ Deploy complete!"
echo ""
echo " Chat UI will be available at:"
echo "   http://${ALB_DNS}/chat/{bot_id}"
echo ""
echo " The deploy page 'Open App' link should use:"
echo "   http://${ALB_DNS}/chat/{botId}?assistantId={botId}"
echo "════════════════════════════════════════"
