# ============================================================
# Finsight Backend — Production Dockerfile
# Node 22 (Debian Bookworm slim) agar cocok dengan
# binaryTargets = ["debian-openssl-3.0.x"] di schema.prisma
# ============================================================

# ── Stage 1: Install deps & generate Prisma client ──────────
FROM node:22-slim AS builder

WORKDIR /app

# Install openssl (dibutuhkan prisma generate)
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/


# ── Stage 2: Production image ────────────────────────────────
FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src          ./src
COPY --from=builder /app/prisma       ./prisma
COPY package*.json ./
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
