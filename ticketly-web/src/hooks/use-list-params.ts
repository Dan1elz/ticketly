import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

import { DEFAULT_PER_PAGE } from "@/constants"

/**
 * Página e filtros da listagem ficam na URL: dá pra recarregar, voltar
 * e compartilhar o link sem perder a busca.
 */
export function useListParams<TFilter extends string>(filterKeys: TFilter[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const perPage = DEFAULT_PER_PAGE

  const filters = Object.fromEntries(
    filterKeys.map((key) => [key, searchParams.get(key) ?? ""])
  ) as Record<TFilter, string>

  const setFilter = useCallback(
    (key: TFilter, value: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)

          if (value) next.set(key, value)
          else next.delete(key)

          next.delete("page")
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)

        if (nextPage > 1) next.set("page", String(nextPage))
        else next.delete("page")

        return next
      })
    },
    [setSearchParams]
  )

  const clearFilters = useCallback(
    () => setSearchParams(new URLSearchParams(), { replace: true }),
    [setSearchParams]
  )

  const hasFilters = filterKeys.some((key) => !!filters[key])

  return {
    page,
    perPage,
    filters,
    setFilter,
    setPage,
    clearFilters,
    hasFilters,
  }
}
