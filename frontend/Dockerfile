# ==========================================
# Next.js Frontend Dockerfile (AWS Fargate Ready)
# ==========================================
FROM --platform=linux/amd64 node:20-slim AS builder
WORKDIR /app

# Transfer dependency configurations
COPY package.json package-lock.json ./
RUN npm ci

# Copy entire Next.js architecture
COPY . .

# Standard Production Build Optimization Sequence
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Stage 2: Execute strictly via lightweight runner
FROM --platform=linux/amd64 node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Pull statically generated outputs mapping them back to Server
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Bound explicitly for Fargate Port mappings
CMD ["npm", "start"]
