# Pendências da API

O que o front (`ticketly-web`) já usa e a API ainda não tem. O front foi escrito **como se isso já existisse**; até a API implementar, essas partes respondem erro.

## 1. Upload de imagem (MinIO)

A foto do artista deixou de ser uma URL digitada: o admin escolhe um arquivo, o front sobe na hora e guarda só a **chave** do arquivo no MinIO.

### Infra (`ticketly-infra`)

- Container do MinIO na rede `ticketly-net` (API S3 na `9000`, console na `9001`).
- Bucket `ticketly`, com **leitura pública** só para o prefixo `artists/*` (a loja mostra a foto sem login). Escrita só pela API.

### Variáveis de ambiente da API

| Variável | Exemplo | Para quê |
|---|---|---|
| `S3_ENDPOINT` | `http://minio:9000` | Onde a API envia os arquivos (dentro do Docker) |
| `S3_PUBLIC_URL` | `http://localhost:9000/ticketly` | Base da URL que o **navegador** usa pra abrir a imagem |
| `S3_BUCKET` | `ticketly` | |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | | Credenciais do MinIO |
| `S3_REGION` | `us-east-1` | O SDK exige, o MinIO ignora |

Dependência: `@aws-sdk/client-s3` (com `forcePathStyle: true` para o MinIO).

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
  "url": "http://localhost:9000/ticketly/artists/0b9c1e7a-5f7e-4a51-9a51-3c1f2d9e8b10.webp"
}
```

- A chave é gerada pela API (`{folder}/{uuid}.{extensão}`), nunca o nome original do arquivo.
- Erros: `400` (sem arquivo, tipo ou pasta inválidos), `413` (maior que 5 MB). Mensagens no formato padrão do Nest — o front já mostra `message` no toast.

### Mudança em `artists`

- Coluna `image_url` → `image_key` (migration nova).
- `POST /artists` e `PATCH /artists/:id` recebem **`imageKey`** no lugar de `imageUrl`. Validar que começa com `artists/`.
- A resposta devolve os dois: `imageKey` e `imageUrl` (montada pela API: `S3_PUBLIC_URL + "/" + imageKey`). O banco guarda só a chave — se o endereço do MinIO mudar, nenhum dado precisa ser migrado.
- `POST/PATCH /events` com artista novo no lineup (`lineup[].artist`): mesmo campo `imageKey`.
- No lineup da resposta de eventos, `artist.imageUrl` continua existindo (o front usa nos avatares).

### Depois (não bloqueia o front)

- Ao trocar a foto, apagar o arquivo antigo do bucket.
- Arquivos órfãos (upload feito e formulário cancelado): job que apaga o que está no bucket e não está em nenhum artista há mais de 1 dia.

## 2. Outras observações

- **`GET /events` é público e devolve rascunhos.** A loja vai precisar listar só `PUBLISHED` (filtro forçado nas rotas públicas, ou rotas públicas separadas das do admin).
- **`POST /events` não aceita `status`.** Quando o admin cria um show já como "Publicado", o front faz `POST` e depois `PATCH { status }`. Se a API passar a aceitar `status` no create, dá pra fazer numa requisição só.
