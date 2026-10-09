# ticketly-web

Front do [Ticketly](../README.md). Tem duas áreas no mesmo app:

- **Loja** (`/`) — aberta, sem login. O cliente escolhe o show, os assentos, preenche os dados e acompanha o pedido.
- **Admin** (`/admin`) — com login. Cadastro de shows e acompanhamento de cada pedido etapa por etapa.

**Stack:** React 19, Vite, TypeScript, Tailwind 4, shadcn/ui, React Router, React Hook Form + Zod.

## Telas planejadas

| Rota                                          | Tela                                        | Status                             |
| --------------------------------------------- | ------------------------------------------- | ---------------------------------- |
| `/`                                           | Lista de shows                              | Placeholder "em desenvolvimento"   |
| `/shows/:id`                                  | Mapa de assentos + reserva                  | A fazer                            |
| `/checkout/:reservationCode`                  | Dados do cliente + cronômetro de 10 min     | A fazer                            |
| `/pedido/:reservationCode`                    | Status do pedido em tempo real              | A fazer                            |
| `/admin/login`                                | Login do admin                              | Feita                              |
| `/admin`                                      | Dashboard (totais + próximos shows)         | Feita                              |
| `/admin/shows`                                | Listagem de shows (busca, status, artista)  | Feita                              |
| `/admin/shows/novo`, `/admin/shows/:id`       | Formulário do show + lineup                 | Feita (setores e assentos a fazer) |
| `/admin/artistas`                             | Listagem de artistas (busca, ativo/inativo) | Feita                              |
| `/admin/artistas/novo`, `/admin/artistas/:id` | Formulário do artista                       | Feita                              |
| `/admin/pedidos`                              | Pedidos e a etapa em que cada um está       | A fazer                            |

O `AuthProvider` envolve só as rotas `/admin`, então a loja nunca espera validação de token.

Páginas e componentes **nunca chamam service direto**: usam o hook do recurso (`useArtists()`, `useEvents()`...), que lê o contexto. O provider guarda o que já foi carregado — abrir a edição a partir da lista ou voltar pra lista com os mesmos filtros não faz requisição nova.

A foto do artista é enviada pro MinIO via `POST /uploads/images` assim que o arquivo é escolhido; o formulário guarda só a chave. O que a API ainda precisa implementar pra isso está em [`docs/pendencias-api.md`](../docs/pendencias-api.md).

Nas listagens, página e filtros ficam na URL (`?search=...&status=...&page=2`): dá pra recarregar ou compartilhar o link sem perder a busca.

## Estrutura

```
src/
  pages/        telas; componentes usados só por uma tela ficam em pages/<Tela>/components
  routes/       AppRoutes, PrivateRoutes, PublicRoutes
  components/
    ui/         componentes do shadcn (não editar à mão)
    app/        componentes do app: layouts (loja e admin), sidebar, formulário
                de artista, seletores, paginação, estados de lista...
  services/     chamadas HTTP pra API (um service por recurso, estendendo o BaseService)
  providers/    estado + ações de cada recurso (Auth, Artists, Events, Dashboard, Theme)
  contexts/     tipo de cada contexto
  hooks/        use-<recurso> (acesso ao contexto), use-list-params, use-debounced-callback
  schemas/      validações com Zod + conversão formulário <-> payload da API
  interfaces/   tipos das respostas e payloads da API
  constants/    rótulos dos enums da API (status, tipo de apresentação...)
  configs/      configuração do cliente HTTP
  utils/        formatação, validadores, toasts
```

## Rodando

```bash
cp .env.example .env
docker network create ticketly-net   # só na primeira vez
docker compose -f compose.development.yaml up -d
```

Front em http://localhost:5173.

Sem Docker:

```bash
npm install
npm run dev
```

## Variáveis de ambiente

| Variável        | Para quê                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`  | URL da API. Quem chama é o navegador, então precisa ser um endereço acessível de fora do Docker (`http://localhost:3000` no dev). |
| `FRONTEND_PORT` | Porta do nginx no staging.                                                                                                        |

No staging o `VITE_API_URL` entra na hora do **build** (é embutido no JavaScript), não na hora de rodar.

## Scripts

| Comando            | O que faz                        |
| ------------------ | -------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento      |
| `npm run build`    | Typecheck + build de produção    |
| `npm run check`    | Typecheck + lint + formatação    |
| `npm run lint:fix` | Corrige o que o ESLint conseguir |
| `npm run format`   | Formata com Prettier             |

## Componentes

Para adicionar um componente do shadcn:

```bash
npx shadcn@latest add button
```
