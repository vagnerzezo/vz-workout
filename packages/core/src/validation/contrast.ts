// Regras do WCAG 2.2 para contraste: https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio

const INK = '#0b0c0e'
const PAPER = '#ffffff'

function channel(c: number) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const v = hex.replace('#', '')
  const r = parseInt(v.slice(0, 2), 16)
  const g = parseInt(v.slice(2, 4), 16)
  const b = parseInt(v.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Texto escuro (#0B0C0E) ou branco sobre a cor da marca: o que der mais contraste. */
export function bestTextOn(hex: string): string {
  return contrastRatio(hex, INK) >= contrastRatio(hex, PAPER) ? INK : PAPER
}
