# ==========================================
# agent-chat-ui Dockerfile (AWS Fargate Ready)
# Mirrors the pattern used by vegarag-frontend
# ==========================================
FROM --platform=linux/amd64 node:20-slim AS builder
WORKDIR /app

# agent-chat-ui uses pnpm; install it via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lockfile and manifest first for layer caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build args injected at image build time
# NEXT_PUBLIC_API_URL is the public URL of this service itself (for client-side SDK)
ARG NEXT_PUBLIC_API_URL="/chat/api/langgraph"
ARG NEXT_PUBLIC_ASSISTANT_ID=""
ARG NEXT_PUBLIC_APP_NAME="VegaRAG"
ARG NEXT_PUBLIC_APP_LOGO_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ASSISTANT_ID=$NEXT_PUBLIC_ASSISTANT_ID
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_LOGO_URL=$NEXT_PUBLIC_APP_LOGO_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# ── Stage 2: Lightweight runner ───────────────────────────────────────────────
FROM --platform=linux/amd64 node:20-slim AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

# VEGARAG_BACKEND_URL is set at runtime by ECS task definition
# Points to the ALB backend path: http://vegarag-alb-xxx.us-east-1.elb.amazonaws.com
ENV PORT=3001
CMD ["node_modules/.bin/next", "start", "--port", "3001"]
