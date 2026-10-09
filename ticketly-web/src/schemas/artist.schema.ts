import { z } from "zod"

import type { IArtist, IArtistPayload, IUploadedFile } from "@/interfaces"

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório`)
    .max(max, `${label} deve ter no máximo ${max} caracteres`)

const isHttpUrl = (value: string) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const httpUrl = (error: string) =>
  z.string().trim().min(1, error).max(2000).refine(isHttpUrl, error)

export const artistSchema = z.object({
  name: requiredText("Nome", 120),
  legalName: requiredText("Nome civil", 120),
  genre: requiredText("Gênero", 50),
  bio: requiredText("Bio", 2000),
  image: z
    .custom<IUploadedFile>()
    .nullable()
    .refine((image) => !!image, "Envie uma foto do artista"),
  socialLinks: z
    .array(
      z.object({
        network: z.string().min(1, "Escolha a rede"),
        url: httpUrl("Link inválido"),
      })
    )
    .refine(
      (links) => new Set(links.map((l) => l.network)).size === links.length,
      "Rede social repetida"
    ),
  isActive: z.boolean(),
})

export type ArtistFormData = z.input<typeof artistSchema>
export type ArtistFormOutput = z.output<typeof artistSchema>

export const emptyArtistForm: ArtistFormData = {
  name: "",
  legalName: "",
  genre: "",
  bio: "",
  image: null,
  socialLinks: [],
  isActive: true,
}

export function artistToForm(artist: IArtist): ArtistFormData {
  return {
    name: artist.name,
    legalName: artist.legalName,
    genre: artist.genre,
    bio: artist.bio,
    image: { key: artist.imageKey, url: artist.imageUrl },
    socialLinks: Object.entries(artist.socialLinks).map(([network, url]) => ({
      network,
      url,
    })),
    isActive: artist.isActive,
  }
}

export function formToArtistPayload(data: ArtistFormOutput): IArtistPayload {
  return {
    name: data.name,
    legalName: data.legalName,
    genre: data.genre,
    bio: data.bio,
    imageKey: data.image?.key ?? "",
    socialLinks: Object.fromEntries(
      data.socialLinks.map(({ network, url }) => [network, url])
    ),
  }
}
