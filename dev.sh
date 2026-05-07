#!/usr/bin/env bash
# =============================================================================
# dev.sh — Start all VegaRAG services locally
#
# Frontend  → http://localhost:3000
# Backend   → http://localhost:8000
# Chat UI   → http://localhost:3001
#
# Usage:  ./dev.sh
# Stop:   Ctrl+C (kills all 3 services)
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Ensure Homebrew and custom binaries are in PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

FRONTEND_DIR="$REPO_ROOT/frontend"
BACKEND_DIR="$REPO_ROOT/backend"
CHAT_UI_DIR="$REPO_ROOT/agent-chat-ui"

# Colors
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'
B='\033[0;34m'; C='\033[0;36m'; N='\033[0m'

PID_BACKEND=0
PID_FRONTEND=0
PID_CHATUI=0

cleanup() {
  echo ""
  echo -e "${Y}⏹  Stopping all services...${N}"
  [ $PID_BACKEND  -gt 0 ] && kill $PID_BACKEND  2>/dev/null || true
  [ $PID_FRONTEND -gt 0 ] && kill $PID_FRONTEND 2>/dev/null || true
  [ $PID_CHATUI   -gt 0 ] && kill $PID_CHATUI   2>/dev/null || true
  wait 2>/dev/null || true
  echo -e "${G}✅ All services stopped.${N}"
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo -e "${C}╔════════════════════════════════════════╗${N}"
echo -e "${C}║   VegaRAG — Local Dev Environment      ║${N}"
echo -e "${C}╚════════════════════════════════════════╝${N}"
echo ""

# ── Backend (FastAPI on port 8000) ────────────────────────────────────────────
echo -e "${G}▶ Starting Backend on http://localhost:8000${N}"
(
  cd "$BACKEND_DIR"
  [ ! -d venv ] && python3 -m venv venv
  source venv/bin/activate
  pip install -q -r requirements.txt 2>/dev/null || true
  [ -f .env ] && export $(grep -v '^#' .env | xargs) 2>/dev/null || true
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | \
    while IFS= read -r line; do printf "${G}[backend]${N} %s\n" "$line"; done
) &
PID_BACKEND=$!
echo -e "  ${G}✓ PID $PID_BACKEND${N}"

sleep 1

# ── Frontend (Next.js on port 3000) ───────────────────────────────────────────
echo -e "${B}▶ Starting Frontend on http://localhost:3000${N}"
(
  cd "$FRONTEND_DIR"
  [ ! -d node_modules ] && npm install --silent
  [ -f .env.local ] && set -a && source .env.local && set +a 2>/dev/null || true
  export PORT=3000
  exec npm run dev 2>&1 | \
    while IFS= read -r line; do printf "${B}[frontend]${N} %s\n" "$line"; done
) &
PID_FRONTEND=$!
echo -e "  ${B}✓ PID $PID_FRONTEND${N}"

sleep 1

# ── Chat UI (Next.js on port 3001) ────────────────────────────────────────────
echo -e "${C}▶ Starting Chat UI on http://localhost:3001${N}"
(
  cd "$CHAT_UI_DIR"

  # Detect pnpm or npm
  if command -v pnpm &>/dev/null && [ -f pnpm-lock.yaml ]; then
    PKG="pnpm"
    [ ! -d node_modules ] && pnpm install --silent 2>/dev/null || true
  else
    PKG="npm"
    [ ! -d node_modules ] && npm install --silent 2>/dev/null || true
  fi

  # Local env: /chat basePath — matches production exactly
  export NEXT_PUBLIC_API_URL="http://localhost:3001/chat/api/langgraph"
  export VEGARAG_BACKEND_URL="http://localhost:8000"
  export NEXT_PUBLIC_APP_NAME="VegaRAG"

  export PORT=3001
  exec $PKG run dev 2>&1 | \
    while IFS= read -r line; do printf "${C}[chat-ui]${N} %s\n" "$line"; done
) &
PID_CHATUI=$!
echo -e "  ${C}✓ PID $PID_CHATUI${N}"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${C}════════════════════════════════════════════${N}"
echo -e "${G}✅ All services started!${N}"
echo ""
echo -e "  ${B}Frontend  →${N}  http://localhost:3000"
echo -e "  ${G}Backend   →${N}  http://localhost:8000"
echo -e "  ${C}Chat UI   →${N}  http://localhost:3001/chat"
echo ""
echo -e "  ${B}API docs  →${N}  http://localhost:8000/docs"
echo -e "  ${B}Chat test →${N}  http://localhost:3001/chat?assistantId=bot_8159fbf0"
echo ""
echo -e "${Y}  Press Ctrl+C to stop all services${N}"
echo -e "${C}════════════════════════════════════════════${N}"
echo ""

# Wait forever (until Ctrl+C)
wait $PID_BACKEND $PID_FRONTEND $PID_CHATUI
