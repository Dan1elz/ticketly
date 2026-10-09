import { z } from "zod"

import { formToArtistPayload, type ArtistFormOutput } from "./artist.schema"

import type {
  IEvent,
  IEventPayload,
  IEventUpdatePayload,
  ILineupItemPayload,
} from "@/interfaces"

const timeSchema = z
  .string()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido")

export const lineupItemSchema = z
  .object({
    artistId: z.string().nullable(),
    newArtist: z.custom<ArtistFormOutput>().nullable(),
    artistName: z.string(),
    artistImageUrl: z.string(),
    stage: z
      .string()
      .trim()
      .min(1, "Palco é obrigatório")
      .max(100, "Máximo de 100 caracteres"),
    performanceType: z.enum(["HEADLINER", "SUPPORT", "DJ"]),
    startTime: timeSchema,
    endTime: timeSchema,
    status: z.enum(["CONFIRMED", "CANCELLED"]),
  })
  .refine((item) => !!item.artistId || !!item.newArtist, {
    message: "Escolha um artista",
    path: ["artistName"],
  })
  .refine(
    (item) =>
      !item.startTime || !item.endTime || item.startTime !== item.endTime,
    { message: "Fim igual ao início", path: ["endTime"] }
  )

export const eventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(160, "Máximo de 160 caracteres"),
  venue: z
    .string()
    .trim()
    .min(1, "Local é obrigatório")
    .max(160, "Máximo de 160 caracteres"),
  date: z.date({ error: "Data é obrigatória" }),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário é obrigatório"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  lineup: z
    .array(lineupItemSchema)
    .min(1, "Adicione ao menos um artista")
    .superRefine((items, ctx) => {
      const seen = new Set<string>()

      items.forEach((item, index) => {
        const key = item.artistId ?? `new:${item.artistName.toLowerCase()}`

        if (seen.has(key)) {
          ctx.addIssue({
            code: "custom",
            message: "Artista repetido no lineup",
            path: [index, "artistName"],
          })
        }

        seen.add(key)
      })
    }),
})

export type LineupItemFormData = z.input<typeof lineupItemSchema>
export type EventFormData = z.input<typeof eventSchema>
export type EventFormOutput = z.output<typeof eventSchema>

export const emptyLineupItem: LineupItemFormData = {
  artistId: null,
  newArtist: null,
  artistName: "",
  artistImageUrl: "",
  stage: "Main Stage",
  performanceType: "HEADLINER",
  startTime: "",
  endTime: "",
  status: "CONFIRMED",
}

export const emptyEventForm: Partial<EventFormData> = {
  name: "",
  venue: "",
  date: undefined,
  time: "21:00",
  status: "DRAFT",
  lineup: [],
}

function toTimeInput(value: string | Date | null): string {
  if (!value) return ""

  const date = new Date(value)
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")

  return `${hh}:${mm}`
}

function atTime(day: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number)
  const date = new Date(day)
  date.setHours(hours, minutes, 0, 0)

  return date
}

function addDay(date: Date): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)

  return next
}

function addMinute(date: Date): Date {
  return new Date(date.getTime() + 60_000)
}

// Show que vira a noite: horário menor que a referência cai no dia seguinte
function resolveTime(startsAt: Date, time: string, after: Date): Date | null {
  if (!time) return null

  const date = atTime(startsAt, time)

  return date < after ? addDay(date) : date
}

export function eventToForm(event: IEvent): EventFormData {
  const startsAt = new Date(event.startsAt)

  return {
    name: event.name,
    venue: event.venue,
    date: startsAt,
    time: toTimeInput(startsAt),
    status: event.status,
    lineup: event.lineup.map((item) => ({
      artistId: item.artist.id,
      newArtist: null,
      artistName: item.artist.name,
      artistImageUrl: item.artist.imageUrl,
      stage: item.stage,
      performanceType: item.performanceType,
      startTime: toTimeInput(item.startTime),
      endTime: toTimeInput(item.endTime),
      status: item.status,
    })),
  }
}

export function formToEventPayload(data: EventFormOutput): IEventPayload {
  const startsAt = atTime(data.date, data.time)

  const lineup = data.lineup.map((item, index): ILineupItemPayload => {
    const start = resolveTime(startsAt, item.startTime, startsAt)
    const end = resolveTime(
      startsAt,
      item.endTime,
      addMinute(start ?? startsAt)
    )

    return {
      ...(item.artistId
        ? { artistId: item.artistId }
        : {
            artist: item.newArtist
              ? formToArtistPayload(item.newArtist)
              : undefined,
          }),
      stage: item.stage,
      performanceType: item.performanceType,
      startTime: start?.toISOString() ?? null,
      endTime: end?.toISOString() ?? null,
      displayOrder: index + 1,
      status: item.status,
    }
  })

  return {
    name: data.name,
    venue: data.venue,
    startsAt: startsAt.toISOString(),
    lineup,
  }
}

export function formToEventUpdatePayload(
  data: EventFormOutput
): IEventUpdatePayload {
  return { ...formToEventPayload(data), status: data.status }
}
