# Esboço do banco — setores, assentos e palcos

Sempre atualizado com o plano de `setores-e-assentos.md`. Mostra só as tabelas ligadas a esse assunto.

Legenda nos comentários: **(novo)** = tabela ou coluna que ainda não existe · **(muda)** = já existe e vai mudar.

```mermaid
erDiagram
    events ||--o{ event_stages : "tem palcos"
    events ||--o{ event_lineup : "tem artistas"
    event_stages ||--o{ event_lineup : "artista toca em"
    artists ||--o{ event_lineup : "participa de"
    events ||--o{ sectors : "tem setores"
    sectors ||--o{ seats : "tem assentos"
    admins |o--o{ seats : "mudou status por último"
    orders ||--o{ order_items : "tem itens"
    seats ||--o{ order_items : "aparece em (histórico)"

    events {
        uuid id PK
        varchar name
        varchar venue
        timestamptz starts_at
        enum status "(muda) DRAFT | PUBLISHED | CANCELLED"
    }

    event_stages {
        uuid id PK "(novo)"
        uuid event_id FK "cascade"
        varchar name "UQ com event_id"
        int display_order
    }

    event_lineup {
        uuid id PK
        uuid event_id FK "cascade"
        uuid artist_id FK "restrict"
        uuid stage_id FK "(muda) era stage texto; restrict"
        enum performance_type "HEADLINER | SUPPORT | DJ"
        timestamptz start_time
        timestamptz end_time
        int display_order
        enum status "CONFIRMED | CANCELLED"
    }

    artists {
        uuid id PK
        varchar name
    }

    sectors {
        uuid id PK "(novo)"
        uuid event_id FK "restrict"
        varchar name "UQ com event_id"
        enum type "SEATED | GENERAL_ADMISSION"
        text description "opcional"
        int price_cents ">= 0"
        varchar color "#RRGGBB"
        int display_order
        int max_per_order "opcional; null = sem limite"
    }

    seats {
        uuid id PK "(novo)"
        uuid sector_id FK "restrict: assento nunca some"
        varchar row "opcional; null na pista"
        int number "impresso no ingresso"
        int grid_row "opcional; só SEATED"
        int grid_column "opcional; só SEATED"
        boolean is_accessible "PCD"
        enum status "AVAILABLE | RESERVED | SOLD | BLOCKED | CANCELLED"
        text status_note "obrigatório se BLOCKED/CANCELLED"
        timestamptz status_changed_at
        uuid status_changed_by FK "admin; opcional"
    }

    admins {
        uuid id PK
        varchar name
    }

    orders {
        uuid id PK "(novo)"
        varchar reservation_code UK
        enum status "RESERVED | PAID | COMPLETED | EXPIRED | FAILED | CANCELLED"
        int total_cents
        timestamptz expires_at
    }

    order_items {
        uuid id PK "(novo)"
        uuid order_id FK
        uuid seat_id FK "(muda) NÃO é mais UNIQUE; restrict"
        int price_cents "preço da hora da compra"
    }
```

## Regras que o diagrama não mostra

- **Índices únicos parciais em `seats`** (só valem pra assento não cancelado):
  - `(sector_id, row, number) NULLS NOT DISTINCT WHERE status <> 'CANCELLED'`: não existem dois "C-12" ativos no setor, nem dois "Pista 5" (o `NULLS NOT DISTINCT` faz `row` null contar como igual).
  - `(sector_id, grid_row, grid_column) WHERE status <> 'CANCELLED'`: não existem dois assentos no mesmo quadradinho do mapa (pista, com grid null, fica de fora).
- **Reserva sem venda dupla:** `UPDATE seats SET status = 'RESERVED' WHERE id = ? AND status = 'AVAILABLE'`. Se afetar 0 linhas, alguém pegou antes → 409.
- **Nada de `order_items` é apagado:** quando a reserva expira, o pedido vira `EXPIRED` e o assento volta pra `AVAILABLE`, mas o item fica como histórico.
- `orders` e `order_items` aparecem resumidos aqui; o resto das colunas está no `docs/arquitetura.md`.
