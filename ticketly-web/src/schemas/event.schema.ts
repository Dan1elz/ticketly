import { z } from "zod"

import type {
  IEvent,
  IEventPayload,
  IEventUpdatePayload,
  ILineupItemPayload,
} from "@/interfaces"

const timeSchema = z
  .string()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido")

export const stageItemSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "Nome do palco é obrigatório")
    .max(100, "Máximo de 100 caracteres"),
  description: z.string().trim().max(500, "Máximo de 500 caracteres"),
})

export const lineupItemSchema = z
  .object({
    id: z.string().min(1),
    artistId: z.string().min(1, "Escolha um artista"),
    artistName: z.string(),
    artistImageUrl: z.string(),
    stageId: z.string().min(1, "Escolha o palco"),
    performanceType: z.enum(["HEADLINER", "SUPPORT", "DJ"]),
    startTime: timeSchema,
    endTime: timeSchema,
    status: z.enum(["CONFIRMED", "CANCELLED"]),
  })
  .refine(
    (item) =>
      !item.startTime || !item.endTime || item.startTime !== item.endTime,
    { message: "Fim igual ao início", path: ["endTime"] }
  )

export const eventSchema = z
  .object({
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
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário é obrigatório"),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    stages: z
      .array(stageItemSchema)
      .min(1, "Adicione ao menos um palco")
      .superRefine((items, ctx) => {
        const seen = new Set<string>()

        items.forEach((item, index) => {
          const key = item.name.trim().toLowerCase()

          if (key && seen.has(key)) {
            ctx.addIssue({
              code: "custom",
              message: "Palco repetido",
              path: [index, "name"],
            })
          }

          seen.add(key)
        })
      }),
    lineup: z
      .array(lineupItemSchema)
      .min(1, "Adicione ao menos um artista")
      .superRefine((items, ctx) => {
        const seen = new Set<string>()

        items.forEach((item, index) => {
          if (item.artistId && seen.has(item.artistId)) {
            ctx.addIssue({
              code: "custom",
              message: "Artista repetido no lineup",
              path: [index, "artistId"],
            })
          }

          seen.add(item.artistId)
        })
      }),
  })
  .superRefine((data, ctx) => {
    const stageIds = new Set(data.stages.map((stage) => stage.id))

    data.lineup.forEach((item, index) => {
      if (item.stageId && !stageIds.has(item.stageId)) {
        ctx.addIssue({
          code: "custom",
          message: "Esse palco não existe mais: escolha outro",
          path: ["lineup", index, "stageId"],
        })
      }
    })
  })

export type StageItemFormData = z.input<typeof stageItemSchema>
export type LineupItemFormData = z.input<typeof lineupItemSchema>
export type EventFormData = z.input<typeof eventSchema>
export type EventFormOutput = z.output<typeof eventSchema>

// O id é gerado aqui e vai pra API como chave do palco/do item: precisa ser
// novo a cada item, nunca reaproveitado entre formulários
export function newStage(name = ""): StageItemFormData {
  return { id: crypto.randomUUID(), name, description: "" }
}

export function newLineupItem(stageId = ""): LineupItemFormData {
  return {
    id: crypto.randomUUID(),
    artistId: "",
    artistName: "",
    artistImageUrl: "",
    stageId,
    performanceType: "HEADLINER",
    startTime: "",
    endTime: "",
    status: "CONFIRMED",
  }
}

export function newEventForm(): Partial<EventFormData> {
  return {
    name: "",
    venue: "",
    date: undefined,
    time: "21:00",
    status: "DRAFT",
    stages: [newStage("Palco principal")],
    lineup: [],
  }
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
    status: event.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    stages: event.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      description: stage.description ?? "",
    })),
    lineup: event.lineup.map((item) => ({
      id: item.id,
      artistId: item.artist.id,
      artistName: item.artist.name,
      artistImageUrl: item.artist.imageUrl,
      stageId: item.stage.id,
      performanceType: item.performanceType,
      startTime: toTimeInput(item.startTime),
      endTime: toTimeInput(item.endTime),
      status: item.status,
    })),
  }
}

export function formToEventPayload(data: EventFormOutput): IEventPayload {
  const startsAt = atTime(data.date, data.time)

  const stages = data.stages.map((stage, index) => ({
    id: stage.id,
    name: stage.name,
    description: stage.description || null,
    displayOrder: index + 1,
  }))

  const lineup = data.lineup.map((item, index): ILineupItemPayload => {
    const start = resolveTime(startsAt, item.startTime, startsAt)
    const end = resolveTime(
      startsAt,
      item.endTime,
      addMinute(start ?? startsAt)
    )

    return {
      id: item.id,
      artistId: item.artistId,
      stageId: item.stageId,
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
    stages,
    lineup,
  }
}

export function formToEventUpdatePayload(
  data: EventFormOutput
): IEventUpdatePayload {
  return { ...formToEventPayload(data), status: data.status }
}
