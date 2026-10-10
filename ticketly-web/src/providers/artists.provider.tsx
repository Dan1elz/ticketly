import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"

import {
  ArtistsContext,
  type ArtistsContextType,
} from "@/contexts/artists.context"
import { useAuth } from "@/hooks/use-auth"
import type {
  IArtist,
  IArtistPayload,
  IArtistUpdatePayload,
  IIndexParams,
} from "@/interfaces"
import { artistService, uploadService } from "@/services"

const LOOKUP_PER_PAGE = 20

/**
 * Guarda a listagem e os artistas já carregados: voltar pra lista com os
 * mesmos filtros ou abrir um artista que já veio na lista não faz requisição.
 */
export function ArtistsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const auth = token ?? undefined

  const [artists, setArtists] = useState<IArtist[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<IArtist | null>(null)

  const lastParams = useRef<IIndexParams | null>(null)
  const lastQueryKey = useRef<string | null>(null)
  const byId = useRef(new Map<string, IArtist>())
  const lookupCache = useRef(new Map<string, IArtist[]>())

  const remember = useCallback((items: IArtist[]) => {
    items.forEach((artist) => byId.current.set(artist.id, artist))
  }, [])

  const invalidate = useCallback(() => {
    lastQueryKey.current = null
    lookupCache.current.clear()
  }, [])

  const fetchList = useCallback(
    async (params: IIndexParams) => {
      const key = JSON.stringify(params)
      lastParams.current = params
      lastQueryKey.current = key
      setLoading(true)
      setError(false)

      try {
        const response = await artistService.getAll(params, auth)
        if (lastQueryKey.current !== key) return

        remember(response.items)
        setArtists(response.items)
        setTotal(response.total)
      } catch (err) {
        if (lastQueryKey.current === key) {
          lastQueryKey.current = null
          setError(true)
        }
        throw err
      } finally {
        if (lastQueryKey.current === key || lastQueryKey.current === null) {
          setLoading(false)
        }
      }
    },
    [auth, remember]
  )

  const searchArtists = useCallback(
    async (params: IIndexParams) => {
      if (lastQueryKey.current === JSON.stringify(params)) return
      await fetchList(params)
    },
    [fetchList]
  )

  const reloadArtists = useCallback(async () => {
    if (lastParams.current) await fetchList(lastParams.current)
  }, [fetchList])

  const getArtist = useCallback(
    async (id: string) => {
      const cached = byId.current.get(id)
      if (cached) return cached

      const artist = await artistService.getById(id, auth)
      remember([artist])
      return artist
    },
    [auth, remember]
  )

  const selectArtist = useCallback(
    async (id: string) => {
      const cached = byId.current.get(id)
      setSelectedArtist(cached ?? null)
      if (cached) return

      setSelectedArtist(await getArtist(id))
    },
    [getArtist]
  )

  const lookupArtists = useCallback(
    async (search: string) => {
      const term = search.trim().toLowerCase()
      const cached = lookupCache.current.get(term)
      if (cached) return cached

      const response = await artistService.getAll(
        { perPage: LOOKUP_PER_PAGE, filters: { search: term, isActive: true } },
        auth
      )
      remember(response.items)
      lookupCache.current.set(term, response.items)
      return response.items
    },
    [auth, remember]
  )

  const createArtist = useCallback(
    async (data: IArtistPayload) => {
      const artist = await artistService.create(data, auth)
      remember([artist])
      invalidate()
      return artist
    },
    [auth, remember, invalidate]
  )

  const updateArtist = useCallback(
    async (id: string, data: IArtistUpdatePayload) => {
      const artist = await artistService.update(id, data, auth)
      remember([artist])
      invalidate()
      setArtists((current) =>
        current.map((item) => (item.id === id ? artist : item))
      )
      setSelectedArtist((current) => (current?.id === id ? artist : current))
      return artist
    },
    [auth, remember, invalidate]
  )

  const deleteArtist = useCallback(
    async (id: string) => {
      await artistService.delete(id, auth)
      byId.current.delete(id)
      invalidate()
      await reloadArtists()
    },
    [auth, invalidate, reloadArtists]
  )

  const uploadArtistImage = useCallback(
    (file: File) => uploadService.uploadArtistImage(file, auth),
    [auth]
  )

  const value = useMemo<ArtistsContextType>(
    () => ({
      artists,
      total,
      loading,
      error,
      selectedArtist,
      searchArtists,
      reloadArtists,
      selectArtist,
      getArtist,
      lookupArtists,
      createArtist,
      updateArtist,
      deleteArtist,
      uploadArtistImage,
    }),
    [
      artists,
      total,
      loading,
      error,
      selectedArtist,
      searchArtists,
      reloadArtists,
      selectArtist,
      getArtist,
      lookupArtists,
      createArtist,
      updateArtist,
      deleteArtist,
      uploadArtistImage,
    ]
  )

  return (
    <ArtistsContext.Provider value={value}>{children}</ArtistsContext.Provider>
  )
}
