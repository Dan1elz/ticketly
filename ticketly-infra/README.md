# ticketly-infra

Infraestrutura compartilhada do [Ticketly](../README.md): os programas prontos que todos os serviços usam.

Não tem código de aplicação, nem `Dockerfile`: só imagens prontas, configuração e scripts de inicialização. Quem orquestra é o **Docker Compose** — o `compose.development.yaml` declara o que deve estar rodando e o Compose cria rede, volumes e containers, reinicia o que cair e espera cada serviço ficar saudável (`healthcheck`).

O Postgres **não** fica aqui: ele é dado da API e está no [`ticketly-api`](../ticketly-api).

## Serviços

| Serviço | Para quê | Quem usa | Status |
|---|---|---|---|
| `storage` | Storage S3: fotos dos artistas e PDFs | api, fiscal, voucher | ✅ Pronto |
| `storage-initial-setup` | Roda uma vez: cria buckets e regras, depois encerra | — | ✅ Pronto |
| `rabbitmq` | Mensagens entre serviços | api, fiscal, voucher | A fazer |
| `redis` | Lock de assento, idempotência, cache de etapas | api, fiscal, voucher | A fazer |
| `mailpit` | Caixa de e-mail falsa | api | A fazer |

Os outros serviços acham cada um pelo **nome do serviço** na rede `ticketly-net` (ex.: `http://storage:9000`).

## Storage S3 (Silo)

O programa por trás do `storage` é o **[Silo](https://silo.pgsty.com)** (`pgsty/silo`), fork comunitário do MinIO mantido pelo Pigsty.

**Por que não o MinIO:** o MinIO parou de publicar imagens Docker gratuitas em outubro de 2025 e o repositório foi arquivado em abril de 2026. Hoje `minio/minio` e `quay.io/minio/*` não baixam mais. O Silo mantém a mesma API S3, as mesmas variáveis `MINIO_*` e os mesmos comandos do `mc`, com imagens e correções de segurança. Plano B, se o Silo parar: RustFS.

**Por que o serviço se chama `storage` e não `silo`:** os outros repositórios só falam S3 e apontam pra `http://storage:9000`. Se o produto mudar, só este repositório muda.

| Imagem | Versão |
|---|---|
| `pgsty/silo` | `RELEASE.2026-09-16T00-00-00Z` |
| `pgsty/mc` | `RELEASE.2026-09-16T00-00-00Z` |

Sempre com versão fixa, nunca `latest`. Usar a tag normal, não a `-distroless` (essa não tem shell nem `mc`, que o healthcheck usa).

### Buckets (criados pelo `storage/init.sh`)

| Bucket | Acesso | Conteúdo |
|---|---|---|
| `ticketly-public` | Leitura pública **só** em `artists/` | `artists/` fotos dos artistas · `tmp/` uploads não confirmados, **apagados sozinhos depois de 1 dia** (lifecycle) |
| `ticketly-documents` | Privado (acesso por URL assinada) | `invoices/` NF-e · `tickets/` ingressos |

O script é idempotente: pode rodar quantas vezes quiser (`mc mb --ignore-existing`, regras de lifecycle recriadas do zero). As "pastas" não precisam ser criadas — no S3 elas são só o começo do nome do arquivo.

## Rodando

```bash
cp .env.example .env
docker network create ticketly-net   # só na primeira vez
docker compose -f compose.development.yaml up -d
```

| O quê | Endereço |
|---|---|
| Storage S3 (API) | http://localhost:9000 |
| Storage (painel web) | http://localhost:9001 — login com `STORAGE_ROOT_USER` / `STORAGE_ROOT_PASSWORD` |

Pra conferir:

```bash
docker compose -f compose.development.yaml ps -a
docker compose -f compose.development.yaml logs storage-initial-setup
```

- `storage` deve estar `healthy`.
- `storage-initial-setup` deve estar `Exited (0)` e o log terminar com **"Storage pronto."**. Isso é o normal: ele roda uma vez e encerra.
- Na primeira execução aparece `Unable to fetch lifecycle rules`: é o script tentando apagar regras que ainda não existem. Esperado.

Pra validar o compose depois de editar:

```bash
docker compose -f compose.development.yaml config
```

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `STORAGE_ROOT_USER` / `STORAGE_ROOT_PASSWORD` | Usuário admin do storage (senha com no mínimo 8 caracteres). São as mesmas credenciais que os serviços usam em `S3_ACCESS_KEY` / `S3_SECRET_KEY` |
| `S3_BUCKET_PUBLIC` | Nome do bucket público (`ticketly-public`) |
| `S3_BUCKET_DOCUMENTS` | Nome do bucket privado (`ticketly-documents`) |

**Atenção:** no serviço `storage`, o container precisa receber essas credenciais com o nome que o Silo lê:

```yaml
environment:
  MINIO_ROOT_USER: ${STORAGE_ROOT_USER}         # esquerda: nome fixo, o Silo decide
  MINIO_ROOT_PASSWORD: ${STORAGE_ROOT_PASSWORD} # direita: nome no seu .env, você decide
```

Se o lado esquerdo estiver errado, o Silo sobe com o usuário padrão `minioadmin:minioadmin` (aparece um `WARN` no log) e nenhum login funciona.

## Estrutura

```
compose.development.yaml   serviços de desenvolvimento (portas expostas)
compose.staging.yaml       a fazer
.env.example               credenciais e nomes dos buckets
storage/
  init.sh                  cria buckets, acesso público e lifecycle
```
