import type { IArtist, IArtistPayload } from "./artist.interface"

export type TEventStatus = "DRAFT" | "PUBLISHED"
export type TPerformanceType = "HEADLINER" | "SUPPORT" | "DJ"
export type TLineupStatus = "CONFIRMED" | "CANCELLED"

export interface ILineupItem {
  id: string
  stage: string
  performanceType: TPerformanceType
  startTime: string | null
  endTime: string | null
  displayOrder: number
  status: TLineupStatus
  artist: Pick<IArtist, "id" | "name" | "imageUrl">
}

export interface IEvent {
  id: string
  name: string
  venue: string
  startsAt: string
  status: TEventStatus
  lineup: ILineupItem[]
  createdAt: string
  updatedAt: string
}

export interface ILineupItemPayload {
  artistId?: string
  artist?: IArtistPayload
  stage: string
  performanceType: TPerformanceType
  startTime: string | null
  endTime: string | null
  displayOrder: number
  status: TLineupStatus
}

export interface IEventPayload {
  name: string
  venue: string
  startsAt: string
  lineup: ILineupItemPayload[]
}

export interface IEventUpdatePayload extends Partial<IEventPayload> {
  status?: TEventStatus
}
