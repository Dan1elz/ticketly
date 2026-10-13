import { createContext } from "react"

import type {
  IEvent,
  IEventPayload,
  IEventUpdatePayload,
  IIndexParams,
} from "@/interfaces"

export type EventsContextType = {
  events: IEvent[]
  total: number
  loading: boolean
  error: boolean
  selectedEvent: IEvent | null
  searchEvents: (params: IIndexParams) => Promise<void>
  reloadEvents: () => Promise<void>
  selectEvent: (id: string) => Promise<void>
  createEvent: (data: IEventPayload) => Promise<IEvent>
  updateEvent: (id: string, data: IEventUpdatePayload) => Promise<IEvent>
  cancelEvent: (id: string) => Promise<IEvent>
  deleteEvent: (id: string) => Promise<void>
}

export const EventsContext = createContext<EventsContextType | null>(null)
