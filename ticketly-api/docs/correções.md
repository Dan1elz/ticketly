# Correções

Lista do que foi decidido mudar e **ainda não foi feito**. Vem da conversa de alinhamento com o [arquitetura-api.md](arquitetura-api.md). Marque conforme aplicar e apague o item quando entrar no código.

## 1. Evento e filhos: o pai recebe só o DTO, o filho não recebe o pai

`Event.create` e `Event.update` recebem apenas o `CreateEventDto` / `UpdateEventDto`. Os filhos (`EventStage`, `EventLineup`) são criados pelo `Event` e **não recebem** o `event` nem as entidades `Artist` / `EventStage`: tudo vem por id, dentro do DTO.

O `event` no `create` do filho é redundante: ao entrar em `this.stages` / `this.lineup`, o MikroORM preenche a outra ponta da relação (`Collection.add` propaga `item[mappedBy] = owner` nas relações 1:N). É o *relationship fix-up* do EF.

- [x] `EventStage.create(event, data)` → `create(dto)`
- [x] `EventLineup.create(event, artist, stage, data)` → `create(dto)`
- [x] Remover `stage.event = event` e `lineup.event = event` de dentro dos `create`
- [x] Artista e palco do lineup entram como referência pelo id (`ref(Artist, dto.artistId)`, `ref(EventStage, dto.stageId)`), sem precisar do `EntityManager`

## 2. Lineup só recebe `artistId` (artista novo é criado antes)

**Regra:** a API de eventos não cria artista. Se o admin precisa cadastrar um artista novo durante o formulário do show, o front faz o `POST /artists` **na hora em que ele conclui o modal** e usa o `id` devolvido. É a única coisa criada antes do envio final.

### Por quê

- O DTO do lineup fica mais leve: some o `artist` aninhado e o refine "artistId ou artist".
- O service passa a ter um trecho só: buscar os artistas pelos ids e conferir. Artista inexistente devolve erro na hora.
- A conferência de imagem no storage sai do módulo de eventos: ela já roda no `POST /artists`.

### API

- [x] `lineupItemSchema`: remover `artist`, o refine de exclusividade e a dependência de `createArtistSchema`; `artistId` obrigatório
- [x] `EventsService.resolveLineup`: buscar por `artistId`, lançar `ArtistNotFoundException` se faltar algum, manter a regra do artista desativado (exceto quem já estava no lineup); remover `Artist.create` e `ensureImageExists`
- [x] `ArtistsService.ensureImageExists` pode virar `private`

### Front (`ticketly-web`)

- [x] `pages/Admin/Events/Form/index.tsx`: `saveNewArtist` chama o service de artistas, recebe o `id` e preenche `artistId` do item
- [x] `schemas/event.schema.ts`: remover `newArtist`; o refine "Escolha um artista" olha só `artistId`; a chave de repetição deixa de usar `new:${nome}`
- [x] `interfaces/event.interface.ts`: remover `artist?: IArtistPayload` do payload do lineup

### Consequências aceitas

- **Perde a atomicidade do artista**: antes, show + artista novo eram salvos juntos. Agora o artista já existe quando o show é salvo; se o `POST /events` falhar ou o admin desistir, o artista **fica cadastrado**. Aparece na lista e pode ser reaproveitado.
- **Artista criado e não usado** não tem limpeza automática.

## 3. O id é sempre a chave, e o front gera o id de palco e de lineup

**Regra:** toda referência e todo casamento entre objetos usa o `id`. Nome nunca identifica nada.

**Fluxo:** o formulário do show salva **tudo no final**, num único `POST`/`PATCH /events`, para não quebrar a imersão. O front gera um UUID (`crypto.randomUUID()`) para cada palco e cada item do lineup; o usuário não vê nem edita. Esse UUID é o próprio `id` da linha (chave primária, já `UNIQUE`): nenhuma coluna nova de "código".

### Contrato

| DTO | Campos |
|---|---|
| `EventStageRequestDto` | `id` (uuid), `name`, `description?`, `displayOrder` |
| `EventLineupRequestDto` | `id` (uuid), `artistId`, `stageId`, `performanceType`, `startTime`, `endTime`, `displayOrder`, `status` |
| `CreateEventDto` / `UpdateEventDto` | dados do evento + `stages: EventStageRequestDto[]` + `lineup: EventLineupRequestDto[]` |

Os dois DTOs de item são `Request` porque servem igual a create e update (o id existente atualiza, o novo cria). No update, `stages` e `lineup` são opcionais: ausente = não mexe; presente = a lista substitui a atual.

### Entidade `Event`

- [x] `create(dto)` e `update(dto)`: aplica `stages` primeiro e `lineup` depois, ambos casando por `id` (atualiza o que existe, cria o que é novo, remove o que sumiu)
- [x] `stageId` de cada item do lineup tem que estar entre os palcos do evento (a entidade valida, com os palcos que acabou de montar)
- [x] Sai o mapa `nome → palco` e o casamento do lineup por `artist.id`

### Escopo e segurança do id vindo do cliente

- [x] DTO valida `z.uuid()`
- [x] Casar o id **só contra os filhos deste evento**; id que já existe em outro evento é recusado (409), nunca sobrescreve
- [ ] Reenviar a mesma requisição não duplica: o id é o mesmo

### API

- [x] `EventStage` ganha `description` (opcional): entidade + migration + DTO + response
- [x] Remover o nome do palco do lineup: `stage` (nome) vira `stageId`; saem `lineupStagesMatch` por nome e `StageNotFoundException` baseada em nome
- [x] `ensureStagesMatchLineup` (palco que saiu da lista com artista ainda usando) passa a comparar por `stageId`; `StageInUseException` continua

### Front

- [x] Gerar o uuid ao adicionar palco e item do lineup
- [x] O select de palco do lineup lista os palcos que estão no formulário (ainda não salvos) e guarda o `stageId`
- [x] Payload: `stages[]` e `lineup[]` com `id`; o lineup manda `stageId`, não o nome

### A avaliar na implementação

- O `wrap(entity).assign(...)` do MikroORM já casa itens de coleção por chave primária (item com PK conhecida atualiza, novo cria, `collection.set` remove o que ficou de fora; `updateByPrimaryKey` é `true` por padrão). Pode servir para os palcos sem laço manual. Para o lineup os nomes do DTO (`artistId`, `stageId`) não batem com as propriedades da entidade (`artist`, `stage`), então ali o laço explícito é mais direto.
- A resposta do lineup precisa dos dados do artista (nome, foto). Se o `Event` só tem referência por id, o service deve devolver o evento com o lineup populado depois do `saveChanges`.

### Feito em 2026-10-12 (API)

Verificado com um banco descartável (migrations + seeders + script que roda create/update/regras e desfaz a transação). O front ainda **não** foi alterado: enquanto isso, criar e editar show pelo painel devolve 400.

Dois ajustes que apareceram na verificação:

- Os únicos `(event_id, name)` do palco e `(event_id, artist_id)` do lineup viraram `DEFERRABLE INITIALLY DEFERRED` (migration `20261012235500`). Sem isso, remover um artista e adicioná-lo de novo no mesmo envio (o front gera um id novo) fazia o `INSERT` rodar antes do `DELETE` e violava o único.
- `Event.setLineup` atribui o palco a partir de `this.stages` (buscado pelo `stageId`), em vez de uma referência solta, porque o palco pode ter sido criado no mesmo envio.

Migrations novas: `20261012235000` (coluna `description`) e `20261012235500` (únicos adiáveis). Aplicadas no banco de desenvolvimento junto com as 3 do colega, e o `db:seed` foi rodado (9 shows, 19 setores, 5.156 assentos).

### Feito em 2026-10-12 (front)

O formulário de show manda o contrato novo (`ticketly-web/src/schemas/event.schema.ts`):

- `newStage()` e `newLineupItem()` geram o uuid; ao editar, o `id` que veio da API é reaproveitado.
- Remover um palco que o lineup do formulário usa pede confirmação e deixa os itens sem palco (o select fica vazio e o schema pede para escolher outro).
- Artista novo: o modal faz o `POST /artists` ao concluir e preenche `artistId` com o `id` devolvido. O texto do modal avisa que o artista fica cadastrado mesmo que o show não seja salvo.
- Verificado contra a API de desenvolvimento com um script que passa pelos schemas e services do front (criar, editar reaproveitando ids, publicar sem assento, palco em uso, cancelar, excluir). O show de teste foi apagado.

### Feito em 2026-10-12 (`sectors`)

A mesma ideia aplicada ao módulo de setores e assentos: a regra de negócio saiu do service e foi para a entidade.

- [x] `Seat.block`, `unblock` e `cancel` validam a própria transição (`SeatNotAvailableException`, `SeatNotBlockedException`) e recebem o `SeatNoteDto`
- [x] `Seat.createBlock` e `Seat.createGeneralAdmission` validam o tipo do setor; a pista recebe o `CreateSeatQuantityDto` e o primeiro número (que vem do banco)
- [x] `Sector.create`/`update` e as ações do assento recusam evento cancelado (`Sector.ensureEventNotCancelled`)
- [x] `Sector.ensureRemovable()`: setor com assento não se exclui
- [x] `SectorRepository.existsByEvent` no lugar do `exists` solto no service
- [x] Interfaces `ISectorData`, `ISectorChanges`, `ISeatBlockData` removidas; sobram `ISeatData` (interna) e `ISeatCounts`

`Sector.create(event, dto)` continua recebendo o `event`: o setor nasce por rota própria, não por dentro do `Event`.

## 4. Alinhamento ao padrão (visão geral)

O restante do que foge do padrão (interfaces no lugar do DTO, ordem dos campos, regras no service, nomes de DTO) está em [arquitetura-api.md](arquitetura-api.md), seção "Onde o código ainda foge do padrão", e os pontos em aberto em "A decidir".
