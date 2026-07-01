# syntax=docker/dockerfile:1

# --- build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# --ignore-scripts: o `prepare` (npm run build) roda tsc, mas o src ainda não foi
# copiado aqui; buildamos explicitamente depois de copiar tsconfig+src.
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# --ignore-scripts: sem devDeps não há tsc; o build já veio pronto do builder.
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/build ./build

# Deploy padrão (Coolify): servidor MCP HTTP remoto, escuta em $PORT (default 3005).
# HOLDING_API_URL é passado em runtime (-e). A API key vem por request (Bearer/x-api-key).
ENV PORT=3005
EXPOSE 3005
CMD ["node", "build/http.js"]

# Modo stdio (local, Claude Code): sobrescreva o comando e rode com STDIN aberto:
#   docker run -i --rm -e HOLDING_API_URL=... -e HOLDING_API_KEY=hm_xxx \
#     holding-mcp node build/index.js
