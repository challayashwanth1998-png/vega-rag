#!/usr/bin/env bash
# =============================================================================
# manage.sh — VegaRAG ECS Management Script
# Usage: ./manage.sh
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
AWS_REGION="us-east-1"
ACCOUNT_ID="519008639833"
CLUSTER="vegarag-cluster-v2"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ALB_DNS="vegarag-alb-1907307840.us-east-1.elb.amazonaws.com"

SERVICES=(
  "vegarag-frontend-service"
  "vegarag-backend-service"
  "vegarag-chat-ui-service"
)

# ── Helpers ───────────────────────────────────────────────────────────────────
print_header() {
  echo ""
  echo "════════════════════════════════════════════════════"
  echo "  VegaRAG ECS Manager"
  echo "  Cluster : ${CLUSTER}"
  echo "  Region  : ${AWS_REGION}"
  echo "════════════════════════════════════════════════════"
}

status() {
  echo ""
  echo "▶ Current Service Status:"
  aws ecs describe-services \
    --cluster "${CLUSTER}" \
    --services "${SERVICES[@]}" \
    --region "${AWS_REGION}" \
    --query 'services[*].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}' \
    --output table \
    --no-cli-pager
}

stop_services() {
  echo ""
  echo "▶ Stopping all services (desired count → 0)..."
  for svc in "${SERVICES[@]}"; do
    echo "  Stopping ${svc}..."
    aws ecs update-service \
      --cluster "${CLUSTER}" \
      --service "${svc}" \
      --desired-count 0 \
      --region "${AWS_REGION}" \
      --no-cli-pager \
      --output json > /dev/null && echo "  ✓ ${svc} stopped"
  done
  echo ""
  echo "✅ All services stopped."
}

delete_services() {
  echo ""
  echo "⚠️  This will DELETE all ECS services. Are you sure? (yes/no)"
  read -r confirm
  if [ "${confirm}" != "yes" ]; then
    echo "  Aborted."
    return
  fi
  echo "▶ Deleting all services..."
  for svc in "${SERVICES[@]}"; do
    echo "  Deleting ${svc}..."
    aws ecs delete-service \
      --cluster "${CLUSTER}" \
      --service "${svc}" \
      --force \
      --region "${AWS_REGION}" \
      --no-cli-pager \
      --output json > /dev/null && echo "  ✓ ${svc} deleted"
  done
  echo ""
  echo "✅ All services deleted."
}

redeploy_all() {
  echo ""
  echo "▶ Force-redeploying all services (no rebuild)..."
  for svc in "${SERVICES[@]}"; do
    echo "  Redeploying ${svc}..."
    aws ecs update-service \
      --cluster "${CLUSTER}" \
      --service "${svc}" \
      --force-new-deployment \
      --region "${AWS_REGION}" \
      --no-cli-pager \
      --output json > /dev/null && echo "  ✓ ${svc} redeploying"
  done
  echo ""
  echo "⏳ Waiting for services to stabilize..."
  aws ecs wait services-stable \
    --cluster "${CLUSTER}" \
    --services "${SERVICES[@]}" \
    --region "${AWS_REGION}"
  echo "✅ All services stable!"
}

deploy_frontend_backend() {
  echo ""
  echo "▶ Building & deploying Frontend + Backend..."
  cd "$(dirname "$0")"

  aws ecr get-login-password --region "${AWS_REGION}" | \
    docker login --username AWS --password-stdin "${ECR_REGISTRY}"

  echo "  Building Backend..."
  cd backend
  docker build --platform linux/amd64 -t vegarag-backend .
  docker tag vegarag-backend:latest "${ECR_REGISTRY}/vegarag-backend:latest"
  docker push "${ECR_REGISTRY}/vegarag-backend:latest"
  cd ..

  echo "  Building Frontend..."
  cd frontend
  docker build --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_API_URL="https://vegarag.com" \
    -t vegarag-frontend .
  docker tag vegarag-frontend:latest "${ECR_REGISTRY}/vegarag-frontend:latest"
  docker push "${ECR_REGISTRY}/vegarag-frontend:latest"
  cd ..

  echo "  Updating ECS services..."
  aws ecs update-service --cluster "${CLUSTER}" --service vegarag-frontend-service --force-new-deployment --region "${AWS_REGION}" --no-cli-pager --output json > /dev/null
  aws ecs update-service --cluster "${CLUSTER}" --service vegarag-backend-service  --force-new-deployment --region "${AWS_REGION}" --no-cli-pager --output json > /dev/null

  echo "⏳ Waiting for frontend + backend to stabilize..."
  aws ecs wait services-stable \
    --cluster "${CLUSTER}" \
    --services vegarag-frontend-service vegarag-backend-service \
    --region "${AWS_REGION}"
  echo "✅ Frontend + Backend deployed!"
}

deploy_chat_ui() {
  echo ""
  echo "▶ Deploying Chat UI..."
  cd "$(dirname "$0")/agent-chat-ui"
  chmod +x deploy-chat-ui.sh
  ./deploy-chat-ui.sh
  cd ..
}

deploy_all() {
  deploy_frontend_backend
  deploy_chat_ui
  echo ""
  echo "════════════════════════════════════════════════════"
  echo "✅ Full deploy complete!"
  echo "   Frontend  : http://${ALB_DNS}"
  echo "   Chat UI   : http://${ALB_DNS}/chat/{botId}"
  echo "   API       : http://${ALB_DNS}/api"
  echo "════════════════════════════════════════════════════"
}

# ── Menu ──────────────────────────────────────────────────────────────────────
print_header
echo ""
echo "  What do you want to do?"
echo ""
echo "  1) Status       — show running/desired counts"
echo "  2) Stop         — scale all services to 0"
echo "  3) Delete       — delete all ECS services"
echo "  4) Redeploy     — force-restart tasks (no rebuild)"
echo "  5) Deploy F+B   — build & deploy Frontend + Backend"
echo "  6) Deploy Chat  — build & deploy Chat UI only"
echo "  7) Deploy ALL   — build & deploy everything"
echo ""
read -rp "  Enter choice [1-7]: " choice

case "${choice}" in
  1) status ;;
  2) stop_services ;;
  3) delete_services ;;
  4) redeploy_all ;;
  5) deploy_frontend_backend ;;
  6) deploy_chat_ui ;;
  7) deploy_all ;;
  *) echo "Invalid choice. Exiting."; exit 1 ;;
esac
