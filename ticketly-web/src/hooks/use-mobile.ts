import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// O React "assina" a media query: chama o callback quando a tela cruza o breakpoint
function subscribe(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)

  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
