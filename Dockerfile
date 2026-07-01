# syntax=docker/dockerfile:1

# --- build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/build ./build

# O MCP fala via stdio: rode o container com `-i` (STDIN aberto).
# HOLDING_API_URL e HOLDING_API_KEY são passados em runtime (-e).
ENTRYPOINT ["node", "build/index.js"]
