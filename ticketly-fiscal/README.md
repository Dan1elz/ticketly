# ticketly-fiscal

Worker do [Ticketly](../README.md) que gera a **NF-e (fake)** de cada pedido pago.

Não é uma API: não tem rotas HTTP nem banco de dados. Fica conectado ao RabbitMQ esperando mensagens, processa e publica o resultado.

**Stack:** Python 3.12, uv, aio-pika, reportlab, boto3, redis, pydantic.

## O que faz

1. Recebe `order.paid` na fila `fiscal.order-paid`.
2. Verifica no Redis se a mensagem já foi processada (`processed:{messageId}`). Se sim, ignora.
3. Gera o PDF da NF-e com os dados do cliente, itens e total que vieram na mensagem.
4. Salva o PDF no storage S3, bucket `ticketly-documents`, em `invoices/<orderId>.pdf`.
5. Publica `invoice.generated` com a chave do arquivo.
6. Marca a mensagem como processada e confirma (ack).

Se der erro temporário (storage fora, por exemplo), a mensagem vai pra fila de retry. Depois de várias tentativas, vai pra DLQ.

Formato das mensagens em [docs/eventos.md](../docs/eventos.md).

## Status

Esqueleto: o worker sobe, lê a configuração e espera o sinal de parada. O consumer entra quando o RabbitMQ estiver no `ticketly-infra` (hoje a infra só tem o storage).

## Rodando

Precisa do [`ticketly-infra`](../ticketly-infra) rodando (storage S3, RabbitMQ e Redis).

```bash
cp .env.example .env
docker network create ticketly-net   # só na primeira vez
docker compose -f compose.development.yaml up -d
```

Sem Docker (precisa do [uv](https://docs.astral.sh/uv/) instalado):

```bash
uv sync
uv run python -m app.main
```

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `SERVICE_NAME`, `LOG_LEVEL` | Identificação e nível de log |
| `RABBITMQ_URL` | Conexão com o RabbitMQ |
| `RABBITMQ_EXCHANGE` | Exchange de eventos (`ticketly.events`) |
| `RABBITMQ_QUEUE` | Fila deste worker (`fiscal.order-paid`) |
| `REDIS_URL` | Controle de mensagens já processadas |
| `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Storage S3 (`http://storage:9000`) e bucket onde o PDF é salvo (`ticketly-documents`) |

## Estrutura

```
app/
  main.py     ponto de entrada (loop do worker)
  config.py   leitura do .env com pydantic-settings
```
