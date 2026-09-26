# ============================
# Estágio de Build (instala dependências com o uv)
# ============================
FROM python:3.12-slim AS build

# O uv vem da imagem oficial — não precisa instalar nada no host
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Cache layer: só reinstala se pyproject/lock mudarem
COPY pyproject.toml uv.lock .python-version ./
# --frozen: usa exatamente as versões do uv.lock | --no-dev: sem watchfiles etc
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app

# ============================
# Estágio de Runtime (Imagem final)
# ============================
FROM python:3.12-slim AS runtime

# Não roda como root
RUN useradd --create-home --uid 1000 worker

WORKDIR /app
COPY --from=build --chown=worker:worker /app /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

USER worker

# Worker não tem porta HTTP, então não tem HEALTHCHECK por enquanto
CMD ["python", "-m", "app.main"]
