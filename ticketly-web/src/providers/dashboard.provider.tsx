import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"

import {
  DashboardContext,
  type DashboardContextType,
  type TDashboardSummary,
} from "@/contexts/dashboard.context"
import { useAuth } from "@/hooks/use-auth"
import { artistService, eventService } from "@/services"

const NEXT_EVENTS = 5

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [summary, setSummary] = useState<TDashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const inFlight = useRef<Promise<void> | null>(null)

  // Só o total interessa nos contadores: perPage 1 deixa a resposta mínima
  const fetchSummary = useCallback(() => {
    // Duas telas (ou o StrictMode) pedindo ao mesmo tempo: reaproveita a mesma requisição
    if (inFlight.current) return inFlight.current

    const run = async () => {
      const auth = token ?? undefined
      setLoading(true)

      try {
        const [published, drafts, artists, next] = await Promise.all([
          eventService.getAll(
            { perPage: 1, filters: { status: "PUBLISHED" } },
            auth
          ),
          eventService.getAll(
            { perPage: 1, filters: { status: "DRAFT" } },
            auth
          ),
          artistService.getAll(
            { perPage: 1, filters: { isActive: true } },
            auth
          ),
          eventService.getAll({ perPage: NEXT_EVENTS }, auth),
        ])

        setSummary({
          published: published.total,
          drafts: drafts.total,
          activeArtists: artists.total,
          nextEvents: next.items,
        })
      } finally {
        setLoading(false)
        inFlight.current = null
      }
    }

    inFlight.current = run()
    return inFlight.current
  }, [token])

  const value = useMemo<DashboardContextType>(
    () => ({ summary, loading, fetchSummary }),
    [summary, loading, fetchSummary]
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}
