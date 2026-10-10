# Pendências da API

O que o front (`ticketly-web`) já usa e a API ainda não tem. O front foi escrito **como se isso já existisse**; até a API implementar, essas partes respondem erro.

## 1. Upload de imagem (storage S3)

A foto do artista deixou de ser uma URL digitada: o admin escolhe um arquivo, o front sobe na hora e guarda só a **chave** do arquivo no storage.

### Infra (`ticketly-infra`) — ✅ pronta

- Storage S3 (Silo, fork do MinIO) no serviço `storage` da rede `ticketly-net` (API S3 na `9000`, painel na `9001`).
- Bucket `ticketly-public`, com **leitura pública** só no prefixo `artists/` (a loja mostra a foto sem login). Escrita só com credencial.
- Regra de lifecycle no `ticketly-public`: tudo em `tmp/` é apagado depois de 1 dia.

### Variáveis de ambiente da API

| Variável | Exemplo | Para quê |
|---|---|---|
| `S3_ENDPOINT_URL` | `http://storage:9000` | Onde a API envia os arquivos (dentro do Docker). Mesmo nome usado nos workers |
| `S3_PUBLIC_URL` | `http://localhost:9000` | Endereço que o **navegador** enxerga: monta a URL das fotos e assina as URLs temporárias |
| `S3_BUCKET_PUBLIC` | `ticketly-public` | Fotos dos artistas |
| `S3_BUCKET_DOCUMENTS` | `ticketly-documents` | PDFs (NF-e e ingresso), privado |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | `ticketly` / `ticketly-secret` | Credenciais do storage (as mesmas do `.env` da infra) |
| `S3_REGION` | `us-east-1` | O SDK exige, o storage ignora |

Dependência: `@aws-sdk/client-s3` (com `forcePathStyle: true`, senão o SDK tenta `ticketly-public.storage:9000` em vez de `storage:9000/ticketly-public`). Para URLs assinadas, `@aws-sdk/s3-request-presigner` com um **segundo cliente** configurado no `S3_PUBLIC_URL` (a assinatura inclui o endereço; não dá pra trocar `storage` por `localhost` depois de assinar).

### `POST /uploads/images` (protegida — admin logado)

`multipart/form-data`:

| Campo | Tipo | Regra |
|---|---|---|
| `file` | arquivo | `image/jpeg`, `image/png` ou `image/webp`; até **5 MB** |
| `folder` | texto | só `artists` por enquanto (lista fechada, nunca usar o texto do usuário direto no caminho) |

Resposta `201`:

```json
{
  "key": "artists/0b9c1e7a-5f7e-4a51-9a51-3c1f2d9e8b10.webp",
  "url": "http://localhost:9000/ticketly-public/artists/0b9c1e7a-5f7e-4a51-9a51-3c1f2d9e8b10.webp"
}
```

- A chave é gerada pela API (`{folder}/{uuid}.{extensão}`), nunca o nome original do arquivo.
- Erros: `400` (sem arquivo, tipo ou pasta inválidos), `413` (maior que 5 MB). Mensagens no formato padrão do Nest — o front já mostra `message` no toast.

### Mudança em `artists`

- ✅ Coluna `image_url` → `image_key` (`Migration20261009190000`).
- ✅ `POST /artists` e `PATCH /artists/:id` recebem **`imageKey`** (formato `artists/{uuid}.{jpg|png|webp}`) e conferem no storage se o arquivo existe (`400` se não existir).
- ✅ Rota de upload: ficou **`POST /uploads/artist-image`** (só o campo `file`, sem `folder`). Falta ajustar o front, que ainda chama `POST /uploads/images`.
- ⏳ Por enquanto a resposta devolve só `imageKey` (artista e `lineup[].artist`). Falta: a resposta devolver os dois: `imageKey` e `imageUrl` (montada pela API: `S3_PUBLIC_URL + "/" + S3_BUCKET_PUBLIC + "/" + imageKey`). O banco guarda só a chave — se o endereço do storage mudar, nenhum dado precisa ser migrado.
- `POST/PATCH /events` com artista novo no lineup (`lineup[].artist`): mesmo campo `imageKey`.
- No lineup da resposta de eventos, `artist.imageUrl` continua existindo (o front usa nos avatares).

### Depois (não bloqueia o front)

- Ao trocar a foto, apagar o arquivo antigo do bucket.
- Arquivos órfãos (upload feito e formulário cancelado): a infra já apaga sozinha o que fica em `tmp/` por mais de 1 dia. Pra aproveitar, o upload passa a salvar em `tmp/<uuid>.<ext>` e o `POST/PATCH /artists` move o arquivo pra `artists/` ao salvar (copiar + apagar o original). Isso muda o contrato: o `imageKey` enviado pelo front começa com `tmp/` — combinar com o front antes.

## 2. Outras observações

- **`GET /events` é público e devolve rascunhos.** A loja vai precisar listar só `PUBLISHED` (filtro forçado nas rotas públicas, ou rotas públicas separadas das do admin).
- **`POST /events` não aceita `status`.** Quando o admin cria um show já como "Publicado", o front faz `POST` e depois `PATCH { status }`. Se a API passar a aceitar `status` no create, dá pra fazer numa requisição só.
