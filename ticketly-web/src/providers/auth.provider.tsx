import { useCallback, useEffect, useState, type ReactNode } from "react"
import { LoaderCircleIcon } from "lucide-react"

import { AuthContext, type AuthContextType } from "@/contexts/auth.context"
import type { IAdminUser, ILogin } from "@/interfaces"
import { ApiError, authService, setUnauthorizedHandler } from "@/services"
import { handleWarning } from "@/utils"

const TOKEN_STORAGE_KEY = "ticketly-admin-token"
const USER_STORAGE_KEY = "ticketly-admin-user"

function readStoredUser(): IAdminUser | null {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY)
    return userData ? (JSON.parse(userData) as IAdminUser) : null
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lê do localStorage já no useState: a tela abre logada sem "piscar" o login
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  )
  const [user, setUser] = useState<IAdminUser | null>(readStoredUser)
  const [loading, setLoading] = useState(() => !!token)

  const saveSession = useCallback((newToken: string, newUser: IAdminUser) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }, [])

  const expireSession = useCallback(() => {
    logout()
    handleWarning("Sessão expirada. Faça login novamente.")
  }, [logout])

  // Confere com a API se o token salvo ainda vale
  const checkAuth = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!currentToken) return

    try {
      const me = await authService.me(currentToken)
      saveSession(currentToken, me)
    } catch (error) {
      // 401 já é tratado pelo unauthorizedHandler. Se a API estiver fora
      // do ar, mantém a sessão: não é culpa do token
      if (!(error instanceof ApiError) || !error.isNetworkError) {
        console.error(error)
      }
    }
  }, [saveSession])

  const login = useCallback(
    async (data: ILogin) => {
      const response = await authService.login(data)
      saveSession(response.accessToken, response.user)
    },
    [saveSession]
  )

  // Qualquer requisição autenticada que voltar 401 desloga
  useEffect(() => setUnauthorizedHandler(expireSession), [expireSession])

  // Ao abrir a página: se tem token salvo, valida antes de liberar a tela
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!storedToken) return

    // Se o componente desmontar antes da resposta, ignora o resultado
    let cancelled = false

    authService
      .me(storedToken)
      .then((me) => {
        if (!cancelled) saveSession(storedToken, me)
      })
      .catch((error) => {
        // 401 já é tratado pelo unauthorizedHandler. Se a API estiver fora
        // do ar, mantém a sessão: não é culpa do token
        if (!(error instanceof ApiError) || !error.isNetworkError) {
          console.error(error)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [saveSession])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <LoaderCircleIcon className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const value: AuthContextType = {
    isAuthenticated: !!token,
    token,
    user,
    loading,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
