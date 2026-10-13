import type {
  ISector,
  ISectorPayload,
  TSectorUpdatePayload,
} from "@/interfaces"
import { ApiService } from "./api.service"

const apiService = new ApiService()

export const sectorService = {
  getByEvent: async (eventId: string, token?: string): Promise<ISector[]> => {
    const response = await apiService.get<ISector[]>(
      `events/${eventId}/sectors`,
      undefined,
      token
    )
    return response.data
  },

  create: async (
    eventId: string,
    data: ISectorPayload,
    token?: string
  ): Promise<ISector> => {
    const response = await apiService.post<ISector>(
      `events/${eventId}/sectors`,
      data,
      token
    )
    return response.data
  },

  update: async (
    id: string,
    data: TSectorUpdatePayload,
    token?: string
  ): Promise<ISector> => {
    const response = await apiService.patch<ISector>(
      `sectors/${id}`,
      data,
      token
    )
    return response.data
  },

  delete: async (id: string, token?: string): Promise<void> => {
    await apiService.delete<void>(`sectors/${id}`, token)
  },
}
