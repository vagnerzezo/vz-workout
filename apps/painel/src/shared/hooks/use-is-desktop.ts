import { useSyncExternalStore } from 'react'

const query = '(min-width: 1024px)' // lg: a mesma largura em que a sidebar aparece

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** Para quando a composição muda de verdade (sheet no desktop, página no celular), não só o CSS. */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true)
}
