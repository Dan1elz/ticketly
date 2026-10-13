import type {
  ISeat,
  ISeatBlockPayload,
  ISeatNotePayload,
  ISeatQuantityPayload,
  ISector,
  TSeatAction,
} from "@/interfaces"
import { ApiService } from "./api.service"

const apiService = new ApiService()

export const seatService = {
  getBySector: async (sectorId: string, token?: string): Promise<ISeat[]> => {
    const response = await apiService.get<ISeat[]>(
      `sectors/${sectorId}/seats`,
      undefined,
      token
    )
    return response.data
  },

  // Devolve o setor com as contagens novas
  createBlock: async (
    sectorId: string,
    data: ISeatBlockPayload,
    token?: string
  ): Promise<ISector> => {
    const response = await apiService.post<ISector>(
      `sectors/${sectorId}/seats/grid`,
      data,
      token
    )
    return response.data
  },

  createQuantity: async (
    sectorId: string,
    data: ISeatQuantityPayload,
    token?: string
  ): Promise<ISector> => {
    const response = await apiService.post<ISector>(
      `sectors/${sectorId}/seats/quantity`,
      data,
      token
    )
    return response.data
  },

  // block e cancel exigem a observação; unblock não tem corpo
  changeStatus: async (
    action: TSeatAction,
    id: string,
    note: string | null,
    token?: string
  ): Promise<ISeat> => {
    const body: ISeatNotePayload | undefined =
      action === "unblock" || note === null ? undefined : { note }

    const response = await apiService.post<ISeat>(
      `seats/${id}/${action}`,
      body,
      token
    )
    return response.data
  },
}
