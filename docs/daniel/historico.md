# Handoff — setores e assentos (ticketly-api)

Resumo da conversa de 2026-10-12 para continuar em outra sessão do Claude. O `CLAUDE.md` da raiz continua valendo: leia primeiro.

## Regras de trabalho com o Daniel (do CLAUDE.md, reforçando)

- Português, direto, sem textão. **Um conceito por vez**, com exemplo do próprio projeto; jargão só junto com a explicação.
- Na API Nest ele quer **aprender**: ele escreve os módulos, você explica e faz só o que ele pedir.
- Sem comentários "didáticos" no código (ver memória `no-teaching-comments-in-code`); a explicação vai no chat.
- Preferir responder a dúvida que ele trouxe, não despejar o plano inteiro.

## Estado do projeto (lido por inteiro nesta sessão)

| Parte | Estado real |
|---|---|
| ticketly-api | Pronta a parte de admin: auth JWT, admins, artistas (foto no storage), eventos com lineup, uploads. 2 migrations, seeders de admin/artistas/eventos. |
| ticketly-web | Portal admin completo (login, dashboard, CRUD de artistas e shows). Loja (`/`) ainda é tela "em desenvolvimento". |
| ticketly-infra | Só storage (Silo) + `init.sh`. RabbitMQ, Redis, Mailpit são `TODO`. |
| fiscal / voucher | Esqueletos (sobem e esperam SIGTERM), sem consumer. |
| ticketly-pay | Não existe. |
| docs | Decisões 1–8 de mensageria fechadas (`docs/decisoes.md`). |

Ainda **não existe** na API: `sectors`, `seats`, `orders`, `order_items`, `payments`, `documents`, `outbox`. O `mikro-orm.config.ts` registra só `Admin`, `Artist`, `Event`, `EventLineup`. Também não estão instalados `ioredis`, `@golevelup/nestjs-rabbitmq`, `@nestjs/schedule`, `nodemailer`.

### Pontos de atenção notados (nada grave)

1. `docs/arquitetura.md` (ER) ainda diz `image_url`; a coluna virou `image_key`.
2. A tabela do `README.md` raiz está desatualizada (api "Esqueleto + Docker", web "Rotas, auth admin...").
3. `GET /events` público devolve rascunhos (já em `docs/pendencias-api.md`).
4. Foto antiga do artista não é apagada na troca (já em `docs/pendencias-api.md`).
5. `AdminsService.create` usa `find` + `length`; `exists` do `BaseRepository` resolveria.
6. Volumes `ticketly_redis_data_dev` e `ticketly_rabbitmq_data_dev` já declarados no compose da infra, esperando os serviços.

## Onde estamos: setores e assentos

O Daniel disse que a etapa agora é o **backend de setores e assentos**, para "lapidar e entender melhor". Nada foi implementado ainda — só discutido.

### Padrões da API a seguir (observados no código)

- Módulo por domínio: controller → service → repository; erros com exceções do Nest em `*.exceptions.ts`.
- Entidades herdam `BaseEntity` (`id` uuid gerado no Node, `createdAt`, `updatedAt`); repositórios herdam `BaseRepository` (`findById`, `exists`, `paginate`, `add`, `remove`, `saveChanges`).
- DTOs com `createZodDto(schema)`; resposta com `@ZodResponse` (o schema de resposta é o mapper); `@ApiErrors(...)` para documentar erros.
- Toda rota exige JWT, exceto `@Public()`. Rotas de admin (criar/editar setor) ficam protegidas; leitura de setores/assentos pela loja vai precisar de `@Public()`.
- Entidades novas precisam entrar em `entities: [...]` no `mikro-orm.config.ts` e ter migration (`npm run migration:create`).
- Convenção de DER: dinheiro em centavos (`price_cents`), `order_items.seat_id` UNIQUE.

### Proposta 1 — módulo novo `sectors` (Sector + Seat juntos), não dentro de `events`

Status: **proposta, o Daniel não confirmou explicitamente**.

Motivos:

- O lineup mora em `events` porque o `PATCH /events` **substitui a lista inteira**. Com assentos isso não pode: `order_items.seat_id` vai apontar para o assento, então recriar em bloco quebra pedidos já vendidos. Setor/assento têm ciclo de vida próprio (criar, ajustar preço, nunca recriar em bloco).
- Volume: uma "Pista" pode ter milhares de assentos; não cabe na resposta de `GET /events`.
- O módulo de reserva vai consultar assentos sem saber de lineup.

Estrutura sugerida:

```
src/sectors/
  entities/sector.entity.ts
  entities/seat.entity.ts
  sectors.controller.ts   → /events/:eventId/sectors
  sectors.service.ts
  sectors.repository.ts
  seats.repository.ts
```

- `SectorsModule` importa `EventsModule` (para validar que o evento existe); `EventsModule` não conhece setores (dependência em uma direção).
- `Seat` não vira módulo próprio: nasce junto com o setor.
- Rotas aninhadas em `/events/:eventId/sectors`.

### Proposta 2 — campos extras

Status: **o Daniel perguntou "colocaria mais informações?"; a sugestão abaixo aguarda a resposta dele**.

Setor (além de `name`, `price_cents`, `event_id` do DER):

| Campo | Decisão sugerida |
|---|---|
| `description` (opcional) | adotar |
| `color` (hex, para o mapa/legenda do front) | adotar |
| `displayOrder` | adotar |
| `capacity` | **não guardar**; é `count(seats)`, devolver calculado na resposta |

Assento (além de `row`, `number`, `sector_id`):

| Campo | Decisão sugerida |
|---|---|
| `isAccessible` (PCD) | adotar |
| `isBlocked` (admin tira do ar: visão obstruída etc.) | adotar |
| `SOLD` / `RESERVED` | **não guardar**; vem de `order_items` + Redis (uma fonte da verdade só) |

Regra: o que o admin cadastra fica na entidade; o que acontece na venda é calculado a partir dos pedidos.

### Decisões em aberto (aguardam o Daniel)

1. **Como o admin informa os assentos de um setor?** Sugestão do Claude: informar "fileiras A até J, 20 lugares por fileira" e a API gera os 200 assentos (alternativa: lista um a um, mais flexível e mais trabalhosa no front). *Não respondida.*
2. **Pista (admissão geral)**:
   - Opção 1: só setor numerado; a pista também ganha assentos gerados (P1…P500). Não muda `order_items` nem o lock; `UNIQUE(seat_id)` já impede venda dupla. **Recomendada** (foco do projeto é o fluxo distribuído, não o catálogo).
   - Opção 2: setor com tipo `SEATED` / `GENERAL_ADMISSION`; pista só com capacidade e reserva por quantidade. Mais fiel ao mundo real, mas muda `order_items` e o lock no Redis. Pode ser evolução futura.
3. Confirmar o conjunto de campos da Proposta 2 ("seguir com a 1 e adotar description, color, displayOrder, isAccessible e isBlocked?" — pergunta final da sessão, sem resposta).

### Perguntas que provavelmente vêm depois (não discutidas)

- O que acontece com os assentos ao editar o setor (aumentar/diminuir fileiras) com assentos já vendidos?
- Apagar setor com assento vendido: recusar com 409 (como `ArtistInUseException`)?
- `PATCH` de preço de setor com pedidos já criados: `order_items.price_cents` guarda o preço da época, então não retroage.
- Seed de setores/assentos para os eventos do `EventSeeder`.
- Atualizar `docs/arquitetura.md` (DER) e `docs/pendencias-api.md` conforme implementar.

## Próximo passo sugerido

Pegar as respostas do Daniel às 3 decisões em aberto, uma por vez (começando pela forma de gerar os assentos), e só então desenhar `Sector`/`Seat`, DTOs e a migration — com ele escrevendo o módulo e o Claude explicando.
