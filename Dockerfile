# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package.json first for caching
COPY package*.json ./

# Install root deps (NestJS)
RUN npm install

# Copy backend and frontend sources
COPY . .

# Build frontend first
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Back to backend
WORKDIR /app

# Prisma generate
RUN npx prisma generate

# Build NestJS backend (now /public has frontend build)
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /app

# Copy built backend + frontend + node_modules from builder
COPY --from=builder /app .

# Install runtime deps only (optional)
RUN npm ci --omit=dev

# Add required tools
RUN apk add --no-cache curl postgresql-client

EXPOSE 3000

CMD ["./docker-start.sh"]