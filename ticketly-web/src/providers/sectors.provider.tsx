import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"

import {
  SectorsContext,
  type SectorsContextType,
} from "@/contexts/sectors.context"
import { useAuth } from "@/hooks/use-auth"
import type {
  ISeat,
  ISeatBatchResult,
  ISeatBlockPayload,
  ISeatQuantityPayload,
  ISector,
  ISectorPayload,
  TSeatAction,
  TSeatCounts,
  TSeatStatus,
  TSectorUpdatePayload,
} from "@/interfaces"
import { ApiError, seatService, sectorService } from "@/services"

type TSeatsState = { sectorId: string | null; items: ISeat[] }

const EMPTY_SEATS: TSeatsState = { sectorId: null, items: [] }

function sortSectors(items: ISector[]): ISector[] {
  return items.toSorted(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
  )
}

function applyMoves(
  counts: TSeatCounts,
  moves: [TSeatStatus, TSeatStatus][]
): TSeatCounts {
  const next = { ...counts }

  moves.forEach(([from, to]) => {
    next[from] -= 1
    next[to] += 1
  })

  return next
}

/**
 * Guarda os setores do show aberto e os assentos do setor aberto. As ações
 * nos assentos atualizam as contagens do setor localmente, sem nova requisição.
 */
export function SectorsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const auth = token ?? undefined

  const [sectors, setSectors] = useState<ISector[]>([])
  const [sectorsEventId, setSectorsEventId] = useState<string | null>(null)
  const [sectorsLoading, setSectorsLoading] = useState(false)
  const [sectorsError, setSectorsError] = useState(false)

  const [seatsState, setSeatsState] = useState<TSeatsState>(EMPTY_SEATS)
  const [seatsLoading, setSeatsLoading] = useState(false)
  const [seatsError, setSeatsError] = useState(false)

  const sectorsRequest = useRef(0)
  const seatsRequest = useRef(0)
  const seatsRef = useRef<TSeatsState>(EMPTY_SEATS)

  const commitSeats = useCallback((next: TSeatsState) => {
    seatsRef.current = next
    setSeatsState(next)
  }, [])

  const replaceSector = useCallback((sector: ISector) => {
    setSectors((current) =>
      current.map((item) => (item.id === sector.id ? sector : item))
    )
  }, [])

  const loadSectors = useCallback(
    async (eventId: string) => {
      const request = ++sectorsRequest.current
      setSectorsLoading(true)
      setSectorsError(false)

      try {
        const items = await sectorService.getByEvent(eventId, auth)
        if (request !== sectorsRequest.current) return

        setSectors(sortSectors(items))
        setSectorsEventId(eventId)
      } catch (err) {
        if (request === sectorsRequest.current) setSectorsError(true)
        throw err
      } finally {
        if (request === sectorsRequest.current) setSectorsLoading(false)
      }
    },
    [auth]
  )

  const createSector = useCallback(
    async (eventId: string, data: ISectorPayload) => {
      const sector = await sectorService.create(eventId, data, auth)

      setSectors((current) => sortSectors([...current, sector]))
      setSectorsEventId(eventId)
      return sector
    },
    [auth]
  )

  const updateSector = useCallback(
    async (id: string, data: TSectorUpdatePayload) => {
      const sector = await sectorService.update(id, data, auth)

      setSectors((current) =>
        sortSectors(current.map((item) => (item.id === id ? sector : item)))
      )
      return sector
    },
    [auth]
  )

  const deleteSector = useCallback(
    async (id: string) => {
      await sectorService.delete(id, auth)
      setSectors((current) => current.filter((item) => item.id !== id))
    },
    [auth]
  )

  const loadSeats = useCallback(
    async (sectorId: string) => {
      const request = ++seatsRequest.current
      setSeatsLoading(true)
      setSeatsError(false)

      try {
        const items = await seatService.getBySector(sectorId, auth)
        if (request === seatsRequest.current) commitSeats({ sectorId, items })

        return items
      } catch (err) {
        if (request === seatsRequest.current) setSeatsError(true)
        throw err
      } finally {
        if (request === seatsRequest.current) setSeatsLoading(false)
      }
    },
    [auth, commitSeats]
  )

  const createSeatBlock = useCallback(
    async (sectorId: string, data: ISeatBlockPayload) => {
      const sector = await seatService.createBlock(sectorId, data, auth)
      replaceSector(sector)

      // A resposta só traz as contagens: busca o mapa com os assentos novos
      await loadSeats(sectorId).catch(() => undefined)
      return sector
    },
    [auth, loadSeats, replaceSector]
  )

  const createSeatQuantity = useCallback(
    async (sectorId: string, data: ISeatQuantityPayload) => {
      const sector = await seatService.createQuantity(sectorId, data, auth)
      replaceSector(sector)

      if (seatsRef.current.sectorId === sectorId) commitSeats(EMPTY_SEATS)
      return sector
    },
    [auth, commitSeats, replaceSector]
  )

  const changeSeats = useCallback(
    async (
      action: TSeatAction,
      seatIds: string[],
      note: string | null,
      onProgress?: (processed: number, total: number) => void
    ): Promise<ISeatBatchResult> => {
      const { sectorId, items } = seatsRef.current
      const before = new Map(items.map((seat) => [seat.id, seat]))
      const updated = new Map<string, ISeat>()
      const moves: [TSeatStatus, TSeatStatus][] = []
      let firstError: string | null = null

      try {
        for (const [index, id] of seatIds.entries()) {
          try {
            const seat = await seatService.changeStatus(action, id, note, auth)
            const previous = before.get(id)

            updated.set(id, seat)
            if (previous) moves.push([previous.status, seat.status])
          } catch (err) {
            firstError ??=
              err instanceof Error ? err.message : "Erro desconhecido"

            // Sem rede ou sem sessão, as próximas também vão falhar
            if (
              err instanceof ApiError &&
              (err.isNetworkError || err.status === 401)
            ) {
              break
            }
          }

          onProgress?.(index + 1, seatIds.length)
        }
      } finally {
        if (updated.size > 0 && sectorId) {
          commitSeats({
            sectorId,
            items: seatsRef.current.items.map(
              (seat) => updated.get(seat.id) ?? seat
            ),
          })
          setSectors((current) =>
            current.map((sector) =>
              sector.id === sectorId
                ? {
                    ...sector,
                    seatCounts: applyMoves(sector.seatCounts, moves),
                  }
                : sector
            )
          )
        }
      }

      return {
        done: updated.size,
        failed: seatIds.length - updated.size,
        firstError,
      }
    },
    [auth, commitSeats]
  )

  const value = useMemo<SectorsContextType>(
    () => ({
      sectors,
      sectorsEventId,
      sectorsLoading,
      sectorsError,
      loadSectors,
      createSector,
      updateSector,
      deleteSector,
      seats: seatsState.items,
      seatsSectorId: seatsState.sectorId,
      seatsLoading,
      seatsError,
      loadSeats,
      createSeatBlock,
      createSeatQuantity,
      changeSeats,
    }),
    [
      sectors,
      sectorsEventId,
      sectorsLoading,
      sectorsError,
      loadSectors,
      createSector,
      updateSector,
      deleteSector,
      seatsState,
      seatsLoading,
      seatsError,
      loadSeats,
      createSeatBlock,
      createSeatQuantity,
      changeSeats,
    ]
  )

  return (
    <SectorsContext.Provider value={value}>{children}</SectorsContext.Provider>
  )
}
