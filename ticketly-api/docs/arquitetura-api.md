# Arquitetura da API (ticketly-api)

Como o código da API é organizado: camadas, o que cada uma faz e as regras de escrita. Complementa [arquitetura.md](../../docs/arquitetura.md), que trata do sistema (fluxo, filas, DER).

**Módulo de referência: `src/artists`.** Na dúvida, o código novo copia a forma dele.

> Regras definidas pelo Daniel em 2026-10-12. Os pontos marcados como "a decidir" ainda não foram fechados.

## Camadas

```
Controller ──► Service ──► Repository ──► Banco
     │            │             │
     └────────────┴─────────────┴──► Entity (regra de negócio)

     O mesmo DTO atravessa todas as camadas
```

| Camada | Responsabilidade | Não faz |
|---|---|---|
| **Controller** | Rota, validação de entrada (pipe), documentação Swagger, devolve a entidade | Regra de negócio, `if` de domínio |
| **Service** | Orquestra: busca, chama a entidade, salva, fala com outros módulos e serviços externos (storage, Redis) | Regra que cabe dentro da entidade |
| **Repository** | Consultas ao banco (`find`, filtros, paginação, populate) | Regra de negócio |
| **Entity** | Estado + regra de negócio: criar, atualizar, transições, invariantes | Falar com banco ou serviço externo |
| **DTO** | Objeto de transição dos dados entre todas as camadas | — |

## Regras

### 1. O DTO é o objeto de transição em todas as camadas

O que chega no controller como DTO segue o mesmo objeto para o service, o repository e a entidade. Não se criam `interface`, `type`, `Partial`, `Pick` ou `Omit` só para "traduzir" o DTO entre camadas.

```ts
// controller
create(@Body() dto: CreateArtistDto) { return this.artistsService.create(dto) }
// service
const artist = Artist.create(dto)
// entity
static create(data: CreateArtistDto): Artist
```

### 2. Entidade rica

A regra de negócio fica centralizada na entidade. O service decide **quando** chamar; a entidade decide **se pode** e **como muda**.

- `static create(dto)` monta a entidade.
- `update(dto)` aplica só o que veio (`!== undefined`).
- Ações de domínio com nome (`block`, `cancel`...) validam a própria transição.

### 3. Ordem dentro da entidade

1. `[EntityRepositoryType]`
2. Campos simples (`@Property`, `@Enum`)
3. Campos de relação e condicionais (`@ManyToOne`, `@OneToMany`, nullable de relação)
4. Getters
5. Métodos públicos (`update`, ações de domínio)
6. `static create`
7. Métodos `private` **sempre no final**

### 4. DTOs

| Tipo | Nome | Arquivo |
|---|---|---|
| Entrada única | `<Ação><Recurso>RequestDto` | `<acao>-<recurso>-request.dto.ts` |
| Mais de uma entrada no recurso | `CreateXDto`, `UpdateXDto` | `create-x.dto.ts`, `update-x.dto.ts` |
| Saída | `XResponseDto` | `x-response.dto.ts` |
| Listagem paginada (saída) | `XListResponseDto` | `x-list-response.dto.ts` |
| Filtros de listagem | `ListXQueryDto` | `list-x-query.dto.ts` |

Todo DTO é `createZodDto(schema)`; o schema de resposta é o mapper (`@ZodResponse`).

### 5. Repository

- Estende `BaseRepository<T>` (`findById`, `exists`, `paginate`, `add`, `remove`, `saveChanges`).
- Consulta com nome de domínio mora aqui (`search`, `findByEvent`...), não no service.
- Filtros de listagem chegam como o próprio `ListXQueryDto`.

### 6. Service

- Ordem: construtor → métodos públicos (`create`, `findAll`, `findOne`, `update`, `remove`...) → métodos `private` no final.
- Erros de domínio com exceções do Nest, declaradas em `<modulo>.exceptions.ts`.
- Um módulo fala com outro pelo **service** dele, não pelo repository.

### 7. Controller

- Uma ordem fixa de decorators por rota: verbo → `@ZodResponse` → `@ApiErrors` → `@Public` (quando for o caso).
- Sem lógica: recebe, delega ao service, devolve.

## Referência: `artists`

```ts
@Entity({ tableName: 'artists', repository: () => ArtistRepository })
export class Artist extends BaseEntity {
  [EntityRepositoryType]?: ArtistRepository;

  @Property({ type: 'string', length: 120 }) name: string;
  @Property({ type: 'string', length: 120 }) legalName: string;
  // ...campos simples

  update(data: UpdateArtistDto) {
    if (data.name !== undefined) this.name = data.name;
    // ...
  }

  static create(data: CreateArtistDto): Artist { /* ... */ }
}
```

```
src/artists/
  entities/artist.entity.ts
  dto/create-artist.dto.ts  update-artist.dto.ts  artist-response.dto.ts
      artist-list-response.dto.ts  list-artists-query.dto.ts
  artists.controller.ts  artists.service.ts  artists.repository.ts
  artists.exceptions.ts  artists.module.ts
```

## Onde o código ainda foge do padrão

Levantamento de 2026-10-12, atualizado depois do alinhamento de `events`, `sectors` e dos repositories. Vira checklist: marque conforme alinhar.

### Já alinhado

- [x] Entidades recebem o DTO direto: `Event`, `EventStage`, `EventLineup`, `Sector`, `Seat` (saíram `events.types.ts` e as interfaces `ISector*`/`ISeatBlockData`)
- [x] Repositories recebem o `ListXQueryDto` (saíram os `ISearch*Params`)
- [x] FK depois dos campos simples e `private` no fim: `Event`, `EventStage`, `EventLineup`, `Sector`, `Seat`
- [x] Itens aninhados de evento são classes DTO (`EventStageRequestDto`, `EventLineupRequestDto`)
- [x] Regra de negócio de `sectors` na entidade: transições do assento (`block`, `unblock`, `cancel`), tipo do setor ao gerar assentos, evento cancelado e "setor com assento não se exclui" (`Sector.ensureRemovable`, `Sector.ensureEventNotCancelled`)

### Entidades

- [ ] `Event.cancel` e a checagem de evento cancelado ainda ficam em `EventsService` (a contagem de assentos vendidos/reservados vem do banco)
- [ ] `ISeatData` (interno, criação de cada assento) continua como interface: não há DTO equivalente

### Repositories e services

- [ ] `EventRepository.search` refaz a paginação na mão porque `BaseRepository.paginate` não aceita `populate`
- [ ] Consulta solta no service: `ArtistsService.findByIds` (`find({ id: { $in } })`), `AdminsService.create` (`find({ email })`), `AuthService.login` (`findOne({ email })`)
- [ ] `SectorsService` injeta `EventRepository` e `SeatRepository` direto, enquanto `EventsService` usa `ArtistsService`. A causa é a dependência circular `events` ↔ `sectors`
- [ ] Tratamento de erro do banco inconsistente: `AdminsService`, `SectorsService` e `EventsService` têm um `saveChanges` privado que converte a violação de unicidade; `ArtistsService.remove` faz o `try/catch` inline

### Controllers e DTOs

- [ ] Ordem de decorators: `artists` põe `@ApiErrors` antes de `@Public`; `events` põe `@Public` antes de `@ApiErrors`
- [ ] `EventsController` e `SectorsController` decidem no controller entre "admin" e "loja" (`admin ? findOne : findPublished`)
- [ ] `SectorsController` e `SeatsController` usam `@Controller()` sem prefixo, com a rota inteira em cada método
- [ ] Nomes fora da tabela da regra 4: `LoginDto`, `SeatNoteDto`, `CreateSeatBlockDto`, `CreateSeatQuantityDto`
- [ ] `UpdateArtistDto` usa `omit().partial().extend()` do Zod; `UpdateSectorDto` lista cada campo com `.optional()`
- [ ] Campo calculado da resposta por dois caminhos: `Artist.imageUrl` (subscriber) e `Sector.seatCounts` (service chama `loadSeatCounts`)

## A decidir

1. **Entidade lança exceção de domínio?** *Adotado em `Event`* (`StageNotFoundException`, `StageInUseException`); *e nas transições do assento e do setor (`sectors`)*. A transição inválida (`block` num assento vendido) é regra da entidade. Lançar a exceção dela mesma deixa a regra num lugar só; o custo é a entidade importar uma exceção do Nest.
2. **Relações já resolvidas junto do DTO.** *Resolvido em `events`: tudo por id no DTO, e a entidade usa `rel(Artist, id)`.* O lineup precisa do `Artist` e do `EventStage` carregados. Proposta: continuar sem tipo novo, passando as entidades como argumentos ao lado do DTO (`EventLineup.create(event, artist, stage, dto)`).
3. **Dados internos sem DTO.** `Seat.create` por assento (usado na geração de bloco e de pista) não vem de nenhum request. Proposta: a entidade expõe `createBlock(sector, dto)` e `createGeneralAdmission(sector, dto)` e monta cada assento internamente.
4. **Nome das entradas únicas.** Aplicar `RequestDto` a `LoginDto`, `SeatNoteDto` e cia.? E `ListXQueryDto` continua como está?
5. **Update DTO:** com `omit/partial` do Zod (como artists) ou campo a campo (como sectors)?
6. **Módulo falando com módulo** quando há dependência circular: service ↔ service com `forwardRef`, ou extrair a consulta compartilhada.
7. **`CLAUDE.md`** ainda diz que "entidade não importa DTO" e manda criar interfaces em `<modulo>.types.ts`. Contradiz a regra 1 e precisa ser atualizado quando as decisões acima fecharem.
