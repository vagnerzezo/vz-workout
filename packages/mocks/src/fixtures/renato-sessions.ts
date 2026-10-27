import type { PreviousSet, PrescribedExercise, SessionItem } from '@workspace/core'
import { estimatedOneRepMax, repsFloor } from '@workspace/core'

/** Carga de trabalho do Renato na última vez, por exercício (kg). */
export const workingKg: Record<string, number> = {
  ex_incline_press_machine: 60, ex_fly: 16, ex_french_cable: 20, ex_crossover_high: 15, ex_lateral_raise: 10,
  ex_triceps_bar: 30, ex_lat_pulldown: 60, ex_bent_row: 60, ex_seated_row_single: 35, ex_scott_curl: 25,
  ex_concentration_curl: 12, ex_hack_squat: 80, ex_lying_leg_curl: 45, ex_leg_extension: 50, ex_adductor: 55,
  ex_stiff: 70, ex_seated_calf: 40, ex_bench_press: 70, ex_meadows_row: 30, ex_overhead_press: 22,
  ex_neutral_pulldown: 55, ex_barbell_curl: 30, ex_skull_crusher: 25, ex_leg_press: 180, ex_seated_leg_curl: 40,
  ex_hip_thrust: 100, ex_bulgarian_split: 16, ex_standing_calf: 60,
}

/** Exceções escritas à mão para bater com o canvas. */
const handWritten: Record<string, Partial<SessionItem>> = {
  ex_hack_squat: {
    note: 'Cadência 3-1-1. Desça até a coxa passar da paralela. Última válida até 1 repetição da falha.',
    targetKg: 85,
    previous: [
      { kind: 'warmup', kg: 40, reps: 12 },
      { kind: 'warmup', kg: 50, reps: 10 },
      { kind: 'prep', kg: 70, reps: 10 },
      { kind: 'working', kg: 80, reps: 9 },
      { kind: 'working', kg: 80, reps: 8 },
      { kind: 'working', kg: 80, reps: 8 },
    ],
  },
  ex_lying_leg_curl: {
    previous: [
      { kind: 'working', kg: 45, reps: 11 },
      { kind: 'working', kg: 45, reps: 10 },
      { kind: 'working', kg: 45, reps: 9 },
    ],
  },
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step

/** Séries da última sessão geradas a partir da carga de trabalho e da faixa de repetições. */
function generatedPrevious(p: PrescribedExercise, kg: number): PreviousSet[] {
  const top = parseInt(p.reps.split('–')[1] ?? p.reps, 10) || 10
  return [
    ...Array.from({ length: p.warmupSets }, () => ({ kind: 'warmup' as const, kg: roundTo(kg * 0.5, 2.5), reps: 12 })),
    ...Array.from({ length: p.prepSets }, () => ({ kind: 'prep' as const, kg: roundTo(kg * 0.85, 2.5), reps: 8 })),
    ...Array.from({ length: p.workingSets }, (_, i) => ({ kind: 'working' as const, kg, reps: Math.max(top - i, repsFloor(p.reps) ?? 1) })),
  ]
}

export function sessionItem(p: PrescribedExercise): SessionItem {
  const kg = workingKg[p.exerciseId] ?? 20
  const custom = handWritten[p.exerciseId] ?? {}
  const previous = custom.previous ?? generatedPrevious(p, kg)
  const bestE1rm = Math.max(0, ...previous.filter((s) => s.kind === 'working').map((s) => estimatedOneRepMax(s.kg, s.reps)))
  return {
    prescribedId: p.id,
    note: custom.note ?? null,
    rir: '1–2',
    restRange: [Math.max(p.restSeconds - 30, 30), p.restSeconds + 30],
    targetKg: custom.targetKg ?? kg,
    previous,
    bestE1rm: bestE1rm || null,
  }
}
