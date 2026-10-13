import { createContext } from "react"

import type {
  ISeat,
  ISeatBatchResult,
  ISeatBlockPayload,
  ISeatQuantityPayload,
  ISector,
  ISectorPayload,
  TSeatAction,
  TSectorUpdatePayload,
} from "@/interfaces"

export type SectorsContextType = {
  sectors: ISector[]
  sectorsEventId: string | null
  sectorsLoading: boolean
  sectorsError: boolean
  loadSectors: (eventId: string) => Promise<void>
  createSector: (eventId: string, data: ISectorPayload) => Promise<ISector>
  updateSector: (id: string, data: TSectorUpdatePayload) => Promise<ISector>
  deleteSector: (id: string) => Promise<void>

  seats: ISeat[]
  seatsSectorId: string | null
  seatsLoading: boolean
  seatsError: boolean
  loadSeats: (sectorId: string) => Promise<ISeat[]>
  createSeatBlock: (
    sectorId: string,
    data: ISeatBlockPayload
  ) => Promise<ISector>
  createSeatQuantity: (
    sectorId: string,
    data: ISeatQuantityPayload
  ) => Promise<ISector>
  /**
   * Aplica a ação em cada assento, um por requisição, em sequência. Não lança
   * por falha de um assento: devolve quantos deram certo e o primeiro erro.
   */
  changeSeats: (
    action: TSeatAction,
    seatIds: string[],
    note: string | null,
    onProgress?: (processed: number, total: number) => void
  ) => Promise<ISeatBatchResult>
}

export const SectorsContext = createContext<SectorsContextType | null>(null)
