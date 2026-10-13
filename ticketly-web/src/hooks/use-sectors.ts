import { useContext } from "react"

import { SectorsContext } from "@/contexts/sectors.context"

export function useSectors() {
  const context = useContext(SectorsContext)

  if (!context) {
    throw new Error("useSectors must be used within a SectorsProvider")
  }

  return context
}
