# Contratos de eventos (v1)

Todos os serviços trocam mensagens pelo RabbitMQ usando o mesmo formato. Este arquivo é a fonte da verdade: mudou um evento, muda aqui primeiro.

> Status: **proposta**. Os campos podem mudar enquanto os serviços ainda não estão implementados.

## Topologia

- **Exchange**: `ticketly.events` (tipo `topic`, durável)
- A **routing key** é o próprio `type` do evento (ex.: `order.paid`).
- Cada consumidor tem **sua própria fila**, assim cada um recebe uma cópia da mensagem.

| Fila | Escuta | Serviço |
|---|---|---|
| `fiscal.order-paid` | `order.paid` | ticketly-fiscal |
| `voucher.order-paid` | `order.paid` | ticketly-voucher |
| `api.invoice-generated` | `invoice.generated` | ticketly-api |
| `api.ticket-generated` | `ticket.generated` | ticketly-api |

Cada fila tem filas auxiliares (o porquê está em [decisoes.md](decisoes.md)):

- `<fila>.retry.5s`, `<fila>.retry.30s`, `<fila>.retry.2m` — filas de espera, sem consumidor. Cada uma tem TTL fixo e, quando ele expira, devolve a mensagem **direto para `<fila>`** pela exchange padrão (nunca pela `ticketly.events`, senão os outros consumidores recebem de novo).
- `<fila>.dlq` — depois da 3ª tentativa a mensagem vem parar aqui para análise manual.

### Header `retry-attempt`

Número da tentativa (ausente = 0). Fica no header AMQP, não no envelope: o envelope é o fato e é igual para todo consumidor; a tentativa é de cada consumidor. O `messageId` não muda entre tentativas.

| `retry-attempt` ao falhar | Vai para |
|---|---|
| 0 | `<fila>.retry.5s` (com `retry-attempt: 1`) |
| 1 | `<fila>.retry.30s` (com `retry-attempt: 2`) |
| 2 | `<fila>.retry.2m` (com `retry-attempt: 3`) |
| 3 | `<fila>.dlq` |

## Envelope

Toda mensagem tem este formato, independente do tipo:

```json
{
  "messageId": "6f1c2a9e-...",
  "type": "order.paid",
  "version": 1,
  "correlationId": "id-do-pedido",
  "occurredAt": "2026-10-02T21:30:00Z",
  "payload": {}
}
```

| Campo | Para que serve |
|---|---|
| `messageId` | Id único da mensagem. Usado para ignorar duplicadas. |
| `type` | Nome do evento (também é a routing key). |
| `version` | Versão do formato do `payload`. Muda se o payload mudar de forma incompatível. |
| `correlationId` | Id do pedido. Permite seguir um pedido pelos logs de todos os serviços. |
| `occurredAt` | Quando o fato aconteceu (UTC, ISO 8601). |
| `payload` | Os dados do evento. |

## Eventos

### `order.paid`

Publicado pela **ticketly-api** quando o pagamento é aprovado. Leva tudo que os workers precisam — eles não consultam o banco.

```json
{
  "orderId": "uuid",
  "customer": {
    "name": "Maria Silva",
    "email": "cliente@exemplo.com",
    "cpf": "12345678900"
  },
  "event": {
    "id": "uuid",
    "name": "Show X",
    "venue": "Allianz Parque",
    "startsAt": "2026-12-10T21:00:00-03:00"
  },
  "items": [
    {
      "seatId": "uuid",
      "sector": "Pista",
      "row": "A",
      "number": 12,
      "priceCents": 15000
    }
  ],
  "totalCents": 15000,
  "paidAt": "2026-10-02T21:30:00Z"
}
```

### `invoice.generated`

Publicado pelo **ticketly-fiscal** depois de salvar o PDF da NF-e no storage.

```json
{
  "orderId": "uuid",
  "invoiceNumber": "000123",
  "bucket": "ticketly-documents",
  "storageKey": "invoices/<orderId>.pdf"
}
```

### `ticket.generated`

Publicado pelo **ticketly-voucher** depois de salvar o PDF do ingresso no storage.

```json
{
  "orderId": "uuid",
  "bucket": "ticketly-documents",
  "storageKey": "tickets/<orderId>.pdf"
}
```

## Regras para quem publica

1. **Publisher confirms**: só considere publicado depois que o RabbitMQ confirmar. Na API, só então a outbox grava `published_at`.
2. **Mensagem persistente** (`deliveryMode: 2`).

## Regras para quem consome

1. **Ack manual**: só confirme a mensagem depois de terminar o trabalho.
2. **Idempotência**: antes de processar, verifique `processed:{messageId}` no Redis. Se já existe, só confirme e ignore. Grave a chave só **no fim** (depois de publicar o resultado, antes do ack), com expiração de 24h.
3. **Efeitos repetíveis**: processar a mesma mensagem 2x tem que dar o mesmo resultado (mesma chave de arquivo, mesmo número de NF-e). A checagem no Redis é só atalho; a garantia é esta.
4. **Falha temporária** (storage fora, timeout): publique a cópia no degrau de retry indicado pelo `retry-attempt` e confirme a original.
5. **Falha definitiva** (payload inválido): mande direto para a DLQ, não adianta tentar de novo.
6. **Prefetch**: 1 nos workers Python, 10 nos consumers da API.
7. **Valide o payload** (pydantic no Python, zod no Nest) antes de usar.
