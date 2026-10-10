# Pendências da API

O que o front (`ticketly-web`) já usa ou vai precisar e a API ainda não tem. Implementou, tira daqui.

## 1. Fotos dos artistas (storage S3)

O fluxo básico está pronto: `POST /uploads/artist-image` sobe a foto, `POST/PATCH /artists` (e `lineup[].artist` em eventos) recebem `imageKey` e as respostas devolvem `imageKey` + `imageUrl`. O que falta:

- **Apagar a foto antiga** do bucket quando o artista troca de foto (`StorageService.delete`).
- **Arquivos órfãos** (upload feito e formulário cancelado): a infra já apaga sozinha o que fica em `tmp/` por mais de 1 dia. Pra aproveitar, o upload passa a salvar em `tmp/<uuid>.<ext>` e o `POST/PATCH /artists` move o arquivo pra `artists/` ao salvar (copiar + apagar o original). Isso muda o contrato: o `imageKey` enviado pelo front começa com `tmp/` — combinar com o front antes.
- **Converter no upload com `sharp`**: hoje a API aceita JPEG, PNG, WebP e AVIF e salva como veio. Converter tudo pra WebP redimensionado (~800px) padroniza o formato, aceita HEIC de iPhone, remove o EXIF (que pode ter GPS) e evita foto de 8 MB na loja.
- **Mensagens em inglês** no upload: "File is required" (sem arquivo) e "File too large" (413) vêm do Nest/Multer. O front já valida as duas coisas antes de enviar.

## 2. Outras observações

- **`GET /events` é público e devolve rascunhos.** A loja vai precisar listar só `PUBLISHED` (filtro forçado nas rotas públicas, ou rotas públicas separadas das do admin).
- **`POST /events` não aceita `status`.** Quando o admin cria um show já como "Publicado", o front faz `POST` e depois `PATCH { status }`. Se a API passar a aceitar `status` no create, dá pra fazer numa requisição só.
