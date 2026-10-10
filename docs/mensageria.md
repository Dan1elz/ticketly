# Mensageria — diagramas

Visão técnica do RabbitMQ e dos workers. O contrato das mensagens está em [eventos.md](eventos.md) e o porquê de cada escolha em [decisoes.md](decisoes.md).

## Topologia

Uma exchange `topic` e uma fila por consumidor. Cada fila recebe sua própria cópia da mensagem.

```mermaid
flowchart LR
    outbox["ticketly-api<br/>job da outbox"]
    ex{{"ticketly.events<br/>topic, durável"}}

    qf["fiscal.order-paid"]
    qv["voucher.order-paid"]
    qi["api.invoice-generated"]
    qt["api.ticket-generated"]

    fiscal(["ticketly-fiscal<br/>prefetch 1"])
    voucher(["ticketly-voucher<br/>prefetch 1"])
    api(["ticketly-api<br/>consumers, prefetch 10"])

    outbox -->|order.paid| ex
    ex -->|order.paid| qf --> fiscal
    ex -->|order.paid| qv --> voucher
    fiscal -->|invoice.generated| ex
    voucher -->|ticket.generated| ex
    ex -->|invoice.generated| qi --> api
    ex -->|ticket.generated| qt --> api
```

## Retry e DLQ de uma fila

Mesmo desenho para as 4 filas; abaixo, a do fiscal. Os nomes das filas auxiliares são abreviados: `retry.5s` = `fiscal.order-paid.retry.5s`, e assim por diante. Nenhuma fila de espera tem consumidor. `attempt` = header `retry-attempt`.

```mermaid
flowchart LR
    q["fiscal.order-paid"]
    w(["ticketly-fiscal"])

    ok["publica invoice.generated<br/>grava processed + ack"]
    r1["retry.5s<br/>TTL 5s"]
    r2["retry.30s<br/>TTL 30s"]
    r3["retry.2m<br/>TTL 2min"]
    dlq["dlq<br/>análise manual"]

    q --> w
    w -->|sucesso| ok
    w -->|"falha, attempt=0"| r1
    w -->|"falha, attempt=1"| r2
    w -->|"falha, attempt=2"| r3
    w -->|"falha, attempt=3<br/>ou definitiva"| dlq

    r1 -.->|"TTL expira, exchange padrão"| q
    r2 -.-> q
    r3 -.-> q
```

- Ao falhar, o worker publica a cópia no degrau com `retry-attempt` + 1 e depois dá ack na original.
- A volta (linha tracejada) vai direto para `fiscal.order-paid` pela exchange padrão, **não** pela `ticketly.events` — senão o voucher recebe de novo.
- Falha definitiva (payload inválido, CPF mágico `00000000000`) pula o retry e vai direto para a DLQ.

## Worker com falha temporária

O fiscal falha na 1ª tentativa (SEFAZ fake fora do ar), espera no degrau de 5s e conclui na 2ª.

```mermaid
sequenceDiagram
    participant Q as fiscal.order-paid
    participant F as ticketly-fiscal
    participant R as Redis
    participant S as SEFAZ fake
    participant ST as Storage (S3)
    participant RT as fiscal.order-paid.retry.5s
    participant EX as ticketly.events

    Q->>F: order.paid (sem retry-attempt)
    F->>R: GET processed:{messageId}
    R-->>F: não existe
    F->>S: autoriza NF-e
    S-->>F: erro temporário
    F->>RT: publica cópia (retry-attempt: 1)
    F->>Q: ack da original
    Note over RT: espera 5s (TTL)
    RT->>Q: devolve pela exchange padrão

    Q->>F: order.paid (retry-attempt: 1, mesmo messageId)
    F->>R: GET processed:{messageId}
    R-->>F: não existe
    F->>S: autoriza NF-e
    S-->>F: ok
    F->>F: gera PDF (número = hash do orderId)
    F->>ST: PUT invoices/{orderId}.pdf
    F->>EX: invoice.generated (espera confirmação)
    F->>R: SET processed:{messageId} EX 24h
    F->>Q: ack

    opt a mesma mensagem chega de novo (duplicata)
        Q->>F: order.paid (mesmo messageId)
        F->>R: GET processed:{messageId}
        R-->>F: existe
        F->>Q: ack sem processar
    end
```

- `S` é um módulo dentro do próprio fiscal (simula a SEFAZ), não um serviço separado.
- `processed` só é gravado **no fim**: se o worker cair antes, a mensagem volta e é refeita. Refazer é inofensivo porque a chave do arquivo e o número da NF-e dependem só do `orderId`.
