import { Link } from "react-router-dom"

export function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6">
      <h1 className="text-2xl font-medium">Página não encontrada</h1>
      <Link to="/" className="text-sm underline">
        Voltar ao início
      </Link>
    </main>
  )
}
