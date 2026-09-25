import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

// Placeholder: aqui vai o painel (shows, setores, pedidos...)
export function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-medium">Olá, {user?.name ?? "admin"}</h1>
      <Button variant="outline" onClick={logout}>
        Sair
      </Button>
    </main>
  )
}
