import type {
  TEventStatus,
  TLineupStatus,
  TPerformanceType,
} from "@/interfaces"

export const EVENT_STATUS_LABELS: Record<TEventStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
}

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
