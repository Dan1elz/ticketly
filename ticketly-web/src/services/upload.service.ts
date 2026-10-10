import type { IUploadedFile } from "@/interfaces"
import { ApiService } from "./api.service"

const apiService = new ApiService()

export const uploadService = {
  uploadArtistImage: async (
    file: File,
    token?: string
  ): Promise<IUploadedFile> => {
    const form = new FormData()
    form.append("file", file)

    const response = await apiService.post<IUploadedFile>(
      "uploads/artist-image",
      form,
      token,
      true
    )
    return response.data
  },
}
