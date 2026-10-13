# ticketly-api

API principal do [Ticketly](../README.md). É o único serviço com banco de dados e o "maestro" do fluxo de compra: recebe as reservas, conversa com o gateway de pagamento, publica os eventos e, no fim, envia o e-mail com a NF-e e o ingresso.

**Stack:** NestJS 12 (TypeScript, CommonJS), MikroORM 7, Postgres 17.

## Responsabilidades

- **Catálogo**: shows, palcos, setores (com preço; lugar marcado ou pista) e assentos (nunca excluídos, só cancelados).
- **Reservas**: trava assentos no Redis (porteiro) e no Postgres (UPDATE condicional), cria o pedido `RESERVED` e devolve os assentos quando expira ou o cliente desiste.
- **Checkout e pagamento**: cria a cobrança no `ticketly-pay` e recebe o webhook de aprovação/recusa.
- **Outbox**: grava os eventos junto com o pedido e publica no RabbitMQ (`order.paid`).
- **Fulfillment**: consome `invoice.generated` e `ticket.generated`; quando os dois chegam, baixa os PDFs do storage S3, envia o e-mail pro Mailpit e marca o pedido `COMPLETED`.
- **Admin**: login (JWT), cadastro de shows e acompanhamento dos pedidos.
- **Arquivos**: upload das fotos dos artistas pro storage S3 (`ticketly-public`) e URLs assinadas pra baixar NF-e/ingresso (`ticketly-documents`). O upload das fotos está pronto; o que falta está em [docs/pendencias-api.md](../docs/pendencias-api.md).

## Módulos

| Módulo | O que faz | Situação |
|---|---|---|
| `auth` | Login do admin (JWT) e guard global: toda rota exige token, menos as `@Public()` | pronto |
| `admins` | Cadastro dos usuários do portal admin | pronto |
| `artists` | Artistas (foto no storage S3) | pronto |
| `uploads` / `storage` | Upload de imagem e acesso ao storage S3 | pronto |
| `events` | Shows, palcos e lineup | pronto |
| `sectors` | Setores e assentos (geração por bloco ou quantidade, bloqueio, cancelamento) | pronto |
| `reservations` | Lock de assentos e criação do pedido | a fazer |
| `orders` | Consulta e ciclo de vida do pedido | a fazer |
| `payments` | Integração com o gateway + webhook | a fazer |
| `outbox` | Job que publica eventos pendentes | a fazer |
| `fulfillment` | Consumers dos workers + envio do e-mail | a fazer |

Padrão de cada módulo: `controller → service → repository`, DTOs validados com `nestjs-zod` (o schema de resposta com `@ZodResponse` faz o papel do mapper), erros com as exceções do Nest (`NotFoundException`, `ConflictException`...).

Rotas `GET` do catálogo (`/events`, `/events/:id/sectors`, `/sectors/:id`) são públicas: sem token (loja) só mostram shows `PUBLISHED`; com o token do admin mostram tudo.

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
npm run db:seed   # admin@ticketly.dev / Admin@123 (muda com SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD) + 15 artistas e 8 shows de exemplo, com setores e assentos
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
| `npm run db:seed` | Cria o primeiro admin, os artistas, os shows de exemplo e os setores deles (não duplica se já existirem) |
| `npm run db:seed:artists` | Só os artistas de exemplo: baixa as fotos e sobe no storage (precisa da infra rodando) |
| `npm run db:seed:events` | Shows de exemplo com lineup (roda o de artistas antes, se faltar algum) |
| `npm run db:seed:sectors` | Setores e assentos dos shows de exemplo (roda o de shows antes; só mexe em show sem setor) |

## Dependências por fase

| Fase | Pacotes |
|---|---|
| Base (instalado) | `@nestjs/config`, `@nestjs/swagger`, `nestjs-zod` + `zod`, `@mikro-orm/*` |
| Storage (instalado) | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |
| Admin (instalado) | `@nestjs/jwt`, `bcrypt` (sem passport: guard próprio) |
| Reserva | `ioredis` |
| Filas | `@golevelup/nestjs-rabbitmq`, `@nestjs/schedule` |
| E-mail | `nodemailer` |

> Consumers do RabbitMQ com MikroORM precisam de `@CreateRequestContext()` no método, senão as mensagens compartilham o mesmo `EntityManager`.
