// URL que o NAVEGADOR usa pra chamar a API (vem do .env / build arg do Docker)
export const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "")

// Tempo máximo de uma requisição antes de desistir
export const API_TIMEOUT_MS = 15_000
