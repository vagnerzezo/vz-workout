import { bestTextOn } from '@workspace/core'

export function applyBrand(hex: string) {
  const root = document.documentElement
  const foreground = bestTextOn(hex) // texto escuro ou claro
  root.style.setProperty('--primary', hex)
  root.style.setProperty('--primary-foreground', foreground)
  // Botão escuro dentro do card da marca ("Começar treino"): o texto contrasta com o foreground
  root.style.setProperty('--primary-inverse-foreground', bestTextOn(foreground))
}
