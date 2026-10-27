import { differenceInCalendarDays, getISODay } from 'date-fns'
import type { WorkoutDay, WorkoutPlan } from '../schemas/workout'
import { parseIsoDate } from '../format/date'

/** Treino marcado para o dia da semana de `date`, ou null em dia de descanso. */
export function workoutForDate<D extends Pick<WorkoutDay, 'weekday'>>(days: D[], date: Date): D | null {
  const weekday = getISODay(date)
  return days.find((d) => d.weekday === weekday) ?? null
}

/** Semana da ficha em que o aluno está (1 na semana de início), limitada à duração. */
export function planWeek(plan: Pick<WorkoutPlan, 'startsOn' | 'durationWeeks'>, date: Date): number {
  const days = differenceInCalendarDays(date, parseIsoDate(plan.startsOn))
  if (days < 0) return 1
  return Math.min(Math.floor(days / 7) + 1, plan.durationWeeks)
}
