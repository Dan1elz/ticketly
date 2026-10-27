# Ticketly

Plataforma de venda de ingressos para shows, construída como **projeto de estudo de sistemas distribuídos**: microserviços que conversam por filas (RabbitMQ), com Redis para lock e controle de etapas.

## Propósito

O objetivo não é o e-commerce em si — é aprender, na prática, os problemas que aparecem quando um processo é dividido entre vários serviços:

- **Concorrência**: duas pessoas tentando comprar o mesmo assento ao mesmo tempo.
- **Comunicação assíncrona**: serviços que não se chamam direto, só trocam mensagens.
- **Falhas parciais**: o pagamento passou, mas a NF-e falhou — e agora?
- **Mensagens duplicadas**: a mesma mensagem chegando duas vezes não pode gerar duas NF-e.
- **Junção de resultados**: o e-mail final só sai quando NF-e **e** ingresso estiverem prontos, que são gerados em paralelo.

## O que o sistema faz

1. O cliente escolhe um show e os assentos (ou a quantidade, na pista) — **sem precisar de login**.
2. Os assentos ficam reservados enquanto ele paga: 10 minutos pra preencher o checkout, estendidos pra 30 quando a cobrança Pix é gerada.
3. Um gateway de pagamento (fake) aprova ou recusa a cobrança.
4. Com o pagamento aprovado, dois serviços trabalham **em paralelo**: um gera a NF-e (fake) em PDF, outro gera o ingresso com QR code.
5. Quando os dois terminam, o cliente recebe um e-mail com os dois PDFs anexados.
6. Um portal administrativo permite cadastrar shows e acompanhar cada pedido etapa por etapa.

## Arquitetura

```mermaid
flowchart LR
    web[ticketly-web<br/>React] -->|HTTP| api[ticketly-api<br/>NestJS + Postgres]
    api -->|cria cobrança| pay[ticketly-pay<br/>gateway fake]
    pay -->|webhook| api
    api -->|order.paid| mq[(RabbitMQ)]
    mq --> fiscal[ticketly-fiscal<br/>Python]
    mq --> voucher[ticketly-voucher<br/>Python]
    fiscal -->|PDF| s3[(Storage S3<br/>Silo)]
    voucher -->|PDF| s3
    fiscal -->|invoice.generated| mq
    voucher -->|ticket.generated| mq
    mq --> api
    api -->|e-mail com anexos| mail[Mailpit]
    api <--> redis[(Redis)]
    fiscal <--> redis
    voucher <--> redis
```

Detalhes do fluxo, decisões e modelo do banco em [docs/arquitetura.md](docs/arquitetura.md). Formato das mensagens em [docs/eventos.md](docs/eventos.md).

## Repositórios

| Pasta | Papel | Stack | Status |
|---|---|---|---|
| [ticketly-api](ticketly-api) | API principal: catálogo, reservas, pedidos, pagamentos, envio do e-mail final | NestJS, MikroORM, Postgres | Esqueleto + Docker |
| [ticketly-web](ticketly-web) | Loja (cliente) e portal admin | React, Vite, TypeScript, shadcn/ui | Rotas, auth admin, base de serviços |
| [ticketly-fiscal](ticketly-fiscal) | Worker que gera o PDF da NF-e fake | Python 3.12, aio-pika, reportlab | Esqueleto + Docker |
| [ticketly-voucher](ticketly-voucher) | Worker que gera o ingresso em PDF com QR code | Python 3.12, aio-pika, reportlab, qrcode | Esqueleto + Docker |
| [ticketly-infra](ticketly-infra) | Storage S3 (Silo), RabbitMQ, Redis e Mailpit | Docker Compose | Storage pronto; RabbitMQ, Redis e Mailpit a fazer |
| `ticketly-pay` | Gateway de pagamento fake (simula o Asaas) | A definir | A fazer |

Cada repositório se gerencia sozinho: tem seu próprio `Dockerfile`, `Dockerfile.development`, `compose.development.yaml`, `compose.staging.yaml` e `.env.example`.

## Como rodar (desenvolvimento)

Todos os serviços se enxergam pela rede Docker `ticketly-net`. Os públicos (front, API, storage) também entram na `proxy-net`, a rede do [proxy de borda](#na-vm-proxy-de-borda). Crie as duas uma vez:

```bash
docker network create ticketly-net
docker network create proxy-net
```

Depois suba cada parte, **nessa ordem**, a partir da pasta de cada uma:

```bash
cp .env.example .env
docker compose -f compose.development.yaml up -d
```

1. `ticketly-infra` — Storage S3, RabbitMQ, Redis, Mailpit
2. `ticketly-api` — sobe junto o Postgres
3. `ticketly-fiscal` e `ticketly-voucher`
4. `ticketly-web`

| Serviço | Endereço |
|---|---|
| Front | http://localhost:5173 |
| API | http://localhost:3000 |
| Postgres | `localhost:5433` |
| Storage S3 (API) | http://localhost:9000 |
| Storage (painel web) | http://localhost:9001 |

As portas ficam só em `127.0.0.1`: abrem no seu PC e não são alcançáveis de fora.

### Na VM: proxy de borda

Na VM pessoal quem recebe o tráfego (80/443, HTTPS) é o projeto `~/projects/nginx`, e cada serviço público é achado pelo **alias** na `proxy-net`. Nenhum serviço do Ticketly publica porta para fora nem carrega certificado.

| Serviço | Endereço | Alias na `proxy-net` |
|---|---|---|
| Front | https://ticketly.zanni.tech | `ticketly-web-dev` (Vite, 5173) |
| API | https://ticketly-api.zanni.tech (Swagger em `/docs`) | `ticketly-api-dev` (3000) |
| Storage S3 | https://ticketly-s3.zanni.tech | `ticketly-s3-dev` (9000) |
| Postgres, painel do storage | só por túnel SSH (`ssh -L 5433:127.0.0.1:5433 pessoal`) | — |

Hoje só existe o ambiente de dev na VM; os aliases já têm o sufixo `-dev` para o staging poder usar o nome sem sufixo depois. Os `.env` da VM usam esses endereços `https` (`WEB_URL`, `S3_PUBLIC_URL`, `VITE_API_URL`, `ALLOWED_HOSTS`).

## Roadmap

1. **Infra** — `ticketly-infra` com Storage S3 (pronto), RabbitMQ, Redis e Mailpit.
2. **Catálogo** — entidades e seed de shows, palcos, setores e assentos (lugar marcado e pista).
3. **Reserva** — lock de assento no Redis + UPDATE condicional no Postgres + pedido `RESERVED`, desistência e expiração automática.
4. **Pagamento** — `ticketly-pay`, webhook, outbox publicando `order.paid`.
5. **Workers** — voucher primeiro (ponta a ponta), depois fiscal.
6. **Fulfillment** — junção dos dois resultados + e-mail com anexos.
7. **Resiliência** — retry, DLQ e idempotência testados de propósito (derrubar worker, duplicar webhook).
8. **Front** — loja com status do pedido em tempo real.
9. **Admin** — tela de pedidos (debug do fluxo) e CRUD de shows.
10. **Observabilidade** — correlationId nos logs, OpenTelemetry + Jaeger.
