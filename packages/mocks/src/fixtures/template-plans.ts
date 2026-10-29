import type { Phase, PlanTemplateSummary, PrescribedExercise, WorkoutDay, WorkoutPlan } from '@workspace/core'
import { renatoPlan } from './renato-plan'

type Rx = [exerciseId: string, warmup: number, prep: number, working: number, reps: string, rest: number, technique?: string]
type DaySpec = [letter: WorkoutDay['letter'], name: string, weekday: number, focus: string[], items: Rx[]]

const prescribe = (dayId: string, items: Rx[]): PrescribedExercise[] =>
  items.map(([exerciseId, warmupSets, prepSets, workingSets, reps, restSeconds, technique], i) => ({
    id: `${dayId}_${i + 1}`, exerciseId, warmupSets, prepSets, workingSets, reps, restSeconds, technique: technique ?? null,
  }))

const days = (tplId: string, specs: DaySpec[]): WorkoutDay[] =>
  specs.map(([letter, name, weekday, focus, items]) => {
    const id = `${tplId}_${letter.toLowerCase()}`
    return { id, letter, name, weekday, focus, exercises: prescribe(id, items) }
  })

/** Fases que cobrem as semanas do modelo: 4 (o canvas), 3 (sem intensificação) ou 2 (acumulação e deload). */
export function phasesFor(weeks: number, count: number): Phase[] {
  const p = (id: Phase['id'], from: number, to: number, setMultiplier: number, rir: number): Phase => ({ id, weeks: [from, to], setMultiplier, rir })
  if (count >= 4) {
    const adapt = Math.max(1, Math.round(weeks * 0.2))
    const intens = Math.max(1, Math.round(weeks * 0.3))
    return [p('adaptation', 1, adapt, 0.7, 3), p('accumulation', adapt + 1, weeks - intens - 1, 1, 2), p('intensification', weeks - intens, weeks - 1, 0.8, 1), p('deload', weeks, weeks, 0.5, 4)]
  }
  if (count === 3) {
    const adapt = Math.max(1, Math.round(weeks * 0.25))
    return [p('adaptation', 1, adapt, 0.7, 3), p('accumulation', adapt + 1, weeks - 1, 1, 2), p('deload', weeks, weeks, 0.5, 4)]
  }
  return [p('accumulation', 1, weeks - 1, 1, 2), p('deload', weeks, weeks, 0.5, 4)]
}

// Blocos reaproveitados entre os modelos
const UPPER: Rx[] = [['ex_bench_press', 2, 1, 3, '6–8', 150], ['ex_meadows_row', 0, 1, 3, '8–10', 120], ['ex_overhead_press', 0, 0, 3, '8–10', 90], ['ex_neutral_pulldown', 0, 0, 3, '10–12', 90], ['ex_lateral_raise', 0, 0, 3, '12–15', 60], ['ex_barbell_curl', 0, 0, 2, '10–12', 60], ['ex_skull_crusher', 0, 0, 2, '10–12', 60]]
const LOWER: Rx[] = [['ex_back_squat', 2, 1, 3, '6–8', 150], ['ex_lying_leg_curl', 0, 0, 3, '10–12', 90], ['ex_leg_press', 0, 1, 3, '10–12', 120], ['ex_hip_thrust', 0, 0, 3, '8–10', 90], ['ex_standing_calf', 0, 0, 3, '12–15', 60]]
const FULL_A: Rx[] = [['ex_leg_press', 1, 1, 3, '10–12', 120], ['ex_bench_press', 1, 1, 3, '8–10', 120], ['ex_lat_pulldown', 0, 1, 3, '10–12', 90], ['ex_lateral_raise', 0, 0, 2, '12–15', 60], ['ex_plank', 0, 0, 3, '30–45 s', 45]]
const FULL_B: Rx[] = [['ex_back_squat', 1, 1, 3, '8–10', 120], ['ex_overhead_press', 0, 1, 3, '8–10', 90], ['ex_seated_row_single', 0, 0, 3, '10–12', 90], ['ex_barbell_curl', 0, 0, 2, '10–12', 60], ['ex_triceps_bar', 0, 0, 2, '10–12', 60]]
const FULL_C: Rx[] = [['ex_hip_thrust', 1, 1, 3, '8–10', 120], ['ex_incline_press_machine', 0, 1, 3, '8–12', 90], ['ex_neutral_pulldown', 0, 0, 3, '10–12', 90], ['ex_lying_leg_curl', 0, 0, 3, '10–12', 60], ['ex_seated_calf', 0, 0, 3, '12–15', 60]]

const plans: Record<string, DaySpec[]> = {
  tpl_ul: [
    ['A', 'Upper', 1, ['Peito', 'Costas', 'Ombro'], UPPER],
    ['B', 'Lower', 2, ['Quadríceps', 'Posterior'], LOWER],
    ['C', 'Upper', 4, ['Peito', 'Costas', 'Braços'], UPPER],
    ['D', 'Lower', 5, ['Glúteos', 'Posterior'], LOWER],
  ],
  tpl_full: [
    ['A', 'Full body', 1, ['Corpo inteiro'], FULL_A],
    ['B', 'Full body', 3, ['Corpo inteiro'], FULL_B],
    ['C', 'Full body', 5, ['Corpo inteiro'], FULL_C],
  ],
  tpl_cut: [
    ['A', 'Força + circuito', 1, ['Corpo inteiro'], [...FULL_A.slice(0, 3), ['ex_kettlebell_swing', 0, 0, 3, '15–20', 45, 'Circuito']]],
    ['B', 'Força + circuito', 3, ['Corpo inteiro'], [...FULL_B.slice(0, 3), ['ex_push_up', 0, 0, 3, '10–15', 45, 'Circuito']]],
    ['C', 'Força + circuito', 5, ['Corpo inteiro'], [...FULL_C.slice(0, 3), ['ex_bodyweight_squat', 0, 0, 3, '15–20', 45, 'Circuito']]],
  ],
  tpl_hiit: [
    ['A', 'Força superior', 1, ['Peito', 'Costas'], UPPER.slice(0, 5)],
    ['B', 'HIIT', 2, ['Condicionamento'], [['ex_kettlebell_swing', 0, 0, 6, '30 s', 30, 'HIIT'], ['ex_bodyweight_squat', 0, 0, 6, '30 s', 30, 'HIIT'], ['ex_push_up', 0, 0, 4, '30 s', 30, 'HIIT']]],
    ['C', 'Força inferior', 4, ['Quadríceps', 'Glúteos'], LOWER],
    ['D', 'HIIT', 5, ['Condicionamento'], [['ex_kettlebell_swing', 0, 0, 6, '30 s', 30, 'HIIT'], ['ex_plank', 0, 0, 4, '40 s', 20], ['ex_band_row', 0, 0, 4, '30 s', 30, 'HIIT']]],
  ],
  tpl_5x5: [
    ['A', 'Agachamento e supino', 1, ['Força'], [['ex_back_squat', 2, 1, 5, '5', 180], ['ex_bench_press', 2, 1, 5, '5', 180], ['ex_bent_row', 0, 1, 5, '5', 150]]],
    ['B', 'Terra e desenvolvimento', 3, ['Força'], [['ex_back_squat', 2, 1, 5, '5', 180], ['ex_overhead_press', 1, 1, 5, '5', 150], ['ex_deadlift', 2, 1, 1, '5', 180]]],
  ],
  tpl_glute: [
    ['A', 'Glúteos', 1, ['Glúteos', 'Posterior'], [['ex_hip_thrust', 2, 1, 4, '8–10', 120], ['ex_bulgarian_split', 0, 1, 3, '10–12', 90], ['ex_stiff', 0, 1, 3, '8–10', 120], ['ex_kettlebell_swing', 0, 0, 3, '15', 60], ['ex_adductor', 0, 0, 3, '12–15', 60]]],
    ['B', 'Superior', 2, ['Costas', 'Ombro'], UPPER.slice(1, 6)],
    ['C', 'Posterior', 4, ['Posterior', 'Glúteos'], [['ex_deadlift', 2, 1, 3, '6–8', 150], ['ex_seated_leg_curl', 0, 0, 4, '10–12', 90], ['ex_hip_thrust', 0, 0, 3, '12–15', 90], ['ex_standing_calf', 0, 0, 3, '12–15', 60]]],
    ['D', 'Superior', 5, ['Peito', 'Braços'], [['ex_incline_press_machine', 1, 1, 3, '8–12', 120], ['ex_lat_pulldown', 0, 1, 3, '10–12', 90], ['ex_lateral_raise', 0, 0, 3, '12–15', 60], ['ex_hammer_curl', 0, 0, 2, '10–12', 60], ['ex_triceps_bar', 0, 0, 2, '10–12', 60]]],
  ],
  tpl_home: [
    ['A', 'Corpo inteiro', 1, ['Corpo inteiro'], [['ex_bodyweight_squat', 0, 1, 3, '15–20', 60], ['ex_push_up', 0, 1, 3, '10–15', 60], ['ex_band_row', 0, 0, 3, '12–15', 60], ['ex_plank', 0, 0, 3, '30–45 s', 45]]],
    ['B', 'Corpo inteiro', 3, ['Corpo inteiro'], [['ex_kettlebell_swing', 0, 1, 3, '15', 60], ['ex_push_up', 0, 0, 3, '10–15', 60], ['ex_band_row', 0, 0, 3, '12–15', 60], ['ex_plank', 0, 0, 3, '30–45 s', 45]]],
    ['C', 'Corpo inteiro', 5, ['Corpo inteiro'], [['ex_bodyweight_squat', 0, 1, 4, '15–20', 60], ['ex_band_row', 0, 0, 3, '12–15', 60], ['ex_push_up', 0, 0, 3, '10–15', 60]]],
  ],
}

/** A ficha completa de um modelo. O PPL é a ficha do canvas (a mesma do Renato, com as 4 fases de 10 semanas). */
export function templatePlan(t: PlanTemplateSummary): WorkoutPlan {
  const base = { id: t.id, name: t.name, startsOn: t.updatedAt, updatedAt: t.updatedAt, validUntil: t.updatedAt, durationWeeks: t.durationWeeks, notes: renatoPlan.notes, currentPhaseId: 'accumulation' as const }
  const phases = phasesFor(t.durationWeeks, t.phaseCount)
  const currentPhaseId = phases.some((p) => p.id === 'accumulation') ? 'accumulation' : phases[0]!.id
  if (t.id === 'tpl_ppl') {
    const pplDays = renatoPlan.days.map((d) => ({ ...d, id: `tpl_ppl_${d.letter.toLowerCase()}`, exercises: d.exercises.map((e, i) => ({ ...e, id: `tpl_ppl_${d.letter.toLowerCase()}_${i + 1}` })) }))
    return { ...base, phases, currentPhaseId, days: pplDays }
  }
  const spec = plans[t.id] ?? plans.tpl_full! // arquivados e cópias sem ficha própria partem do full body
  return { ...base, phases, currentPhaseId, days: days(t.id, spec) }
}
