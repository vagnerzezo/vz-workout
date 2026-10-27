import type { PrescribedExercise, Phase } from '../schemas/workout'
import type { PreviousSet, SetKind } from '../schemas/session'

/** Séries válidas depois do multiplicador da fase (deload ×0,5…), sem zerar. */
export function applyPhase(workingSets: number, phase?: Pick<Phase, 'setMultiplier'> | null): number {
  return Math.max(1, Math.round(workingSets * (phase?.setMultiplier ?? 1)))
}

export type PlannedSet = {
  key: string // estável entre sessões e no envio para a API: "day_c_1:v2"
  prescribedId: string
  kind: SetKind
  label: string // "A", "P" ou o número da válida
  index: number // posição na tabela do exercício
  previous: PreviousSet | null
}

const prefix: Record<SetKind, string> = { warmup: 'w', prep: 'p', working: 'v' }
const badge: Record<SetKind, (n: number) => string> = { warmup: () => 'A', prep: () => 'P', working: (n) => String(n) }

/**
 * Séries de um exercício na ordem da tabela: aquecimento, preparatórias e válidas,
 * mais as válidas que o aluno adicionou no dia.
 */
export function planSets(
  p: Pick<PrescribedExercise, 'id' | 'warmupSets' | 'prepSets' | 'workingSets'>,
  phase: Pick<Phase, 'setMultiplier'> | null,
  previous: PreviousSet[] = [],
  extraWorking = 0,
): PlannedSet[] {
  const counts: [SetKind, number][] = [
    ['warmup', p.warmupSets],
    ['prep', p.prepSets],
    ['working', applyPhase(p.workingSets, phase) + extraWorking],
  ]
  const sets: PlannedSet[] = []
  for (const [kind, count] of counts) {
    const prevOfKind = previous.filter((s) => s.kind === kind)
    for (let n = 1; n <= count; n++) {
      sets.push({
        key: `${p.id}:${prefix[kind]}${n}`,
        prescribedId: p.id,
        kind,
        label: badge[kind](n),
        index: sets.length,
        previous: prevOfKind[n - 1] ?? null,
      })
    }
  }
  return sets
}

/** Menor número da faixa de repetições: "6–9" → 6 */
export function repsFloor(range: string): number | null {
  const n = parseInt(range, 10)
  return Number.isFinite(n) ? n : null
}

/** 1RM estimado pela fórmula de Epley. Uma repetição é a própria carga. */
export function estimatedOneRepMax(kg: number, reps: number): number {
  if (reps <= 0 || kg <= 0) return 0
  return reps === 1 ? kg : kg * (1 + reps / 30)
}

/**
 * Chave da série que bateu recorde no exercício: a de maior 1RM estimado entre as feitas hoje,
 * se passar do melhor histórico. No máximo um recorde por exercício.
 */
export function personalRecordKey(
  done: { key: string; kg: number; reps: number }[],
  bestE1rm: number | null,
): string | null {
  let best: { key: string; e1rm: number } | null = null
  for (const s of done) {
    const e1rm = estimatedOneRepMax(s.kg, s.reps)
    if (!best || e1rm > best.e1rm) best = { key: s.key, e1rm }
  }
  if (!best || best.e1rm <= (bestE1rm ?? 0)) return null
  return best.key
}

/** Volume em kg: carga × repetições de todas as séries feitas. */
export const sessionVolume = (done: { kg: number; reps: number }[]) =>
  done.reduce((sum, s) => sum + s.kg * s.reps, 0)

/** "AH" para "Agachamento Hack (Máquina)" */
export function exerciseInitials(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

/** "Agachamento Hack" para "Agachamento Hack (Máquina)" */
export const shortExerciseName = (name: string) => name.replace(/\s*\(.*?\)\s*/g, ' ').trim()
