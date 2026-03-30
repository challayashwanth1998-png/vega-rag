# ==========================================
# Next.js Frontend Dockerfile (AWS Fargate Ready)
# ==========================================
FROM node:20-alpine AS builder
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
RUN npm run build

# Stage 2: Execute strictly via lightweight runner
FROM node:20-alpine AS runner
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
