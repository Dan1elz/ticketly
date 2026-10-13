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
  ticketly-infra     Storage S3 (Silo) — pronto; RabbitMQ, Redis, Mailpit — a fazer
  ticketly-fiscal    worker Python (uv, 3.12): gera PDF da NF-e fake — esqueleto criado
  ticketly-voucher   worker Python (uv, 3.12): gera ingresso + QR code — esqueleto criado
  ticketly-pay       gateway de pagamento fake (simula o Asaas) — a fazer
```

Padrão Docker de cada projeto: `Dockerfile` + `Dockerfile.Development` (se necessário), `compose.development.yaml` e `compose.staging.yaml` na pasta de cada um (cada projeto se auto-gerencia). Composes separados se enxergam por uma rede Docker externa `ticketly-net`.

Workers Python e o front (`ticketly-web`): "full IA" — pode escrever por ele, completo e caprichado (front sempre com componentes shadcn oficiais — nada de elemento nativo tipo `<datalist>`). No front, página/componente nunca chama service: Provider (estado + ações) → Context → hook `useX`, mesmo padrão do `aura-front`. O foco do projeto é backend: a API Nest ele quer aprender, então explique enquanto faz.

## Documentação

- `README.md` (raiz): visão geral, repositórios, como rodar, roadmap.
- `docs/arquitetura.md`: fluxo, decisões, DER.
- `ticketly-api/docs/arquitetura-api.md`: como o código da API é escrito (camadas, DTO como objeto de transição, entidade rica, ordem dos campos) e o que ainda foge do padrão. Mudou a convenção, atualiza lá.
- `ticketly-api/docs/correções.md`: correções decididas e ainda não aplicadas, com checklist. Aplicou, marca; entrou no código, apaga o item.
- `docs/pendencias-api.md`: o que o front já usa e a API ainda não implementou (upload de imagem no storage, `imageKey` em artistas...). Implementou, tira de lá.
- `docs/decisoes.md`: decisões de mensageria/workers (decisão + porquê + custo), fechadas uma a uma com o Daniel.
- `docs/mensageria.md`: diagramas Mermaid da topologia do RabbitMQ, retry/DLQ e fluxo do worker. Mudou decisão ou contrato, atualiza os diagramas.
- `docs/eventos.md`: **contrato das mensagens** (envelope, filas, payloads) — fonte da verdade; mudou evento, atualiza lá primeiro.
- `README.md` em cada repositório. Ao criar `ticketly-pay`, criar o README dele no mesmo padrão e atualizar a tabela da raiz. Ao adicionar serviço na infra (RabbitMQ, Redis, Mailpit), atualizar `ticketly-infra/README.md`.

## Fluxo

1. Cliente escolhe assento (setor `SEATED`) ou quantidade (pista, `GENERAL_ADMISSION`: API pega os primeiros livres) **sem login** → `POST /reservations` → trava no Redis (`SET NX EX`, porteiro) + `UPDATE seats SET status='RESERVED' WHERE id=? AND status='AVAILABLE'` (garantia; 0 linhas = 409) + pedido `RESERVED` com `reservation_code` aleatório (quem tem o código é o dono da reserva). Prazo `RESERVATION_HOLD_MINUTES` (10). Cliente pode desistir: `DELETE /reservations/:code` → pedido `CANCELLED`.
2. Checkout: nome, e-mail, CPF + reservation_code → API cria cobrança no gateway fake e estende `expires_at` pra `PAYMENT_HOLD_MINUTES` (30, Pix demora). Expiração: job olha `orders.expires_at` e devolve os assentos pra `AVAILABLE` (o TTL do Redis só limpa a trava).
3. Gateway fake chama webhook da API (aprovado/recusado, com delay aleatório) → pedido `PAID` + evento gravado na tabela `outbox` na mesma transação → job publica `order.paid` no RabbitMQ.
4. Exchange topic, **uma fila por worker** → fiscal e voucher processam em paralelo, sobem PDF no storage, publicam `invoice.generated` / `ticket.generated`.
5. API consome os dois, grava em `documents`, e quando os dois existem (UPDATE condicional atômico, pra não mandar 2x) envia e-mail com anexos pro Mailpit → `COMPLETED`.

Status do pedido: `RESERVED → PAID → COMPLETED`, desvios `EXPIRED`, `CANCELLED` (cliente desistiu) e `FAILED`.

## Setores e assentos (decidido com o Daniel em 2026-10-12; detalhes em `docs/arquitetura.md`)

- Setor tem `type` `SEATED` (grade de quadradinhos, gerada por blocos de fileiras/números) ou `GENERAL_ADMISSION` (pista: admin informa quantidade, admin vê contadores, loja escolhe quantidade). Pista também tem uma linha por ingresso em `seats`, sem `row` e sem `grid_*`.
- Status do assento **mora no assento**: `AVAILABLE`, `RESERVED`, `SOLD` (definitivo, sem reembolso), `BLOCKED` (temporário, com observação), `CANCELLED` (definitivo, "criado indevidamente", com observação, só a partir de `AVAILABLE`). Admin muda por ação com nome (`/block`, `/unblock`, `/cancel`), nunca `PATCH { status }`.
- **Assento nunca é excluído.** Setor só é excluído sem assento. Evento com setores não é excluído: é cancelado (`CANCELLED`), só sem assento `SOLD` nem `RESERVED`. Publicar exige pelo menos 1 assento `AVAILABLE`.
- `order_items` nunca é apagado (histórico); `price_cents` é o preço da hora da reserva.
- Palco é entidade do evento (`event_stages`); o lineup escolhe um palco. Assento não se liga a palco. Sem mapa geral do local.

## Decisões já tomadas

- Postgres **só da API**. Workers não têm banco nem acessam o da API — tudo que precisam vem na mensagem. Idempotência dos workers via Redis (`processed:{messageId}`).
- Mensagens com envelope JSON próprio (`messageId`, `type`, `version`, `correlationId`, `occurredAt`, `payload`). **Não** usar o transport RabbitMQ nativo do `@nestjs/microservices` (formato próprio, ruim de interoperar com Python) — usar `@golevelup/nestjs-rabbitmq`.
- Arquivos num storage S3, não em pasta compartilhada. **Produto: Silo** (`pgsty/silo` + `pgsty/mc`, fork comunitário do MinIO — o MinIO parou de publicar imagens em out/2025 e foi arquivado em abr/2026; `minio/minio` e `quay.io/minio/*` não baixam mais). Plano B: RustFS.
- **Storage nomeado pelo papel, não pelo produto**: serviço `storage` no compose, `S3_ENDPOINT_URL=http://storage:9000` em todos os serviços, comentários dizem "Storage (S3)". Só a infra cita o Silo. Exceção: no serviço `storage`, o container precisa receber `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` (nome que o Silo lê) — no `.env` da infra os nomes são `STORAGE_ROOT_*`.
- Buckets: `ticketly-public` (leitura pública só em `artists/`; lifecycle apaga `tmp/` após 1 dia) e `ticketly-documents` (privado, `invoices/` e `tickets/`, acesso por URL assinada). Criados pelo `storage-initial-setup` (`ticketly-infra/storage/init.sh`, idempotente). Banco guarda só a chave, nunca URL.
- Sem `container_name` nos composes (conflita com staging na mesma máquina e impede `--scale`).
- Retry com backoff + DLQ no RabbitMQ; ack manual.
- Dinheiro sempre em centavos (int).
- Portal admin fica **por último**: começar com seed/Swagger. Quando fizer: rota `/admin` no mesmo front + módulo admin na mesma API com JWT. A tela de pedidos (status de cada etapa) é a mais importante — serve de debug do fluxo distribuído.
- Não usar `@nestjs/observe` (SaaS pago). Observabilidade depois com OpenTelemetry + Jaeger local.
- **ORM: MikroORM** (v7, `@mikro-orm/postgresql` + `@mikro-orm/nestjs`). Escolhido pelo Unit of Work (`em.flush()` ≈ `SaveChanges()` do EF) e por ter model de verdade (classe com decorators). Consumers do RabbitMQ precisam de `@CreateRequestContext()`.
- **Auth da API: guard JWT global** (`APP_GUARD` no `AuthModule`): toda rota exige token, exceto as com `@Public()`. Rotas do cliente (catálogo, reserva, checkout, webhook do gateway) PRECISAM de `@Public()`. Sem passport: só `@nestjs/jwt` + guard próprio, que recarrega o admin do banco a cada requisição (desativado perde acesso na hora). Rotas: `POST /admin/auth/login`, `GET /admin/auth/me` (contrato já usado pelo front).
- Padrão Nest da API: módulo por domínio (controller → service → repository), erros com exceções do Nest (`NotFoundException`...) em vez de Result pattern/`@Res()`, validação com **nestjs-zod** (DTOs = `createZodDto(schema)`, `ZodValidationPipe` próprio em `common/zod` que mantém o erro no formato do Nest, `ZodSerializerInterceptor` + `@ZodResponse` no lugar de mappers — o schema de resposta é o mapper). `nestjs-zod` 5.5 não declara suporte ao Nest 12: instalado via `overrides` no package.json e testado (validação, serialização e Swagger ok). O Daniel escreve os módulos; eu explico e faço só o que ele pedir.
- Organização e nomes na API: prefixo `E` em enum (`EEventStatus`), `T` em type (`TLineupEntry`), `I` em interface (`IPaginated`); DTO não leva prefixo (o sufixo `Dto` já diz). Enums em `<modulo>/enums/<nome>.enum.ts`; tipos internos do módulo em `<modulo>/<modulo>.types.ts`. Arquivo de entidade tem só a classe. **O DTO é o objeto de transição em todas as camadas**: `create`/`update` da entidade recebem o `CreateXDto`/`UpdateXDto` direto, e o repository recebe o `ListXQueryDto`. Sem interface que reescreve o DTO com outras palavras e **sem `Pick`/`Omit`/`Partial`**, que confundem quem vem do C#. Interface só quando não há DTO equivalente. Ordem na entidade: campos simples, depois FK/condicionais, getters, métodos públicos, `static create` e `private` no fim. Regra de negócio fica na entidade (rica). Detalhes e pendências em `ticketly-api/docs/arquitetura-api.md`.

## DER (banco da API)

- `artists` (id, name, legal_name, genre, bio, image_key, social_links jsonb, is_active) — `image_key` é a chave no bucket `ticketly-public`
- `events` (id, name, venue, starts_at, status DRAFT/PUBLISHED/CANCELLED)
- `event_stages` (id **gerado pelo front**, event_id CASCADE, name, description?, display_order) — UQ(event_id, name) adiável (`DEFERRABLE INITIALLY DEFERRED`). `POST/PATCH /events` recebe `stages` (`id`, `name`, `description`, `displayOrder`); a lista substitui a atual e o `id` identifica o palco
- `event_lineup` (id **gerado pelo front**, event_id CASCADE, artist_id RESTRICT, stage_id RESTRICT, performance_type HEADLINER/SUPPORT/DJ, start_time, end_time, display_order, status CONFIRMED/CANCELLED) — UQ(event_id, artist_id) adiável. `POST/PATCH /events` recebe `lineup` com `id`, `artistId` e `stageId` (palco da lista `stages` do mesmo payload); artista novo é criado antes, por `POST /artists`; no PATCH a lista substitui o lineup inteiro e o `id` identifica o item
- `sectors` (id, event_id RESTRICT, name, type SEATED/GENERAL_ADMISSION, description?, price_cents ≥ 0, color #RRGGBB, display_order, max_per_order? > 0) — UQ(event_id, name)
- `seats` (id, sector_id RESTRICT, row? (null na pista), number > 0, grid_row?/grid_column? (só SEATED, os dois ou nenhum), is_accessible, status AVAILABLE/RESERVED/SOLD/BLOCKED/CANCELLED, status_note (obrigatório em BLOCKED/CANCELLED), status_changed_at, status_changed_by → admin_users) — índices únicos **parciais** escritos à mão na migration: `(sector_id, row, number) NULLS NOT DISTINCT WHERE status <> 'CANCELLED'` e `(sector_id, grid_row, grid_column) WHERE status <> 'CANCELLED'`
- `orders` (id, reservation_code UQ, status, customer_name, customer_email, customer_cpf, total_cents, expires_at, paid_at)
- `order_items` (id, order_id, seat_id RESTRICT **não único** — o assento aparece em vários pedidos ao longo do tempo; nunca apagado, price_cents)
- `payments` (id, order_id, gateway_charge_id UQ, status, amount_cents, created_at) — várias tentativas por pedido
- `documents` (id, order_id, type INVOICE/TICKET, storage_key, created_at) — UQ(order_id, type)
- `outbox` (id, event_type, payload jsonb, created_at, published_at)
- `admin_users` (login do portal admin)

## Dependências da API (instalar por fase)

- Base (instalada): `@nestjs/config`, `nestjs-zod` + `zod`, `@nestjs/swagger`, `@mikro-orm/{core,postgresql,nestjs,migrations,seeder}` + `@mikro-orm/cli` (dev).
- Reserva: `ioredis`. Filas: `@golevelup/nestjs-rabbitmq`, `@nestjs/schedule`. Storage (instalado): `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`. E-mail: `nodemailer`. Admin (instalado): `@nestjs/jwt`, `bcrypt` (sem passport).

## Em aberto

- Onde roda o staging (máquina local ou VPS).

## Ambiente

- WSL Ubuntu 20.04 (`~/Projetos/testes/ticketly`). O git padrão do 20.04 é antigo (2.25) — já quebrou o `npx shadcn init --template vite` (`git clone --sparse` falha). Atualizar via `ppa:git-core/ppa` se precisar.
- Não tem `uv` nem Python novo no host (só o 3.8 do sistema): comandos do uv rodam pela imagem oficial, ex. `docker run --rm -u $(id -u):$(id -g) -v $PWD:/work -w /work -e UV_CACHE_DIR=/tmp/uv-cache ghcr.io/astral-sh/uv:python3.12-bookworm-slim uv add <pacote>`.
- Composes de development usam todos `name: ticketly-development` (pra agrupar no Docker Desktop). Aviso de "orphan containers" é esperado — nunca usar `--remove-orphans`.
