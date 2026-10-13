# Setores, assentos e palcos — plano

Continuação do `historico.md`, já com as regras que o Daniel definiu em 2026-10-12:

- O admin cria setores e assentos editando o evento, num formulário em etapas, com um mapa visual parecido com o do ingresso.com.
- **Assento nunca é excluído.** No máximo é cancelado com uma observação (ex.: "criado indevidamente").
- Status do assento: livre, reservado, vendido, cancelado e outros que forem necessários.
- Só dá pra cancelar um assento **livre**.
- O cliente pode desistir depois de reservar.
- Só dá pra excluir um setor que não tem assento.
- O palco digitado à mão no lineup não faz sentido.

Itens marcados com ❓ dependem de resposta do Daniel (lista no fim).

## Decisões fechadas (rodada 1, ver `resumo-sessao-2026-10-12.md` seção 5)

- "Sessão" = setor.
- `SOLD` é definitivo (sem reembolso por enquanto).
- Setor tem `type`: `SEATED` | `GENERAL_ADMISSION`. Pista é o caso mais comum: tem uma linha por ingresso em `seats`, mas **sem fileira e sem grade** (`row` e `grid_*` opcionais); admin vê contadores, loja escolhe quantidade. Grade só em `SEATED`.
- Tempo da reserva por env: `RESERVATION_HOLD_MINUTES=10` e `PAYMENT_HOLD_MINUTES=30` (estende ao gerar a cobrança).
- Evento com setores não é excluído, é **cancelado** (`events.status` ganha `CANCELLED`), só sem assento `SOLD`.
- Setor exclusivo de palco: não agora.
- Cancelar evento exige **zero `SOLD` e zero `RESERVED`** (rodada 2).
- **Redis fica** como porteiro da reserva (rodada 2). O UPDATE condicional no Postgres continua como rede de segurança: a coluna `status` existe de qualquer jeito.
- **Sem mapa geral** do local (rodada 2): sem `events.map_image_key`, a loja lista os setores com cor e preço.
- **Publicar exige** pelo menos 1 assento `AVAILABLE` no evento; senão 409 (rodada 2).

---

## 1. Palco × assento: qual é a ligação?

No mundo real, **o assento não pertence ao palco**:

- **Show com um palco só** (teatro, arena): todos os setores olham pro mesmo palco. Ligar assento a palco não acrescenta nada.
- **Festival com vários palcos**: o ingresso dá acesso ao evento, não a um palco. A pista do Palco Mundo e a do Palco Sunset são da mesma área, e a pessoa anda entre elas.

O palco é **ponto de referência no mapa**: o front desenha "PALCO" no topo da grade e os assentos ficam de frente pra ele. Nenhuma coluna precisa ligar `seats` a palco.

Onde a ligação faz falta é no **lineup**: hoje `event_lineup.stage` é texto livre. Daria pra digitar "Palco Principal" num artista e "palco principal" no outro, e o sistema acharia que são dois palcos.

**Proposta:** o palco vira entidade do evento.

```
events ──< event_stages ──< event_lineup
```

- `event_stages` (id, event_id CASCADE, name, display_order) com UQ(event_id, name).
- `event_lineup.stage` (texto) vira `stage_id` (FK RESTRICT): não dá pra apagar um palco que tem artista.
- No front, o lineup ganha um **select** com os palcos cadastrados, em vez de campo de texto.
- Evento novo já nasce com um palco "Palco principal", então show simples nem precisa mexer.
- **Migration com dados:** a migration cria um palco pra cada valor diferente de `stage` que já existe e preenche o `stage_id`. Só depois apaga a coluna antiga.

❓ Existe algum caso em que um setor é exclusivo de um palco (ex.: área VIP só na frente do Palco Mundo)? Se existir, `sectors` ganha um `stage_id` opcional. Se não, fica como está.

---

## 2. Status do assento: muda a decisão anterior

O histórico dizia "status de venda **não** fica no assento, é calculado de `order_items` + Redis". Com as regras novas, isso deixa de funcionar:

1. **Histórico.** O DER atual diz "ao expirar a reserva, apagar os itens". Apagar é justamente perder histórico.
2. **`UNIQUE(seat_id)` em `order_items`.** Se os itens não forem mais apagados, um assento que teve uma reserva expirada nunca mais poderia ser vendido: o UNIQUE barraria o segundo pedido.
3. **Cancelado pelo admin.** Isso é estado do assento, não de pedido nenhum.

**Proposta: o status mora no assento**, e quem garante que não há venda dupla passa a ser um **UPDATE condicional**:

```sql
UPDATE seats SET status = 'RESERVED'
WHERE id = :seatId AND status = 'AVAILABLE';
```

O `WHERE status = 'AVAILABLE'` faz o trabalho. Se dois clientes tentam ao mesmo tempo, o Postgres executa um de cada vez. O primeiro muda a linha, e o segundo não encontra mais o assento `AVAILABLE`, então o UPDATE dele afeta **0 linhas** e a API responde 409 ("assento já reservado"). É a mesma técnica que o CLAUDE.md já prevê pro envio do e-mail ("UPDATE condicional atômico, pra não mandar 2x").

Consequências:

- `order_items` **nunca é apagado**: guarda o histórico de quem reservou ou comprou cada assento.
- `order_items.seat_id` **deixa de ser UNIQUE**. Um assento pode aparecer em vários pedidos ao longo do tempo (um expirou, outro comprou).
- ❓ O Redis deixa de ser a garantia, porque o Postgres garante. Ele pode continuar como **primeira barreira** (`SET NX EX`), barrando a corrida antes de chegar no banco, e o TTL de 10 min continua sendo o "relógio" da reserva. Só que um job ainda precisa devolver o assento pra `AVAILABLE` no Postgres quando a reserva expira.

### Status e transições

| Status | Significa | Quem muda |
|---|---|---|
| `AVAILABLE` | livre pra venda | — |
| `RESERVED` | cliente segurou, ainda não pagou | cliente (reserva) |
| `SOLD` | pago | webhook do gateway |
| `BLOCKED` | fora de venda **temporariamente** (produção, cortesia, visão obstruída), dá pra voltar | admin |
| `CANCELLED` | **fim de linha**, criado indevidamente; nunca volta | admin, com observação obrigatória |

```
              reserva                 pagamento aprovado
AVAILABLE ───────────────> RESERVED ──────────────────────> SOLD
    ^                          │
    └──────────────────────────┘
   desistiu / expirou / pagamento recusado

AVAILABLE <──── desbloquear / bloquear ────> BLOCKED

AVAILABLE ──── cancelar (com observação) ───> CANCELLED   (definitivo)
```

- Cancelar só sai de `AVAILABLE`, como você pediu. Um assento `BLOCKED` precisa ser desbloqueado antes de ser cancelado.
- ❓ Sai alguma coisa de `SOLD`? Reembolso, ou o cliente que pagou e desistiu, poderia devolver o assento pra `AVAILABLE`. Sem isso, `SOLD` é definitivo.

### O pedido também muda

Status do pedido hoje: `RESERVED → PAID → COMPLETED`, com desvios `EXPIRED` e `FAILED`. "O cliente desistiu" é diferente de "expirou", então entra **`CANCELLED`**, via `DELETE /reservations/:reservationCode`.

---

## 3. Entidades

### EventStage (novo)

```ts
@Entity({ tableName: 'event_stages' })
@Unique({ properties: ['event', 'name'] })
export class EventStage extends BaseEntity {
  @ManyToOne(() => Event, { deleteRule: 'cascade' })
  event: Rel<Event>;

  @Property({ type: 'string', length: 100 })
  name: string;

  @Property({ type: 'integer', default: 1 })
  displayOrder: Opt<number> = 1;
}
```

`EventLineup` troca `stage: string` por:

```ts
  @ManyToOne(() => EventStage, { deleteRule: 'restrict' })
  stage: Rel<EventStage>;
```

### Sector

```ts
export enum SectorType {
  SEATED = 'SEATED', // assento marcado: cliente escolhe no mapa
  GENERAL_ADMISSION = 'GENERAL_ADMISSION', // pista: cliente escolhe a quantidade
}

@Entity({ tableName: 'sectors', repository: () => SectorRepository })
@Unique({ properties: ['event', 'name'] })
@Check({ expression: 'price_cents >= 0' })
@Check({ expression: 'max_per_order is null or max_per_order > 0' })
export class Sector extends BaseEntity {
  [EntityRepositoryType]?: SectorRepository;

  @ManyToOne(() => Event, { deleteRule: 'restrict' })
  event: Rel<Event>;

  @Property({ type: 'string', length: 100 })
  name: string;

  @Enum({
    items: () => SectorType,
    nativeEnumName: 'sector_type',
    default: SectorType.SEATED,
  })
  type: Opt<SectorType> = SectorType.SEATED;

  @Property({ type: 'text', nullable: true })
  description: Opt<string> | null = null;

  @Property({ type: 'integer' })
  priceCents: number;

  // '#RRGGBB'
  @Property({ type: 'string', length: 7 })
  color: string;

  @Property({ type: 'integer', default: 1 })
  displayOrder: Opt<number> = 1;

  // null = sem limite por pedido
  @Property({ type: 'integer', nullable: true })
  maxPerOrder: Opt<number> | null = null;

  @OneToMany(() => Seat, (seat) => seat.sector)
  seats = new Collection<Seat>(this);
}
```

### Seat

```ts
export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED',
}

@Entity({ tableName: 'seats' })
@Check({ expression: 'number > 0' })
@Check({
  expression:
    '(grid_row is null and grid_column is null) or (grid_row > 0 and grid_column > 0)',
})
@Check({ expression: "status not in ('BLOCKED', 'CANCELLED') or status_note is not null" })
export class Seat extends BaseEntity {
  @ManyToOne(() => Sector, { deleteRule: 'restrict' })
  sector: Rel<Sector>;

  // null na pista: o ingresso sai só com o número ("Pista, 1234")
  @Property({ type: 'string', length: 10, nullable: true })
  row: Opt<string> | null = null;

  @Property({ type: 'integer' })
  number: number;

  // posição no mapa; só setor SEATED usa, pista fica null
  @Property({ type: 'integer', nullable: true })
  gridRow: Opt<number> | null = null;

  @Property({ type: 'integer', nullable: true })
  gridColumn: Opt<number> | null = null;

  @Property({ type: 'boolean', default: false })
  isAccessible: Opt<boolean> = false;

  @Enum({
    items: () => SeatStatus,
    nativeEnumName: 'seat_status',
    default: SeatStatus.AVAILABLE,
  })
  status: Opt<SeatStatus> = SeatStatus.AVAILABLE;

  @Property({ type: 'text', nullable: true })
  statusNote: Opt<string> | null = null;

  @Property({ type: 'datetime', nullable: true })
  statusChangedAt: Opt<Date> | null = null;

  @ManyToOne(() => Admin, { nullable: true, deleteRule: 'restrict' })
  statusChangedBy: Opt<Rel<Admin>> | null = null;
}
```

| Campo | Pra quê |
|---|---|
| `row`, `number` | o que vai **impresso no ingresso** ("Fileira C, 12"). Na pista `row` é null e o número é sequencial ("Pista, 1234") |
| `gridRow`, `gridColumn` | **opcionais**: onde o quadradinho aparece no mapa, só em setor `SEATED`. Separados de `row`/`number` por causa dos corredores (ver seção 5). O service exige preenchido quando o setor é `SEATED`; o CHECK só garante que vêm os dois juntos ou nenhum |
| `isAccessible` | PCD (ícone no mapa) |
| `status` | tabela da seção 2. Substitui o `isBlocked` do histórico, que agora é o status `BLOCKED` |
| `statusNote` | motivo do bloqueio ou cancelamento; o CHECK obriga a preencher nesses dois casos |
| `statusChangedAt` / `statusChangedBy` | quando e qual admin fez a última mudança manual. Reserva e venda ficam registradas em `order_items` |

### Regras de unicidade com cancelamento

O `UNIQUE(sector_id, row, number)` simples cria um problema: se o "C-12" foi criado errado e cancelado, o admin **não conseguiria criar o C-12 certo**, porque o cancelado continua ocupando o lugar.

A saída é um **índice único parcial**, que só vale pros assentos que não estão cancelados:

```sql
create unique index seats_sector_row_number_unique
  on seats (sector_id, row, number) nulls not distinct
  where status <> 'CANCELLED';

create unique index seats_sector_grid_unique
  on seats (sector_id, grid_row, grid_column) where status <> 'CANCELLED';
```

- `nulls not distinct` (Postgres 15+): por padrão o Postgres acha que dois `null` são **diferentes**, então na pista (`row` null) daria pra ter dois "número 5". Com essa opção, `null` conta como igual.
- O segundo índice impede dois assentos no mesmo quadradinho do mapa. Na pista `grid_*` é null e aí o índice não se aplica, que é o que queremos (sem `nulls not distinct` de propósito).

 O decorator `@Unique` do MikroORM não gera `WHERE`, então esses dois índices entram **escritos à mão na migration**.

### O que acontece ao apagar

```
events ──restrict──> sectors ──restrict──> seats <──restrict── order_items
```

- **Setor:** só sai se não tiver nenhum assento, nem cancelado. O service confere antes e devolve 409 (`SectorHasSeatsException`); o `restrict` é a última barreira, no banco.
- **Evento:** só é excluído se não tiver setores. Com setores, é **cancelado** (`status = CANCELLED`), e só se não houver assento `SOLD` nem `RESERVED`.
- **Assento:** nunca é apagado. O `restrict` garante isso no banco também.

---

## 4. Rotas da API

Mudar status por **ação com nome** (`/block`, `/cancel`) em vez de `PATCH { status }`. Assim cada ação valida a sua transição ("cancelar só se `AVAILABLE`") e ninguém consegue mandar `status: SOLD` na mão.

| Método e rota | O que faz |
|---|---|
| `GET/POST /events/:eventId/stages` | listar e criar palcos |
| `PATCH/DELETE /stages/:id` | editar palco; apagar só se nenhum artista usa (409) |
| `GET/POST /events/:eventId/sectors` | listar (com contagem por status) e criar setores |
| `PATCH /sectors/:id` | nome, preço, cor, ordem, limite |
| `DELETE /sectors/:id` | só sem assentos (409) |
| `GET /sectors/:id/seats` | assentos do setor pro mapa (admin) |
| `POST /sectors/:id/seats/generate` | gera assentos por blocos (seção 5) |
| `PATCH /seats/:id` | `isAccessible` |
| `POST /sectors/:id/seats/block` · `/unblock` · `/cancel` | recebem `{ seatIds: [...], note }` e agem em vários assentos de uma vez (no mapa o admin seleciona vários) |
| `GET /public/events/:id/seat-map` | `@Public()`, mapa da loja (sem `statusNote` nem admin) |

---

## 5. Mapa visual e geração de assentos

Só para setor **`SEATED`**. O mapa da loja é uma **grade**: cada assento ocupa um quadradinho em (`gridRow`, `gridColumn`). Corredor é coluna vazia.

```
                  P A L C O
   A  [01][02][03][04]    [05][06][07][08]
   B  [01][02][03][04]    [05][06][07][08]
   C  [01][02][03][04]    [05][06][07][08]
       ← bloco esquerdo →  ↑   ← bloco direito →
                        corredor (coluna 5 vazia)
```

O admin gera por **blocos**:

```json
{
  "blocks": [
    { "rows": "A-C", "numbers": "1-4", "startColumn": 1 },
    { "rows": "A-C", "numbers": "5-8", "startColumn": 6 }
  ]
}
```

- `gridRow` vem da posição da fileira (A=1, B=2…). A ordenação fica correta mesmo com "AA" depois de "Z", porque o mapa ordena por `gridRow`, não pelo texto.
- O primeiro bloco ocupa as colunas 1–4. O segundo começa na 6, então a coluna 5 fica vazia: é o corredor.
- Se algum assento do bloco bater num já existente (não cancelado), a geração inteira falha com 409 e nada é criado.
- Pra **adicionar** assentos depois, é só gerar outro bloco. Não existe "regerar".

**Pista (`GENERAL_ADMISSION`)**, o caso mais comum em show: sem mapa, sem grade.
- O admin informa só a **quantidade**: `{ "quantity": 5000 }` gera os números 1…5000, sem `row` e sem `grid_*`. Pra aumentar a carga depois: `{ "quantity": 1000 }` gera 5001…6000.
- No admin, a pista aparece como **contadores**, não quadradinhos: livres, reservados, vendidos, bloqueados, cancelados.
- Na loja o cliente escolhe a **quantidade** e a API pega os N primeiros `AVAILABLE`.
- Continua tendo uma linha por ingresso no banco: nunca apaga, tem status, tem histórico.

**Sem mapa geral do local** (decidido): a loja mostra a lista de setores (cor, nome, preço). Clicou num `SEATED`, abre a grade; num `GENERAL_ADMISSION`, escolhe a quantidade.

---

## 6. Formulário em etapas (front)

Por que cada etapa salva sozinha: o `PATCH /events` **substitui** o lineup inteiro. Com assentos isso é proibido, porque recriar quebraria pedidos. Então setores e assentos têm rotas próprias, e o evento **precisa existir** (ter `id`) antes da etapa 3.

| Etapa | Conteúdo | Salva em |
|---|---|---|
| 1. Dados | nome, local, data | `POST/PATCH /events` (nasce `DRAFT`) |
| 2. Palcos e lineup | lista de palcos + lineup com select de palco | `/events/:id/stages` + `PATCH /events` |
| 3. Setores | lista: nome, cor, preço, limite por pedido, contagem de assentos; criar, editar, excluir (só sem assento) | `/events/:id/sectors` |
| 4. Assentos | escolhe o setor → grade com legenda por status → "Gerar bloco"; seleciona assentos → bloquear, desbloquear, cancelar com observação, marcar PCD | `/sectors/:id/seats/...` |
| 5. Publicar | resumo + botão publicar | `PATCH /events` (`PUBLISHED`) |

Legenda do mapa (admin): livre, reservado, vendido, bloqueado, cancelado (riscado, com a observação no tooltip).

Regra pra publicar (decidido): o evento precisa ter pelo menos 1 assento `AVAILABLE`; senão 409.

---

## 7. Ainda em aberto

1. "Não sabemos se vamos manter o Postgres": esclarecer (ver resumo, rodada 2).

## Docs a atualizar quando fechar

- `docs/arquitetura.md`: DER (`event_stages`, `seats.status`, `order_items` sem UNIQUE e sem delete, pedido `CANCELLED`, `image_url` → `image_key`).
- `CLAUDE.md`: DER e a frase "garante que o lugar não é vendido 2x".
- `docs/eventos.md`, se o payload de `order.paid` levar fileira/número.
