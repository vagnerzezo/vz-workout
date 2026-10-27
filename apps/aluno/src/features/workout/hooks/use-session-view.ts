import { useMemo } from 'react'
import type { Exercise, PlannedSet, PrescribedExercise, SessionItem, SessionTemplate } from '@workspace/core'
import { personalRecordKey, planSets, repsFloor, sessionVolume } from '@workspace/core'
import type { SetEntry } from '../store/active-workout'

export type SetView = PlannedSet & {
  entry: SetEntry | undefined
  done: boolean
  suggestion: { kg: number; reps: number }
  isRecord: boolean
}

export type ExerciseView = {
  prescribed: PrescribedExercise
  exercise: Exercise
  item: SessionItem
  sets: SetView[]
  counts: { warmup: number; prep: number; working: number }
}

export type SessionView = {
  exercises: ExerciseView[]
  total: number
  doneCount: number
  volumeKg: number
  /** Primeiro exercício com série por fazer (0-based); o último se tudo estiver feito */
  currentIndex: number
  next: { exercise: ExerciseView; set: SetView } | null
}

function suggestionFor(set: PlannedSet, item: SessionItem, prescribed: PrescribedExercise) {
  const kg = set.kind === 'working' ? (item.targetKg ?? set.previous?.kg ?? 0) : (set.previous?.kg ?? 0)
  const reps = set.previous?.reps ?? repsFloor(prescribed.reps) ?? 10
  return { kg, reps }
}

/** Junta a ficha do dia com o que o aluno já registrou: tudo que a tela mostra sai daqui. */
export function useSessionView(
  template: SessionTemplate | undefined,
  entries: Record<string, SetEntry>,
  extraSets: Record<string, number>,
): SessionView | null {
  return useMemo(() => {
    if (!template) return null
    const library = new Map(template.exercises.map((e) => [e.id, e]))
    const items = new Map(template.items.map((i) => [i.prescribedId, i]))

    const exercises: ExerciseView[] = template.day.exercises.flatMap((prescribed) => {
      const exercise = library.get(prescribed.exerciseId)
      const item = items.get(prescribed.id)
      if (!exercise || !item) return []

      const planned = planSets(prescribed, template.phase, item.previous, extraSets[prescribed.id] ?? 0)
      const doneWorking = planned
        .filter((s) => s.kind === 'working' && entries[s.key]?.doneAt)
        .map((s) => ({ key: s.key, kg: entries[s.key]!.kg ?? 0, reps: entries[s.key]!.reps ?? 0 }))
      const recordKey = personalRecordKey(doneWorking, item.bestE1rm)

      const sets = planned.map((s) => ({
        ...s,
        entry: entries[s.key],
        done: !!entries[s.key]?.doneAt,
        suggestion: suggestionFor(s, item, prescribed),
        isRecord: s.key === recordKey,
      }))
      const count = (kind: PlannedSet['kind']) => sets.filter((s) => s.kind === kind).length
      return [{ prescribed, exercise, item, sets, counts: { warmup: count('warmup'), prep: count('prep'), working: count('working') } }]
    })

    const all = exercises.flatMap((e) => e.sets)
    const done = all.filter((s) => s.done)
    const nextExercise = exercises.find((e) => e.sets.some((s) => !s.done))
    return {
      exercises,
      total: all.length,
      doneCount: done.length,
      volumeKg: sessionVolume(done.map((s) => ({ kg: s.entry?.kg ?? 0, reps: s.entry?.reps ?? 0 }))),
      currentIndex: nextExercise ? exercises.indexOf(nextExercise) : Math.max(exercises.length - 1, 0),
      next: nextExercise ? { exercise: nextExercise, set: nextExercise.sets.find((s) => !s.done)! } : null,
    }
  }, [template, entries, extraSets])
}
