export type TTheme = "dark" | "light" | "system"

// O tema que de fato vai pra tela ("system" vira "dark" ou "light")
export type TResolvedTheme = "dark" | "light"

export type TThemeContext = {
  theme: TTheme
  setTheme: (theme: TTheme) => void
}
