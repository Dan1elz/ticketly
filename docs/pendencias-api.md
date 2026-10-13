# Pendências da API

O que o front (`ticketly-web`) já usa ou vai precisar e a API ainda não tem. Implementou, tira daqui.

## 1. Fotos dos artistas (storage S3)

O fluxo básico está pronto: `POST /uploads/artist-image` sobe a foto, `POST/PATCH /artists` recebem `imageKey` e as respostas devolvem `imageKey` + `imageUrl`. O que falta:

- **Apagar a foto antiga** do bucket quando o artista troca de foto (`StorageService.delete`).
- **Arquivos órfãos** (upload feito e formulário cancelado): a infra já apaga sozinha o que fica em `tmp/` por mais de 1 dia. Pra aproveitar, o upload passa a salvar em `tmp/<uuid>.<ext>` e o `POST/PATCH /artists` move o arquivo pra `artists/` ao salvar (copiar + apagar o original). Isso muda o contrato: o `imageKey` enviado pelo front começa com `tmp/` — combinar com o front antes.
- **Converter no upload com `sharp`**: hoje a API aceita JPEG, PNG, WebP e AVIF e salva como veio. Converter tudo pra WebP redimensionado (~800px) padroniza o formato, aceita HEIC de iPhone, remove o EXIF (que pode ter GPS) e evita foto de 8 MB na loja.
- **Mensagens em inglês** no upload: "File is required" (sem arquivo) e "File too large" (413) vêm do Nest/Multer. O front já valida as duas coisas antes de enviar.

## 2. Outras observações

- **Assentos na loja.** `GET /events/:eventId/sectors` é público (setores + contagem por status), mas `GET /sectors/:sectorId/seats` é só admin, porque devolve a observação e quem bloqueou. A grade da loja vai precisar de uma rota pública só com posição e status.
- **Ações em lote nos assentos.** `block`, `unblock` e `cancel` mudam um assento por requisição. O admin faz as chamadas em sequência (uma fileira inteira são ~20 requisições; na pista o front limita a 200 por operação). Uma rota que receba uma lista de ids, ou "N ingressos de tal status" na pista, tiraria esse limite e deixaria a operação numa transação só.
- **`GET /sectors/:id/seats` sem filtro nem paginação.** Devolve todos os assentos. Pra mapa de lugar marcado está bem (dezenas a poucas centenas), mas uma pista de 10 mil ingressos vira uma resposta de vários MB só pra o front achar "os N de maior número que estão disponíveis". Um `?status=` e um `?limit=` resolveriam.
