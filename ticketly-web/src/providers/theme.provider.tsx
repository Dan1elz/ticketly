import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { ThemeContext } from "@/contexts/theme.context"
import type { TResolvedTheme, TTheme, TThemeContext } from "@/types/theme"

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
const THEME_VALUES: TTheme[] = ["dark", "light", "system"]

function isTheme(value: string | null): value is TTheme {
  return value !== null && THEME_VALUES.includes(value as TTheme)
}

function getSystemTheme(): TResolvedTheme {
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light"
}

// Evita que tudo "anime" de uma cor pra outra na troca de tema
function disableTransitionsTemporarily() {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}"
    )
  )
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => style.remove())
    })
  }
}

// Não troca o tema se a pessoa estiver digitando "d" num input
function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true

  return !!target.closest("input, textarea, select, [contenteditable='true']")
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ticketly-theme",
  disableTransitionOnChange = true,
}: {
  children: ReactNode
  defaultTheme?: TTheme
  storageKey?: string
  disableTransitionOnChange?: boolean
}) {
  const [theme, setThemeState] = useState<TTheme>(() => {
    const storedTheme = localStorage.getItem(storageKey)
    return isTheme(storedTheme) ? storedTheme : defaultTheme
  })

  const setTheme = useCallback(
    (nextTheme: TTheme) => {
      localStorage.setItem(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey]
  )

  // Aplica a classe "light"/"dark" no <html> (é o que o Tailwind lê)
  const applyTheme = useCallback(
    (nextTheme: TTheme) => {
      const root = document.documentElement
      const resolvedTheme =
        nextTheme === "system" ? getSystemTheme() : nextTheme
      const restoreTransitions = disableTransitionOnChange
        ? disableTransitionsTemporarily()
        : null

      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)

      restoreTransitions?.()
    },
    [disableTransitionOnChange]
  )

  // Aplica o tema e, se for "system", acompanha quando o SO trocar
  useEffect(() => {
    applyTheme(theme)

    if (theme !== "system") return

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => applyTheme("system")

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, applyTheme])

  // Atalho: tecla "d" alterna entre claro e escuro
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditableTarget(event.target)) return
      if (event.key.toLowerCase() !== "d") return

      setThemeState((currentTheme) => {
        const currentResolved =
          currentTheme === "system" ? getSystemTheme() : currentTheme
        const nextTheme = currentResolved === "dark" ? "light" : "dark"

        localStorage.setItem(storageKey, nextTheme)
        return nextTheme
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [storageKey])

  // Sincroniza entre abas: trocou o tema numa, as outras acompanham
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return
      if (event.key !== storageKey) return

      setThemeState(isTheme(event.newValue) ? event.newValue : defaultTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [defaultTheme, storageKey])

  const value = useMemo<TThemeContext>(
    () => ({ theme, setTheme }),
    [theme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
