import { type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"

// Só entra logado. Guarda de onde veio pra voltar pra lá depois do login
export function PrivateRoutes({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
