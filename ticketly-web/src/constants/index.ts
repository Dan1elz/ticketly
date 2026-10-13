import type {
  TEventStatus,
  TLineupStatus,
  TPerformanceType,
  TSeatStatus,
  TSectorType,
} from "@/interfaces"

export const EVENT_STATUS_LABELS: Record<TEventStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  CANCELLED: "Cancelado",
}

// O que dá pra escolher no formulário: cancelar é uma ação própria
export const EVENT_EDITABLE_STATUS_LABELS = {
  DRAFT: EVENT_STATUS_LABELS.DRAFT,
  PUBLISHED: EVENT_STATUS_LABELS.PUBLISHED,
} as const

export const SECTOR_TYPE_LABELS: Record<TSectorType, string> = {
  SEATED: "Lugar marcado",
  GENERAL_ADMISSION: "Pista",
}

export const SEAT_STATUS_LABELS: Record<TSeatStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  BLOCKED: "Bloqueado",
  CANCELLED: "Cancelado",
}

export const SEAT_STATUSES: TSeatStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "BLOCKED",
  "CANCELLED",
]

export const SECTOR_COLOR_PRESETS = [
  "#7C3AED",
  "#3B82F6",
  "#0EA5E9",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#64748B",
]

export const PERFORMANCE_TYPE_LABELS: Record<TPerformanceType, string> = {
  HEADLINER: "Atração principal",
  SUPPORT: "Abertura",
  DJ: "DJ set",
}

export const LINEUP_STATUS_LABELS: Record<TLineupStatus, string> = {
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
}

export const ACTIVE_FILTER_LABELS = {
  all: "Todos",
  true: "Ativos",
  false: "Inativos",
} as const

export const SOCIAL_NETWORK_LABELS: Record<string, string> = {
  instagram: "Instagram",
  spotify: "Spotify",
  youtube: "YouTube",
  tiktok: "TikTok",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
  x: "X (Twitter)",
  site: "Site oficial",
}

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/avif",
]
export const ACCEPTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".jfif",
  ".png",
  ".webp",
  ".avif",
]
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export const DEFAULT_PER_PAGE = 10
