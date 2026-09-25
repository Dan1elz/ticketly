/// <reference types="vite/client" />

// Tipa as variáveis de ambiente — sem isso, import.meta.env.VITE_API_URL é "any"
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
