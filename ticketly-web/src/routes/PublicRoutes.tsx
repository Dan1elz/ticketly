import { type ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"

// Só entra deslogado (ex: tela de login). Admin já logado vai direto pro painel
export function PublicRoutes({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
