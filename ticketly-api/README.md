# ticketly-api

API principal do [Ticketly](../README.md). É o único serviço com banco de dados e o "maestro" do fluxo de compra: recebe as reservas, conversa com o gateway de pagamento, publica os eventos e, no fim, envia o e-mail com a NF-e e o ingresso.

**Stack:** NestJS 12 (TypeScript, CommonJS), MikroORM 7, Postgres 17.

## Responsabilidades

- **Catálogo**: shows, setores (com preço) e assentos.
- **Reservas**: trava assentos no Redis por 10 minutos e cria o pedido `RESERVED`.
- **Checkout e pagamento**: cria a cobrança no `ticketly-pay` e recebe o webhook de aprovação/recusa.
- **Outbox**: grava os eventos junto com o pedido e publica no RabbitMQ (`order.paid`).
- **Fulfillment**: consome `invoice.generated` e `ticket.generated`; quando os dois chegam, baixa os PDFs do MinIO, envia o e-mail pro Mailpit e marca o pedido `COMPLETED`.
- **Admin**: login (JWT), cadastro de shows e acompanhamento dos pedidos.

## Módulos planejados

| Módulo | O que faz |
|---|---|
| `events` | Shows, setores e assentos |
| `reservations` | Lock de assentos e criação do pedido |
| `orders` | Consulta e ciclo de vida do pedido |
| `payments` | Integração com o gateway + webhook |
| `outbox` | Job que publica eventos pendentes |
| `fulfillment` | Consumers dos workers + envio do e-mail |
| `admin` | Login e rotas administrativas |

Padrão de cada módulo: `controller → service → repository`, DTOs validados com `class-validator`, erros com as exceções do Nest (`NotFoundException`, `ConflictException`...).

## Eventos

| Publica | Consome |
|---|---|
| `order.paid` | `invoice.generated`, `ticket.generated` |

Formato em [docs/eventos.md](../docs/eventos.md). Modelo do banco em [docs/arquitetura.md](../docs/arquitetura.md#modelo-de-dados-ticketly-api).

## Rodando

```bash
cp .env.example .env
docker network create ticketly-net   # só na primeira vez
docker compose -f compose.development.yaml up -d
```

- API: http://localhost:3000
- Postgres: `localhost:5433` (usuário, senha e banco no `.env`)

Criar as tabelas e o primeiro admin (com o Postgres de pé):

```bash
npm run migration:up
npm run db:seed   # admin@ticketly.dev / Admin@123 (muda com SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD)
```

- Swagger: http://localhost:3000/docs — faça login em `POST /admin/auth/login` e cole o `accessToken` em **Authorize**.

Sem Docker (precisa do Postgres rodando):

```bash
npm install
npm run start:dev
```

## Variáveis de ambiente

Veja o [.env.example](.env.example). As principais:

| Variável | Para quê |
|---|---|
| `POSTGRES_*` | Criação do banco no container |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexão da API com o banco (no Docker o compose troca para `postgres:5432`) |
| `API_PORT` | Porta exposta da API |
| `WEB_URL` | Origem do front liberada no CORS |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe com hot reload |
| `npm run build` | Compila pra `dist/` |
| `npm run lint` | Lint (oxlint) |
| `npm run format` | Formata com Prettier |
| `npm test` | Testes unitários (Jest) |
| `npm run migration:create` | Gera migration com a diferença entre as entidades e o banco (`src/database/migrations`) |
| `npm run migration:up` | Aplica as migrations pendentes |
| `npm run migration:down` | Desfaz a última migration |
| `npm run migration:list` | Lista as migrations aplicadas |
| `npm run db:seed` | Cria o primeiro admin (não duplica se já existir) |

## Dependências por fase

| Fase | Pacotes |
|---|---|
| Base (instalado) | `@nestjs/config`, `@nestjs/swagger`, `class-validator`, `class-transformer`, `@mikro-orm/*` |
| Reserva | `ioredis` |
| Filas | `@golevelup/nestjs-rabbitmq`, `@nestjs/schedule` |
| E-mail | `@aws-sdk/client-s3`, `nodemailer` |
| Admin | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt` |

> Consumers do RabbitMQ com MikroORM precisam de `@CreateRequestContext()` no método, senão as mensagens compartilham o mesmo `EntityManager`.
