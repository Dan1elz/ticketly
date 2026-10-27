# ============================
# Estágio de Build
# ============================
FROM node:24-alpine AS build
WORKDIR /app

# Cache layer: só reinstala dependências se o package.json/lock mudar
COPY package.json package-lock.json ./
# 'npm ci' é mais rápido e seguro para builds de CI/CD que 'npm install'
RUN npm ci

# Copiar o código e compilar TypeScript -> dist/
COPY . .
RUN npm run build

# Remove as devDependencies (typescript, jest, cli...) — não vão pra imagem final
RUN npm prune --omit=dev

# ============================
# Estágio de Runtime (Imagem final)
# ============================
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Copiar só o necessário pra rodar
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

# Não roda como root (a imagem do node já vem com o usuário 'node')
USER node

EXPOSE 3000

# GET /health responde 200 só se a API está no ar E alcança o banco (wget vem no alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/health || exit 1

# Aplica as migrations (e cria o primeiro admin, se não existir) antes de subir a API.
# O exec faz a API virar o processo principal e receber o sinal de parada do Docker
CMD ["sh", "-c", "node dist/database/migrate && exec node dist/main"]
