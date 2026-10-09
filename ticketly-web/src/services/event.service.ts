import type { IEvent, IEventPayload, IEventUpdatePayload } from "@/interfaces"
import { BaseService } from "./base.service"

class EventService extends BaseService<
  IEvent,
  IEventPayload,
  IEventUpdatePayload
> {
  constructor() {
    super("events")
  }
}

export const eventService = new EventService()
