# ticketly-api

API principal do Ticketly (NestJS + Postgres + MikroORM). Visão geral do projeto no [CLAUDE.md](../CLAUDE.md) da raiz.

## Rodando

```bash
cp .env.example .env
docker network create ticketly-net   # só na primeira vez
docker compose -f compose.development.yaml up -d
```

- API: http://localhost:3000
- Postgres: `localhost:5433` (usuário, senha e banco no `.env`)

Sem Docker (precisa do Postgres rodando):

```bash
npm install
npm run start:dev
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe com hot reload |
| `npm run build` | Compila pra `dist/` |
| `npm run lint` | Lint (oxlint) |
| `npm run format` | Formata com Prettier |
| `npm test` | Testes unitários (Jest) |
