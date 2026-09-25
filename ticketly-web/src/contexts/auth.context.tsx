import { createContext } from "react"

import type { IAdminUser, ILogin } from "@/interfaces"

export type AuthContextType = {
  isAuthenticated: boolean
  token: string | null
  user: IAdminUser | null
  loading: boolean
  login: (data: ILogin) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
