import type { HomeSummary, Me, WaterLog, WeeklyActivity, WeekDay, WorkoutPlan } from '@workspace/core'
import { estimateDuration, toIsoDate, workoutForDate } from '@workspace/core'
import { getISODay } from 'date-fns'

/** O personal do Renato. Para trocar o nome do treinador na API simulada, mude só aqui. */
export const coachName = 'Kaue Oliveira'
export const coachFirstName = coachName.split(' ')[0]!

export const renatoMe: Me = {
  id: 'stu_renato',
  firstName: 'Renato',
  fullName: 'Renato Alves',
  branding: { appName: 'Team Oliveira', brandColor: '#A3FF12' },
  access: 'active',
}

/** Segunda-feira da semana de `today` */
export function mondayOf(today: Date) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/**
 * Treinos da ficha já feitos nesta semana: o Renato cumpriu todos os dias de treino
 * anteriores a hoje. Assim a Home e a lista de treinos contam a mesma história em qualquer dia.
 */
export function doneDayIds(plan: WorkoutPlan, today: Date): string[] {
  const todayWeekday = getISODay(today)
  return plan.days.filter((d) => d.weekday < todayWeekday).map((d) => d.id)
}

/** Sessão concluída no app: o dia da ficha e a data em que o aluno treinou de fato. */
export type FinishedSession = { dayId: string; date: string }

/**
 * Semana na faixa da Home: os dias do fixture contam na data marcada na ficha;
 * os treinos concluídos no app contam na data em que foram feitos (o aluno pode trocar o dia).
 */
export function renatoWeek(plan: WorkoutPlan | null, today: Date, finished: FinishedSession[] = []): WeekDay[] {
  const monday = mondayOf(today)
  const fixtureDone = new Set(plan ? doneDayIds(plan, today) : [])
  const finishedDates = new Set(finished.map((f) => f.date))
  return Array.from({ length: 7 }, (_, i) => {
    const date = toIsoDate(addDays(monday, i))
    const trained = !!plan?.days.some((d) => d.weekday === i + 1 && fixtureDone.has(d.id)) || finishedDates.has(date)
    return { date, trained }
  })
}

export function renatoActivity(today: Date): WeeklyActivity[] {
  const monday = mondayOf(today)
  const durations = [180, 210, 150, 240, 200, 230, 260, 95]
  const volumes = [8200, 9100, 7600, 10400, 9300, 9900, 11200, 4100]
  const reps = [520, 580, 470, 640, 600, 610, 690, 250]
  return durations.map((durationMin, i) => ({
    weekStart: toIsoDate(addDays(monday, (i - 7) * 7)),
    durationMin,
    volumeKg: volumes[i]!,
    reps: reps[i]!,
  }))
}

export const initialWater = (): WaterLog => ({
  consumedMl: 1250,
  goalMl: 3500,
  entries: [
    { id: 'w1', ml: 500 },
    { id: 'w2', ml: 500 },
    { id: 'w3', ml: 250 },
  ],
})

export function renatoHome(
  plan: WorkoutPlan | null,
  today: Date,
  diet: Pick<HomeSummary, 'nutrition' | 'nextMeal'>,
  lastWeightKg: number | null,
  finished: FinishedSession[] = [],
): HomeSummary {
  const week = renatoWeek(plan, today, finished)
  // Treinos da ficha feitos na semana: cada dia da ficha conta uma vez, em qualquer data
  const done = plan ? new Set([...doneDayIds(plan, today), ...finished.map((f) => f.dayId)]).size : 0
  const day = plan && workoutForDate(plan.days, today)
  const [firstFocus, ...otherFocus] = day?.focus ?? []
  return {
    streakDays: 3,
    unreadNotifications: 3,
    hasUnreadMessages: true,
    lastWeightKg,
    week,
    todayWorkout:
      plan && day
        ? {
            dayId: day.id,
            letter: day.letter,
            name: day.name,
            exerciseCount: day.exercises.length,
            estimatedMinutes: estimateDuration(day),
            muscles: firstFocus ? [firstFocus, ...otherFocus.map((f) => f.toLowerCase())] : [],
            position: plan.days.indexOf(day) + 1,
            totalInWeek: plan.days.length,
          }
        : null,
    weeklyWorkouts: { done, goal: plan?.days.length || 5 },
    ...diet,
    activity: renatoActivity(today),
  }
}
