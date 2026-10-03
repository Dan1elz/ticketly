# CLAUDE.md — Ticketly

Projeto de estudo do Daniel para aprender sistemas distribuídos: app de compra de ingressos para shows, com microserviços, filas no RabbitMQ e Redis. Leia tudo antes de mexer — as decisões abaixo já foram discutidas com ele.

## Como falar com o Daniel

- Sempre em português, direto, sem textão.
- Ele está aprendendo: explicar **um conceito por vez**, com exemplo do próprio projeto. Jargão (outbox, DLQ, idempotência...) só junto com a explicação do que significa — uma resposta cheia de termos soltos já virou "grego" pra ele.
- Ele prefere responder a dúvida que trouxe, não despejar o plano inteiro.

## Estrutura (monorepo, um `.git` na raiz)

```
ticketly/
  ticketly-api       NestJS (TypeScript, --strict, CommonJS) + Postgres — criado
  ticketly-web       React (Vite + shadcn) — criado
  ticketly-infra     RabbitMQ, Redis, MinIO, Mailpit — a fazer
  ticketly-fiscal    worker Python (uv, 3.12): gera PDF da NF-e fake — esqueleto criado
  ticketly-voucher   worker Python (uv, 3.12): gera ingresso + QR code — esqueleto criado
  ticketly-pay       gateway de pagamento fake (simula o Asaas) — a fazer
```

Padrão Docker de cada projeto: `Dockerfile` + `Dockerfile.Development` (se necessário), `compose.development.yaml` e `compose.staging.yaml` na pasta de cada um (cada projeto se auto-gerencia). Composes separados se enxergam por uma rede Docker externa `ticketly-net`.

Workers Python: o Daniel quer que sejam "full IA" — pode escrever por ele. A API Nest ele quer aprender, então explique enquanto faz.

## Documentação

- `README.md` (raiz): visão geral, repositórios, como rodar, roadmap.
- `docs/arquitetura.md`: fluxo, decisões, DER.
- `docs/eventos.md`: **contrato das mensagens** (envelope, filas, payloads) — fonte da verdade; mudou evento, atualiza lá primeiro.
- `README.md` em cada repositório. Ao criar `ticketly-infra`/`ticketly-pay`, criar o README deles no mesmo padrão e atualizar a tabela da raiz.

## Fluxo

1. Cliente escolhe assento **sem login** → `POST /reservations` → bloqueio no Redis por 10 min (`SET NX EX`) + pedido `RESERVED` com `reservation_code` aleatório (quem tem o código é o dono da reserva).
2. Checkout: nome, e-mail, CPF + reservation_code → API cria cobrança no gateway fake.
3. Gateway fake chama webhook da API (aprovado/recusado, com delay aleatório) → pedido `PAID` + evento gravado na tabela `outbox` na mesma transação → job publica `order.paid` no RabbitMQ.
4. Exchange topic, **uma fila por worker** → fiscal e voucher processam em paralelo, sobem PDF no MinIO, publicam `invoice.generated` / `ticket.generated`.
5. API consome os dois, grava em `documents`, e quando os dois existem (UPDATE condicional atômico, pra não mandar 2x) envia e-mail com anexos pro Mailpit → `COMPLETED`.

Status do pedido: `RESERVED → PAID → COMPLETED`, desvios `EXPIRED` e `FAILED`.

## Decisões já tomadas

- Postgres **só da API**. Workers não têm banco nem acessam o da API — tudo que precisam vem na mensagem. Idempotência dos workers via Redis (`processed:{messageId}`).
- Mensagens com envelope JSON próprio (`messageId`, `type`, `version`, `correlationId`, `occurredAt`, `payload`). **Não** usar o transport RabbitMQ nativo do `@nestjs/microservices` (formato próprio, ruim de interoperar com Python) — usar `@golevelup/nestjs-rabbitmq`.
- PDFs no MinIO (S3), não em pasta compartilhada.
- Retry com backoff + DLQ no RabbitMQ; ack manual.
- Dinheiro sempre em centavos (int).
- Portal admin fica **por último**: começar com seed/Swagger. Quando fizer: rota `/admin` no mesmo front + módulo admin na mesma API com JWT. A tela de pedidos (status de cada etapa) é a mais importante — serve de debug do fluxo distribuído.
- Não usar `@nestjs/observe` (SaaS pago). Observabilidade depois com OpenTelemetry + Jaeger local.
- **ORM: MikroORM** (v7, `@mikro-orm/postgresql` + `@mikro-orm/nestjs`). Escolhido pelo Unit of Work (`em.flush()` ≈ `SaveChanges()` do EF) e por ter model de verdade (classe com decorators). Consumers do RabbitMQ precisam de `@CreateRequestContext()`.
- **Auth da API: guard JWT global** (`APP_GUARD` no `AuthModule`): toda rota exige token, exceto as com `@Public()`. Rotas do cliente (catálogo, reserva, checkout, webhook do gateway) PRECISAM de `@Public()`. Sem passport: só `@nestjs/jwt` + guard próprio, que recarrega o admin do banco a cada requisição (desativado perde acesso na hora). Rotas: `POST /admin/auth/login`, `GET /admin/auth/me` (contrato já usado pelo front).
- Padrão Nest da API: módulo por domínio (controller → service → repository), erros com exceções do Nest (`NotFoundException`...) em vez de Result pattern/`@Res()`, validação com **nestjs-zod** (DTOs = `createZodDto(schema)`, `ZodValidationPipe` próprio em `common/zod` que mantém o erro no formato do Nest, `ZodSerializerInterceptor` + `@ZodResponse` no lugar de mappers — o schema de resposta é o mapper). `nestjs-zod` 5.5 não declara suporte ao Nest 12: instalado via `overrides` no package.json e testado (validação, serialização e Swagger ok). O Daniel escreve os módulos; eu explico e faço só o que ele pedir.

## DER (banco da API)

- `events` (id, name, venue, starts_at, status DRAFT/PUBLISHED)
- `sectors` (id, event_id, name, price_cents)
- `seats` (id, sector_id, row, number)
- `orders` (id, reservation_code UQ, status, customer_name, customer_email, customer_cpf, total_cents, expires_at, paid_at)
- `order_items` (id, order_id, seat_id **UNIQUE** — garante que o lugar não é vendido 2x; ao expirar a reserva, apagar os itens, price_cents)
- `payments` (id, order_id, gateway_charge_id UQ, status, amount_cents, created_at) — várias tentativas por pedido
- `documents` (id, order_id, type INVOICE/TICKET, storage_key, created_at) — UQ(order_id, type)
- `outbox` (id, event_type, payload jsonb, created_at, published_at)
- depois: `admin_users`

## Dependências da API (instalar por fase)

- Base (instalada): `@nestjs/config`, `nestjs-zod` + `zod`, `@nestjs/swagger`, `@mikro-orm/{core,postgresql,nestjs,migrations,seeder}` + `@mikro-orm/cli` (dev).
- Reserva: `ioredis`. Filas: `@golevelup/nestjs-rabbitmq`, `@nestjs/schedule`. E-mail: `@aws-sdk/client-s3`, `nodemailer`. Admin (instalado): `@nestjs/jwt`, `bcrypt` (sem passport).

## Em aberto

- Onde roda o staging (máquina local ou VPS).
- Se a NF-e fake deve falhar às vezes (pra exercitar retry).

## Ambiente

- WSL Ubuntu 20.04 (`~/Projetos/testes/ticketly`). O git padrão do 20.04 é antigo (2.25) — já quebrou o `npx shadcn init --template vite` (`git clone --sparse` falha). Atualizar via `ppa:git-core/ppa` se precisar.
- Não tem `uv` nem Python novo no host (só o 3.8 do sistema): comandos do uv rodam pela imagem oficial, ex. `docker run --rm -u $(id -u):$(id -g) -v $PWD:/work -w /work -e UV_CACHE_DIR=/tmp/uv-cache ghcr.io/astral-sh/uv:python3.12-bookworm-slim uv add <pacote>`.
- Composes de development usam todos `name: ticketly-development` (pra agrupar no Docker Desktop). Aviso de "orphan containers" é esperado — nunca usar `--remove-orphans`.
