import { useContext } from "react"

import { ArtistsContext } from "@/contexts/artists.context"

export function useArtists() {
  const context = useContext(ArtistsContext)

  if (!context) {
    throw new Error("useArtists must be used within an ArtistsProvider")
  }

  return context
}
