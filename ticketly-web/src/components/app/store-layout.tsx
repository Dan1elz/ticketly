import { ShieldUserIcon } from "lucide-react"
import { Link, Outlet } from "react-router-dom"

import { Logo } from "@/components/app/logo"
import { ThemeToggle } from "@/components/app/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function StoreLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Ticketly - início">
            <Logo />
          </Link>

          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link to="/" />}
              className="hidden sm:inline-flex"
            >
              Shows
            </Button>
            <ThemeToggle />
            <Separator orientation="vertical" className="mx-1 h-6!" />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/admin" />}
            >
              <ShieldUserIcon data-icon="inline-start" />
              Área do admin
            </Button>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo className="text-foreground" />
          <p>Projeto de estudo de sistemas distribuídos.</p>
        </div>
      </footer>
    </div>
  )
}
