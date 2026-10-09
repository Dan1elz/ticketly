import type { IUploadedFile, TUploadFolder } from "@/interfaces"
import { ApiService } from "./api.service"

const apiService = new ApiService()

export const uploadService = {
  uploadImage: async (
    file: File,
    folder: TUploadFolder,
    token?: string
  ): Promise<IUploadedFile> => {
    const form = new FormData()
    form.append("file", file)
    form.append("folder", folder)

    const response = await apiService.post<IUploadedFile>(
      "uploads/images",
      form,
      token,
      true
    )
    return response.data
  },
}
