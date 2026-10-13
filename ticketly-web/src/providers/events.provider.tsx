import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"

import {
  EventsContext,
  type EventsContextType,
} from "@/contexts/events.context"
import { useAuth } from "@/hooks/use-auth"
import type {
  IEvent,
  IEventPayload,
  IEventUpdatePayload,
  IIndexParams,
} from "@/interfaces"
import { eventService } from "@/services"

/**
 * Guarda a listagem e os shows já carregados: voltar pra lista com os mesmos
 * filtros ou abrir um show que já veio na lista não faz requisição.
 */
export function EventsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const auth = token ?? undefined

  const [events, setEvents] = useState<IEvent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null)

  const lastParams = useRef<IIndexParams | null>(null)
  const lastQueryKey = useRef<string | null>(null)
  const byId = useRef(new Map<string, IEvent>())

  const remember = useCallback((items: IEvent[]) => {
    items.forEach((event) => byId.current.set(event.id, event))
  }, [])

  const fetchList = useCallback(
    async (params: IIndexParams) => {
      const key = JSON.stringify(params)
      lastParams.current = params
      lastQueryKey.current = key
      setLoading(true)
      setError(false)

      try {
        const response = await eventService.getAll(params, auth)
        if (lastQueryKey.current !== key) return

        remember(response.items)
        setEvents(response.items)
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

  const searchEvents = useCallback(
    async (params: IIndexParams) => {
      if (lastQueryKey.current === JSON.stringify(params)) return
      await fetchList(params)
    },
    [fetchList]
  )

  const reloadEvents = useCallback(async () => {
    if (lastParams.current) await fetchList(lastParams.current)
  }, [fetchList])

  const selectEvent = useCallback(
    async (id: string) => {
      const cached = byId.current.get(id)
      setSelectedEvent(cached ?? null)
      if (cached) return

      const event = await eventService.getById(id, auth)
      remember([event])
      setSelectedEvent(event)
    },
    [auth, remember]
  )

  const replace = useCallback(
    (event: IEvent) => {
      remember([event])
      setEvents((current) =>
        current.map((item) => (item.id === event.id ? event : item))
      )
      setSelectedEvent((current) =>
        current?.id === event.id ? event : current
      )
    },
    [remember]
  )

  // A API sempre cria como rascunho: publicar exige ingresso disponível, e um
  // show novo ainda não tem setores
  const createEvent = useCallback(
    async (data: IEventPayload) => {
      const event = await eventService.create(data, auth)

      remember([event])
      lastQueryKey.current = null
      return event
    },
    [auth, remember]
  )

  const updateEvent = useCallback(
    async (id: string, data: IEventUpdatePayload) => {
      const event = await eventService.update(id, data, auth)
      replace(event)

      // Mudou status/data: pode ter saído do filtro atual
      lastQueryKey.current = null
      return event
    },
    [auth, replace]
  )

  const cancelEvent = useCallback(
    async (id: string) => {
      const event = await eventService.cancel(id, auth)
      replace(event)

      lastQueryKey.current = null
      return event
    },
    [auth, replace]
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      await eventService.delete(id, auth)
      byId.current.delete(id)
      await reloadEvents()
    },
    [auth, reloadEvents]
  )

  const value = useMemo<EventsContextType>(
    () => ({
      events,
      total,
      loading,
      error,
      selectedEvent,
      searchEvents,
      reloadEvents,
      selectEvent,
      createEvent,
      updateEvent,
      cancelEvent,
      deleteEvent,
    }),
    [
      events,
      total,
      loading,
      error,
      selectedEvent,
      searchEvents,
      reloadEvents,
      selectEvent,
      createEvent,
      updateEvent,
      cancelEvent,
      deleteEvent,
    ]
  )

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  )
}
