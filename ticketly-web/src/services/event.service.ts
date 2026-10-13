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

  async cancel(id: string, token?: string): Promise<IEvent> {
    const response = await this.apiService.post<IEvent>(
      `${this.endpoint}/${id}/cancel`,
      undefined,
      token
    )
    return response.data
  }
}

export const eventService = new EventService()
