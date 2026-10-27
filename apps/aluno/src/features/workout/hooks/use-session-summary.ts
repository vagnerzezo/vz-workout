import { useMemo } from 'react'
import type { Exercise, Muscle, SessionRecord } from '@workspace/core'
import { muscleLabel, sessionRecord, shortExerciseName, weeklyVolume } from '@workspace/core'
import type { SessionView } from './use-session-view'

export type SummaryRecord = SessionRecord & { exerciseName: string }
export type MuscleSets = { muscle: Muscle; label: string; sets: number }

export type SessionSummary = {
  records: SummaryRecord[]
  muscles: MuscleSets[]
}

/** Recordes e séries válidas por músculo do treino que acabou. */
export function useSessionSummary(view: SessionView | null): SessionSummary | null {
  return useMemo(() => {
    if (!view) return null

    const records = view.exercises.flatMap((ex) => {
      const done = ex.sets
        .filter((s) => s.kind === 'working' && s.done)
        .map((s) => ({ key: s.key, kg: s.entry?.kg ?? 0, reps: s.entry?.reps ?? 0 }))
      const record = sessionRecord(done, ex.item.previous, ex.item.bestE1rm)
      return record ? [{ ...record, exerciseName: shortExerciseName(ex.exercise.name) }] : []
    })

    const library: Record<string, Exercise> = Object.fromEntries(view.exercises.map((ex) => [ex.exercise.id, ex.exercise]))
    const volume = weeklyVolume(
      [
        {
          exercises: view.exercises.map((ex) => ({
            exerciseId: ex.exercise.id,
            workingSets: ex.sets.filter((s) => s.kind === 'working' && s.done).length,
          })),
        },
      ],
      library,
    )
    const muscles = [...volume.entries()]
      .map(([muscle, sets]) => ({ muscle, label: muscleLabel[muscle], sets }))
      .sort((a, b) => b.sets - a.sets)

    return { records, muscles }
  }, [view])
}
