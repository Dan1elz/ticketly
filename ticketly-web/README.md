# ticketly-web

Front do [Ticketly](../README.md). Tem duas áreas no mesmo app:

- **Loja** (`/`) — aberta, sem login. O cliente escolhe o show, os assentos, preenche os dados e acompanha o pedido.
- **Admin** (`/admin`) — com login. Cadastro de shows e acompanhamento de cada pedido etapa por etapa.

**Stack:** React 19, Vite, TypeScript, Tailwind 4, shadcn/ui, React Router, React Hook Form + Zod.

## Telas planejadas

| Rota | Tela | Status |
|---|---|---|
| `/` | Lista de shows | Iniciada |
| `/shows/:id` | Mapa de assentos + reserva | A fazer |
| `/checkout/:reservationCode` | Dados do cliente + cronômetro de 10 min | A fazer |
| `/pedido/:reservationCode` | Status do pedido em tempo real | A fazer |
| `/admin/login` | Login do admin | Iniciada |
| `/admin` | Dashboard | Iniciada |
| `/admin/pedidos` | Pedidos e a etapa em que cada um está | A fazer |
| `/admin/shows` | Cadastro de shows, setores e assentos | A fazer |

O `AuthProvider` envolve só as rotas `/admin`, então a loja nunca espera validação de token.

## Estrutura

```
src/
  pages/        telas (Home, Admin/Login, Admin/Dashboard, NotFound)
  routes/       AppRoutes, PrivateRoutes, PublicRoutes
  components/   componentes do shadcn em components/ui
  services/     chamadas HTTP pra API (base.service, api.service, auth.service)
  providers/    AuthProvider, ThemeProvider
  contexts/     contextos de auth e tema
  hooks/        use-auth, use-theme, use-mobile
  schemas/      validações com Zod (login, checkout)
  interfaces/   tipos das respostas da API
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

| Variável | Para quê |
|---|---|
| `VITE_API_URL` | URL da API. Quem chama é o navegador, então precisa ser um endereço acessível de fora do Docker (`http://localhost:3000` no dev). |
| `FRONTEND_PORT` | Porta do nginx no staging. |

No staging o `VITE_API_URL` entra na hora do **build** (é embutido no JavaScript), não na hora de rodar.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção |
| `npm run check` | Typecheck + lint + formatação |
| `npm run lint:fix` | Corrige o que o ESLint conseguir |
| `npm run format` | Formata com Prettier |

## Componentes

Para adicionar um componente do shadcn:

```bash
npx shadcn@latest add button
```
