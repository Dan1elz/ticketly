import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefixo '' lê também variáveis sem VITE_ (não vão para o navegador)
  const env = loadEnv(mode, process.cwd(), "")

  // Hostnames pelos quais o dev server pode ser acessado, separados por vírgula.
  // Sem isso o Vite responde 403 "host not allowed" para quem chega pelo proxy
  // (ex.: ticketly.zanni.tech). localhost sempre funciona.
  const allowedHosts = (env.ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      allowedHosts,
    },
  }
})
