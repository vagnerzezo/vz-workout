import type { PrescribedExercise } from '../schemas/workout'

type DayLike = { exercises: Pick<PrescribedExercise, 'warmupSets' | 'prepSets' | 'workingSets' | 'restSeconds'>[] }

export const SET_SECONDS = 40 // execução de uma série
export const WARMUP_REST_SECONDS = 60 // pausa curta depois do aquecimento
export const TRANSITION_SECONDS = 60 // troca de aparelho entre exercícios

/**
 * Duração estimada do treino em minutos, arredondada para 5 min:
 * aquecimento (série + pausa curta), preparatórias e válidas (série + descanso prescrito)
 * e a troca de aparelho entre exercícios.
 */
export function estimateDuration(day: DayLike): number {
  let seconds = 0
  for (const ex of day.exercises) {
    seconds += ex.warmupSets * (SET_SECONDS + WARMUP_REST_SECONDS)
    seconds += (ex.prepSets + ex.workingSets) * (SET_SECONDS + ex.restSeconds)
  }
  seconds += Math.max(day.exercises.length - 1, 0) * TRANSITION_SECONDS
  return Math.round(seconds / 60 / 5) * 5
}
