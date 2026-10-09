export type TSocialLinks = Record<string, string>

export interface IArtist {
  id: string
  name: string
  legalName: string
  genre: string
  bio: string
  imageKey: string
  imageUrl: string
  socialLinks: TSocialLinks
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IArtistPayload {
  name: string
  legalName: string
  genre: string
  bio: string
  imageKey: string
  socialLinks: TSocialLinks
}

export interface IArtistUpdatePayload extends Partial<IArtistPayload> {
  isActive?: boolean
}
