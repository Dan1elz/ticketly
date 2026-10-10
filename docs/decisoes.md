# Decisões — mensageria e workers

Registro curto do que foi decidido e por quê. Detalhes de filas e mensagens ficam em [eventos.md](eventos.md).

## 1. Retry por fila de espera

**Decisão:** quando o processamento falha por um motivo temporário, a mensagem vai para uma fila de espera (`<fila>.retry`). Ninguém consome essa fila. Cada mensagem tem um tempo de vida (TTL) e, quando ele acaba, o RabbitMQ devolve a mensagem para a fila original (dead-letter).

```
fiscal.order-paid ──(falha)──► fiscal.order-paid.retry
        ▲                              │
        └───────(TTL expira)───────────┘
```

**Por quê:**
- Quem espera é o RabbitMQ, não o worker. O worker fica livre para outras mensagens e, se reiniciar, não perde a espera.
- Devolver na hora (`nack` com requeue) vira um loop de falhas enquanto o serviço estiver fora.

**Detalhe importante:** a volta da `.retry` vai direto para a fila de origem pelo nome dela (exchange padrão), **não** pela `ticketly.events`. Se voltasse pela exchange, `order.paid` iria de novo para as duas filas, e o voucher reprocessaria só porque o fiscal falhou.

**Custo:** cada consumidor ganha filas extras (de espera e `.dlq`), e todas precisam ser criadas e configuradas. A fila de espera virou uma por degrau (decisão 2).

## 2. Backoff com uma fila de espera por degrau

**Decisão:** 3 tentativas com espera crescente — `5s → 30s → 2min → DLQ`. Uma fila de espera por degrau, cada uma com TTL fixo:

```
fiscal.order-paid.retry.5s
fiscal.order-paid.retry.30s
fiscal.order-paid.retry.2m
fiscal.order-paid.dlq
```

O worker escolhe o degrau conforme a tentativa e publica a mensagem nele. Os números são o ponto de partida; ajustar na prática.

**Por quê:**
- Espera fixa desiste cedo (storage leva ~2 min pra voltar) e devolve todas as mensagens juntas, batendo no serviço bem quando ele está voltando.
- TTL diferente por mensagem numa fila só não funciona: o RabbitMQ só expira a mensagem da frente da fila, e uma de 5s atrás de uma de 2min espera os 2min.
- Plugin de mensagem atrasada é mais uma peça pra instalar e esconde o mecanismo.
- Tempos curtos o bastante para ver o retry acontecendo no painel do RabbitMQ.

**Custo:** 5 filas por consumidor (20 no total), declaradas pelo código num loop. O RabbitMQ não escolhe o degrau sozinho: o worker precisa saber em que tentativa está (decisão 3).

## 3. Contagem de tentativas no header `retry-attempt`

**Decisão:** ao falhar, o worker lê o header `retry-attempt` (ausente = 0), soma 1 e publica a cópia no degrau correspondente com o novo valor; na 4ª falha, publica na `.dlq`. Depois confirma (ack) a original. O `messageId` não muda entre tentativas.

**Por quê:**
- A mensagem carrega o próprio histórico; o degrau não depende de nada externo.
- `x-death` conta por fila (teria que somar as entradas) e foi feito pro caminho automático de dead-letter, não pra republicação pelo worker.
- Contador no Redis põe o estado fora da mensagem, e o Redis pode ser justamente o que está fora do ar.
- Header, não envelope: o envelope é o fato e é igual pra todo consumidor; a tentativa é de cada consumidor. Sem prefixo `x-`, que é dos headers do próprio RabbitMQ.

**Custo:** se o worker cair entre publicar a cópia e dar ack na original, a mensagem existe duas vezes. Quem resolve é a idempotência (decisão 4).

## 4. Idempotência: marcar `processed` no fim + efeitos repetíveis

**Contexto:** o RabbitMQ garante entrega **pelo menos uma vez**, nunca exatamente uma. Duplicata vai acontecer (queda entre publicar e dar ack, outbox publicando 2x, réplica caindo no meio). A pergunta não é como evitar, e sim como fazer a duplicata não causar estrago.

**Decisão:** o worker checa `processed:{messageId}` no começo e só **grava no fim**, depois de publicar o resultado e antes do ack. A chave expira em **24h**. Sem trava de "processando".

**Por quê:**
- Marcar no começo perde trabalho em silêncio: se cair no meio, a mensagem volta, é ignorada e o pedido fica `PAID` pra sempre. Entre repetir e perder, repetir.
- Quem garante de verdade são os **efeitos repetíveis**, não o Redis: chave do arquivo fixa por pedido (`invoices/<orderId>.pdf`, sobrescrever dá no mesmo) e a API tolera o mesmo evento 2x (UQ `(order_id, type)` em `documents`). O Redis é só um atalho pra não refazer trabalho à toa.
- Trava com prazo (`SET NX EX`) dá falsa segurança: se o processamento demorar mais que o prazo, outra cópia entra igual.
- 24h: duplicatas chegam em minutos (o retry inteiro leva ~2,5 min); sem expiração o Redis guarda um id por mensagem pra sempre.

**Custo — furo que esta decisão revela:** "repetir é inofensivo" só vale se o worker gerar **exatamente o mesmo resultado** na segunda vez. O `invoice.generated` tem `invoiceNumber`, e o worker não tem banco. Se ele sortear ou incrementar um número a cada execução, uma duplicata gera **duas NF-e com números diferentes pro mesmo pedido**. O número da NF-e precisa ser **determinístico** (mesma entrada, mesmo número) — ver pendências.

## 5. Outbox: publisher confirms antes de marcar `published_at`

**Contexto:** a API grava o pedido `PAID` e a linha na tabela `outbox` na mesma transação; um job publica as linhas pendentes. Por padrão, publicar no RabbitMQ é "mandar e torcer": o cliente não sabe se o RabbitMQ guardou. Se a conexão cair nesse instante e o job marcar `published_at`, o evento se perde.

**Decisão:**
- Canal em modo **publisher confirms**: o RabbitMQ responde "guardei" e só então o job grava `published_at`.
- Mensagem **persistente** (`deliveryMode: 2`), exchange e filas **duráveis** — senão o "guardei" não sobrevive a um restart.
- Job a cada **2s**, até **50** linhas por rodada, mais antigas primeiro.

**Por quê:**
- O objetivo da outbox é não perder evento. Sem confirmação o furo continua, só muda de lugar.
- Confirmou mas a API caiu antes do `UPDATE`? Publica de novo na próxima rodada — duplicata, que a decisão 4 torna inofensiva.
- 2s de atraso é imperceptível pro cliente; a consulta (`WHERE published_at IS NULL`) é barata.

**Por que a outbox é tabela no Postgres, não Redis:** a garantia vem da mesma transação (`UPDATE orders` + `INSERT INTO outbox`: ou os dois, ou nenhum). Postgres e Redis são sistemas separados, sem transação em comum — gravar o pedido num e o evento no outro é **dual write**: se cair entre os dois, o pedido fica pago e o evento some. Regra: o que não pode se perder fica no Postgres; o Redis é atalho e trava temporária.

**Custo:**
- Mais um job sempre rodando na API (`@nestjs/schedule`).
- Com 2 réplicas da API, os dois jobs pegam as mesmas linhas (duplicata inofensiva, mas desperdício). Solução quando escalar: `FOR UPDATE SKIP LOCKED`.
- Conferir como o `@golevelup/nestjs-rabbitmq` expõe a confirmação na hora de implementar.

## 6. Prefetch: 1 nos workers, 10 na API

**Contexto:** sem limite, o RabbitMQ empurra todas as mensagens pro primeiro consumidor; com ack manual elas ficam presas na mão dele. Uma segunda réplica (`--scale fiscal=2`) fica parada, e se a primeira cair tudo volta de uma vez. Prefetch é o limite de mensagens sem ack que um consumidor pode segurar.

**Decisão:**
- `ticketly-fiscal` e `ticketly-voucher`: **prefetch 1**.
- Consumers da `ticketly-api`: **prefetch 10**.

**Por quê:**
- Gerar PDF é trabalho de CPU: em Python, várias ao mesmo tempo num processo só disputam o mesmo núcleo. Segurar 10 não acelera, só tira mensagem de outra réplica.
- Vazão nos workers vem de réplica (`--scale fiscal=3`), e com prefetch 1 o RabbitMQ distribui uma pra cada.
- Na API o trabalho é quase todo espera (banco, e-mail); o Node lida bem com várias ao mesmo tempo, e a junção atômica já foi pensada pra eventos chegando juntos.

**Custo:** com uma réplica, o worker gera um PDF por vez. Se virar gargalo, a resposta é mais réplica, não prefetch maior.

## 7. Falhas de propósito no fiscal

**Contexto:** retry, DLQ e idempotência são código que só roda quando algo dá errado. Se nada falhar, esse código nunca executa e o bug aparece só quando precisar dele.

**Decisão (só no `ticketly-fiscal`):**
- **Falha temporária** — `FAKE_FAILURE_RATE` (padrão `0.2` no development, `0` no staging) simula "SEFAZ fora do ar". Segue o retry normal.
- **Falha definitiva** — CPF mágico (`00000000000`) faz a SEFAZ fake rejeitar a nota. Vai direto pra DLQ.
- Tudo isolado no cliente SEFAZ fake do worker.

**Por quê:**
- Falha só aleatória quase nunca chega na DLQ (precisa falhar 4x seguidas: 0,2⁴ ≈ 0,16%). O CPF mágico dá um jeito controlado de ver a DLQ.
- SEFAZ (sistema da Receita estadual que autoriza a NF-e) cai de verdade — a falha é realista.
- O voucher não falha: dá pra conferir que o retry do fiscal **não** reentrega a mensagem pro voucher (decisão 1).
- Mesma ideia do `ticketly-pay`, que aprova ou recusa aleatoriamente.

**Custo:** no development, ~1 em 5 compras demora alguns segundos a mais. Proposital; `FAKE_FAILURE_RATE=0` desliga.

## 8. Número da NF-e calculado a partir do `orderId`

**Contexto:** pela decisão 4, reprocessar tem que gerar o mesmo número. O fiscal não tem banco.

**Decisão:** o fiscal calcula o número com um hash do `orderId`:

```python
int(hashlib.sha256(order_id.encode()).hexdigest(), 16) % 10**9
```

Mesmo `orderId` → sempre o mesmo número de 9 dígitos, em qualquer réplica e tentativa. O contrato não muda: `invoice.generated` devolve o número calculado.

**Por quê:**
- Determinístico sem estado: sem banco, sem Redis, sem depender da API.
- Não reserva nada, então emissão que falha (CPF mágico → DLQ) não queima número.
- Contador no Redis viola a regra da decisão 5 (Redis pode perder dados → numeração repete).
- Sequence no Postgres da API foi descartada: queima número antes de a NF-e existir e põe um dado fiscal na API só porque ela tem banco.

**Custo:**
- Número não sequencial (ex.: `482913077`). Aceitável numa NF-e fake.
- Colisão possível (≈ pedidos² ÷ 2 bilhões; ~0,05% com 1.000 pedidos) e inofensiva: `documents` e a chave no storage usam o `orderId`, não o número.
- Numeração realista (sequencial) exigiria o fiscal com banco próprio (*database per service*, cada serviço dono dos seus dados) — não a API numerar.
