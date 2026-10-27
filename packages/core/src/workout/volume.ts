import type { Exercise, Muscle } from '../schemas/workout'

type DayLike = { exercises: { exerciseId: string; workingSets: number }[] }

/** Séries por músculo: o principal conta 1 e cada secundário conta 0,5. */
export function weeklyVolume(days: DayLike[], library: Record<string, Exercise>, setMultiplier = 1) {
  const total = new Map<Muscle, number>()
  const add = (m: Muscle, v: number) => total.set(m, (total.get(m) ?? 0) + v)

  for (const day of days) {
    for (const item of day.exercises) {
      const ex = library[item.exerciseId]
      if (!ex || item.workingSets <= 0) continue
      const sets = Math.max(1, Math.round(item.workingSets * setMultiplier))
      add(ex.primary, sets)
      ex.secondary.forEach((m) => add(m, sets * 0.5))
    }
  }
  return total
}

export type VolumeStatus = 'low' | 'ok' | 'high'
export const volumeStatus = (sets: number, min = 10, max = 20): VolumeStatus =>
  sets < min ? 'low' : sets > max ? 'high' : 'ok'
