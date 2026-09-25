import { createContext } from "react"

import type { TThemeContext } from "@/types/theme"

export const ThemeContext = createContext<TThemeContext | null>(null)
