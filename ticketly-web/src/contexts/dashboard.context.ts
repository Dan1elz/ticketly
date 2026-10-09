import { createContext } from "react"

import type { IEvent } from "@/interfaces"

export type TDashboardSummary = {
  published: number
  drafts: number
  activeArtists: number
  nextEvents: IEvent[]
}

export type DashboardContextType = {
  summary: TDashboardSummary | null
  loading: boolean
  fetchSummary: () => Promise<void>
}

export const DashboardContext = createContext<DashboardContextType | null>(null)
