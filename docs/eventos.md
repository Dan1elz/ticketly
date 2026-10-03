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

Cada fila tem duas filas auxiliares:

- `<fila>.retry` — espera alguns segundos e devolve a mensagem para a fila original (nova tentativa).
- `<fila>.dlq` — depois de N tentativas a mensagem vem parar aqui para análise manual.

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

Publicado pelo **ticketly-fiscal** depois de salvar o PDF da NF-e no MinIO.

```json
{
  "orderId": "uuid",
  "invoiceNumber": "000123",
  "bucket": "ticketly-documents",
  "storageKey": "invoices/<orderId>.pdf"
}
```

### `ticket.generated`

Publicado pelo **ticketly-voucher** depois de salvar o PDF do ingresso no MinIO.

```json
{
  "orderId": "uuid",
  "bucket": "ticketly-documents",
  "storageKey": "tickets/<orderId>.pdf"
}
```

## Regras para quem consome

1. **Ack manual**: só confirme a mensagem depois de terminar o trabalho.
2. **Idempotência**: antes de processar, verifique `processed:{messageId}` no Redis. Se já existe, só confirme e ignore.
3. **Falha temporária** (MinIO fora, timeout): mande para a fila de retry.
4. **Falha definitiva** (payload inválido): mande direto para a DLQ, não adianta tentar de novo.
5. **Valide o payload** (pydantic no Python, class-validator no Nest) antes de usar.
