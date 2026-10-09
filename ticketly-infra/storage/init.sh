#!/bin/sh
# Prepara o Storage: buckets, acesso público e limpeza automática.
# Pode rodar quantas vezes quiser: não duplica nada.
set -e

# 1. Atalho "local" apontando pro Storage (com o usuário admin)
mc alias set local http://storage:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

# 2. Buckets
mc mb --ignore-existing "local/$S3_BUCKET_PUBLIC"
mc mb --ignore-existing "local/$S3_BUCKET_DOCUMENTS"

# 3. Só o prefixo artists/ é público (tmp/ continua privado)
mc anonymous set download "local/$S3_BUCKET_PUBLIC/artists"

# 4. Apaga sozinho o que ficar em tmp/ por mais de 1 dia.
#    Remove as regras antigas antes, senão cada "up" adicionaria uma regra repetida.
mc ilm rule rm --all --force "local/$S3_BUCKET_PUBLIC" || true
mc ilm rule add --prefix "tmp/" --expire-days 1 "local/$S3_BUCKET_PUBLIC"

echo "Storage pronto."