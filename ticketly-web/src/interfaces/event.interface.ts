import type { IArtist } from "./artist.interface"

export type TEventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED"
export type TPerformanceType = "HEADLINER" | "SUPPORT" | "DJ"
export type TLineupStatus = "CONFIRMED" | "CANCELLED"

export interface IEventStage {
  id: string
  name: string
  description: string | null
  displayOrder: number
}

export interface ILineupItem {
  id: string
  stage: Pick<IEventStage, "id" | "name">
  performanceType: TPerformanceType
  startTime: string | null
  endTime: string | null
  displayOrder: number
  status: TLineupStatus
  artist: Pick<IArtist, "id" | "name" | "imageKey" | "imageUrl">
}

export interface IEvent {
  id: string
  name: string
  venue: string
  startsAt: string
  status: TEventStatus
  stages: IEventStage[]
  lineup: ILineupItem[]
  createdAt: string
  updatedAt: string
}

export interface ILineupItemPayload {
  id: string
  artistId: string
  stageId: string
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
  stages: IEventStage[]
  lineup: ILineupItemPayload[]
}

export interface IEventUpdatePayload extends Partial<IEventPayload> {
  status?: Exclude<TEventStatus, "CANCELLED">
}
