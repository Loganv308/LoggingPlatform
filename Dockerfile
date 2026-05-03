# ─── Stage 1: Build frontend ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ─── Stage 2: Build backend ────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# ─── Stage 3: Production image ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy built server
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/package*.json ./server/

# Install only production deps for server
WORKDIR /app/server
RUN npm install --omit=dev

# Copy built frontend into server's static folder
COPY --from=frontend-builder /app/client/dist /app/client/dist

WORKDIR /app

# Expose the app port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server/dist/index.js"]
