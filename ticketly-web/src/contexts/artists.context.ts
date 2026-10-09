import { createContext } from "react"

import type {
  IArtist,
  IArtistPayload,
  IArtistUpdatePayload,
  IIndexParams,
  IUploadedFile,
} from "@/interfaces"

export type ArtistsContextType = {
  artists: IArtist[]
  total: number
  loading: boolean
  error: boolean
  selectedArtist: IArtist | null
  searchArtists: (params: IIndexParams) => Promise<void>
  reloadArtists: () => Promise<void>
  selectArtist: (id: string) => Promise<void>
  getArtist: (id: string) => Promise<IArtist>
  lookupArtists: (search: string) => Promise<IArtist[]>
  createArtist: (data: IArtistPayload) => Promise<IArtist>
  updateArtist: (id: string, data: IArtistUpdatePayload) => Promise<IArtist>
  deleteArtist: (id: string) => Promise<void>
  uploadArtistImage: (file: File) => Promise<IUploadedFile>
}

export const ArtistsContext = createContext<ArtistsContextType | null>(null)
