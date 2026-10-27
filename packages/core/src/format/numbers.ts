const intFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const litersFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const decimalFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** 1240 → "1.240" */
export const formatInt = (n: number) => intFormat.format(n)

/** 1250 ml → "1,25 L" · 1500 → "1,5 L" · 3500 → "3,5 L" · 2000 → "2 L" */
export const formatLiters = (ml: number) => `${litersFormat.format(ml / 1000)} L`

/** 82.4 → "82,4" */
export const formatDecimal = (n: number) => decimalFormat.format(n)

/** 95 → "1h 35min" · 45 → "45min" · 120 → "2h" */
export function formatDuration(minutes: number): string {
  const total = Math.round(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

const kgFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** 85 → "85" · 82.5 → "82,5" */
export const formatKg = (kg: number) => kgFormat.format(kg)

/** "82,5" ou "82.5" → 82.5; vazio ou inválido → null */
export function parseDecimal(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(n) ? n : null
}

/** Relógio: 72 → "01:12" · 3725 → "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(sec / 3600)
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Descanso prescrito: 150 → "2min 30s" · 60 → "1min" · 45 → "45s" */
export function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}min` : `${m}min ${s}s`
}

const tonsFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Volume em toneladas: 8400 → "8,4 t" */
export const formatTons = (kg: number) => `${tonsFormat.format(kg / 1000)} t`

/** Diferença de carga: 2.5 → "+2,5" · 0 → "=" · -2.5 → "−2,5" */
export function formatDeltaKg(kg: number): string {
  if (kg === 0) return '='
  return `${kg > 0 ? '+' : '−'}${formatKg(Math.abs(kg))}`
}

const brlFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 600 → "R$ 600,00" (com espaço comum, não o espaço fino do Intl) */
export const formatBRL = (reais: number) => brlFormat.format(reais).replace(/\s/g, ' ')
