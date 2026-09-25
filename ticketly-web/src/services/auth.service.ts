import type { IAdminUser, ILogin, ILoginResponse } from "@/interfaces"
import { ApiService } from "./api.service"

const apiService = new ApiService()

// Autenticação só do admin — cliente compra sem login
export const authService = {
  login: async (form: ILogin): Promise<ILoginResponse> => {
    const response = await apiService.post<ILoginResponse>(
      "admin/auth/login",
      form
    )
    return response.data
  },

  // Valida o token salvo (ex: ao recarregar a página) e devolve o admin logado
  me: async (token: string): Promise<IAdminUser> => {
    const response = await apiService.get<IAdminUser>(
      "admin/auth/me",
      undefined,
      token
    )
    return response.data
  },
}
