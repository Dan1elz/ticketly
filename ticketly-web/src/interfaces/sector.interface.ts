export type TSectorType = "SEATED" | "GENERAL_ADMISSION"

export type TSeatStatus =
  "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED" | "CANCELLED"

export type TSeatCounts = Record<TSeatStatus, number> & { total: number }

export interface ISector {
  id: string
  event: { id: string }
  name: string
  type: TSectorType
  description: string | null
  priceCents: number
  color: string
  displayOrder: number
  maxPerOrder: number | null
  seatCounts: TSeatCounts
  createdAt: string
  updatedAt: string
}

export interface ISectorPayload {
  name: string
  type: TSectorType
  description: string | null
  priceCents: number
  color: string
  displayOrder: number
  maxPerOrder: number | null
}

// O tipo não muda depois de criado: a API recusa o campo no PATCH
export type TSectorUpdatePayload = Partial<Omit<ISectorPayload, "type">>

export interface ISeat {
  id: string
  row: string | null
  number: number
  gridRow: number | null
  gridColumn: number | null
  isAccessible: boolean
  status: TSeatStatus
  statusNote: string | null
  statusChangedAt: string | null
  statusChangedBy: { id: string; name: string } | null
}

export interface ISeatBlockPayload {
  rows: string[]
  numberStart: number
  numberEnd: number
  gridRowStart: number
  gridColumnStart: number
  isAccessible: boolean
}

export interface ISeatQuantityPayload {
  quantity: number
}

export interface ISeatNotePayload {
  note: string
}

export type TSeatAction = "block" | "unblock" | "cancel"

export interface ISeatBatchResult {
  done: number
  failed: number
  firstError: string | null
}
