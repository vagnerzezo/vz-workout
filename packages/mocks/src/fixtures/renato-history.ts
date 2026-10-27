import { differenceInCalendarDays } from 'date-fns'
import type { HistoryExercise, HistorySession, WorkoutDay, WorkoutSession } from '@workspace/core'
import { estimatedOneRepMax, sessionRecord, sessionVolume, toIsoDate, workoutForDate } from '@workspace/core'
import { mondayOf } from './renato'
import { exerciseLibrary, renatoPlan } from './renato-plan'
import { sessionItem, workingKg } from './renato-sessions'

export const HISTORY_WEEKS = 10

/** Duração e volume típicos de cada treino, como no canvas */
const profile: Record<string, { min: number; kg: number }> = {
  A: { min: 50, kg: 8000 },
  B: { min: 49, kg: 7100 },
  C: { min: 58, kg: 9600 },
  D: { min: 55, kg: 7900 },
  E: { min: 60, kg: 10800 },
}

const comments: Record<string, string> = {
  A: 'Senti o ombro tranquilo hoje. Subi o supino inclinado.',
  D: 'Treinei mais cedo, academia vazia.',
}

const library = new Map(exerciseLibrary.map((e) => [e.id, e]))
const roundTo = (n: number, step: number) => Math.round(n / step) * step

/**
 * Carga da melhor série N semanas atrás. Cada exercício sobe 2,5 kg a cada 6 semanas,
 * em semanas diferentes (`offset`), para os recordes aparecerem espalhados como no canvas.
 */
function kgWeeksAgo(exerciseId: string, weeksAgo: number, offset: number) {
  const base = workingKg[exerciseId] ?? 20
  return Math.max(roundTo(base * 0.6, 2.5), base - 2.5 * Math.floor((weeksAgo + offset) / 6))
}

function generatedExercises(day: WorkoutDay, weeksAgo: number): HistoryExercise[] {
  return day.exercises.map((p, i) => {
    const kg = kgWeeksAgo(p.exerciseId, weeksAgo, i)
    const isFirst = weeksAgo >= HISTORY_WEEKS - 1
    const deltaKg = isFirst ? null : kg - kgWeeksAgo(p.exerciseId, weeksAgo + 1, i)
    return {
      name: library.get(p.exerciseId)?.name ?? p.exerciseId,
      best: { kg, reps: parseInt(p.reps.split('–')[1] ?? p.reps, 10) || 10 },
      deltaKg,
      isRecord: !!deltaKg && deltaKg > 0,
    }
  })
}

/**
 * Treinos das últimas semanas, seguindo os dias da ficha até ontem.
 * Algumas datas antigas ficam sem treino, para o calendário não parecer perfeito demais.
 */
export function generatedHistory(today: Date): HistorySession[] {
  const thisMonday = mondayOf(today)
  const sessions: HistorySession[] = []
  for (let back = 1; back <= HISTORY_WEEKS * 7; back++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back)
    const day = workoutForDate(renatoPlan.days, date)
    if (!day) continue
    const weeksAgo = Math.ceil(differenceInCalendarDays(thisMonday, mondayOf(date)) / 7)
    if (weeksAgo > 0 && date.getDate() % 11 === 0) continue // faltou

    const iso = toIsoDate(date)
    const p = profile[day.letter]!
    const exercises = generatedExercises(day, weeksAgo)
    sessions.push({
      id: `hist_${iso}`,
      dayId: day.id,
      letter: day.letter,
      name: day.name,
      date: iso,
      durationMin: p.min + ((date.getDate() * 7) % 5) - 2,
      volumeKg: roundTo(p.kg * (1 - weeksAgo * 0.01), 10),
      comment: weeksAgo === 0 ? (comments[day.letter] ?? null) : null,
      exercises,
    })
  }
  return sessions
}

/** Treino salvo pelo app, no formato do histórico, com as mesmas regras do resumo. */
export function historyFromSession(s: WorkoutSession): HistorySession | null {
  const day = renatoPlan.days.find((d) => d.id === s.dayId)
  if (!day) return null
  const done = s.sets.filter((x) => x.doneAt)

  const exercises = day.exercises.flatMap((p): HistoryExercise[] => {
    const working = done.filter((x) => x.prescribedId === p.id && x.kind === 'working')
    if (working.length === 0) return []
    const best = working.reduce((a, b) => (estimatedOneRepMax(b.kg, b.reps) > estimatedOneRepMax(a.kg, a.reps) ? b : a))
    const item = sessionItem(p)
    const prevMax = Math.max(0, ...item.previous.filter((x) => x.kind === 'working').map((x) => x.kg))
    return [
      {
        name: library.get(p.exerciseId)?.name ?? p.exerciseId,
        best: { kg: best.kg, reps: best.reps },
        deltaKg: prevMax ? best.kg - prevMax : null,
        isRecord: !!sessionRecord(working, item.previous, item.bestE1rm),
      },
    ]
  })

  return {
    id: s.id,
    dayId: day.id,
    letter: day.letter,
    name: day.name,
    date: toIsoDate(new Date(s.finishedAt)),
    durationMin: Math.round((Date.parse(s.finishedAt) - Date.parse(s.startedAt)) / 60_000),
    volumeKg: sessionVolume(done),
    comment: s.comment,
    exercises,
  }
}
