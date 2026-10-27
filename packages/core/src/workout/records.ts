import type { PreviousSet } from '../schemas/session'
import { estimatedOneRepMax, personalRecordKey } from './session'

type DoneSet = { key: string; kg: number; reps: number }

export type RecordKind = 'load' | 'reps' | 'best'

export const recordKindLabel: Record<RecordKind, string> = {
  load: 'Maior carga',
  reps: 'Mais repetições',
  best: 'Melhor marca',
}

export type SessionRecord = {
  kind: RecordKind
  now: { kg: number; reps: number }
  before: { kg: number; reps: number } | null
}

/**
 * Recorde do exercício neste treino, com a mesma regra do selo "PR" da tela do treino
 * (maior 1RM estimado que o histórico), explicado do jeito que o aluno entende:
 * mais carga, mais repetições com a mesma carga, ou só uma marca melhor no geral.
 */
export function sessionRecord(done: DoneSet[], previous: PreviousSet[], bestE1rm: number | null): SessionRecord | null {
  const key = personalRecordKey(done, bestE1rm)
  const set = done.find((s) => s.key === key)
  if (!set) return null

  const working = previous.filter((s) => s.kind === 'working')
  const before = working.reduce<PreviousSet | null>(
    (best, s) => (!best || estimatedOneRepMax(s.kg, s.reps) > estimatedOneRepMax(best.kg, best.reps) ? s : best),
    null,
  )
  const maxKgBefore = Math.max(0, ...working.map((s) => s.kg))
  const repsAtSameKg = Math.max(0, ...working.filter((s) => s.kg === set.kg).map((s) => s.reps))

  const kind: RecordKind = set.kg > maxKgBefore ? 'load' : set.kg === maxKgBefore && set.reps > repsAtSameKg ? 'reps' : 'best'
  return {
    kind,
    now: { kg: set.kg, reps: set.reps },
    before: before && { kg: before.kg, reps: before.reps },
  }
}

/** Escala de esforço percebido (RPE) de 1 a 10. */
export const effortLabel: Record<number, string> = {
  1: 'Muito leve', 2: 'Leve', 3: 'Leve', 4: 'Moderado', 5: 'Moderado',
  6: 'Puxado', 7: 'Puxado', 8: 'Difícil', 9: 'Muito difícil', 10: 'Máximo',
}
