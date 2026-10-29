import type { Exercise, Muscle, PrescribedExercise, WorkoutDay, WorkoutPlan } from '@workspace/core'

const ex = (id: string, name: string, primary: Muscle, secondary: Muscle[], equipment: string): Exercise => ({
  id, name, primary, secondary, equipment, videoUrl: null, origin: 'base',
})

export const exerciseLibrary: Exercise[] = [
  ex('ex_incline_press_machine', 'Supino inclinado (máquina)', 'chest', ['shoulders', 'triceps'], 'Máquina'),
  ex('ex_fly', 'Crucifixo', 'chest', ['shoulders'], 'Halteres'),
  ex('ex_french_cable', 'Tríceps francês no cabo', 'triceps', [], 'Polia'),
  ex('ex_crossover_high', 'Crossover polia alta', 'chest', [], 'Polia'),
  ex('ex_lateral_raise', 'Elevação lateral', 'sideDelts', [], 'Halteres'),
  ex('ex_triceps_bar', 'Tríceps barra', 'triceps', [], 'Polia'),
  ex('ex_lat_pulldown', 'Puxada alta', 'lats', ['biceps'], 'Polia'),
  ex('ex_bent_row', 'Remada curvada (barra)', 'upperBack', ['lats', 'biceps'], 'Barra'),
  ex('ex_seated_row_single', 'Remada baixa unilateral', 'upperBack', ['lats', 'biceps'], 'Polia'),
  ex('ex_scott_curl', 'Rosca Scott', 'biceps', [], 'Máquina'),
  ex('ex_concentration_curl', 'Rosca concentrada', 'biceps', [], 'Halteres'),
  ex('ex_hack_squat', 'Agachamento hack (máquina)', 'quads', ['glutes'], 'Máquina'),
  ex('ex_lying_leg_curl', 'Mesa flexora', 'hamstrings', [], 'Máquina'),
  ex('ex_leg_extension', 'Cadeira extensora', 'quads', [], 'Máquina'),
  ex('ex_adductor', 'Cadeira adutora', 'adductors', [], 'Máquina'),
  ex('ex_stiff', 'Stiff', 'hamstrings', ['glutes'], 'Barra'),
  ex('ex_seated_calf', 'Panturrilha sentado', 'calves', [], 'Máquina'),
  ex('ex_bench_press', 'Supino reto (barra)', 'chest', ['shoulders', 'triceps'], 'Barra'),
  ex('ex_meadows_row', 'Remada Meadows', 'upperBack', ['lats', 'biceps'], 'Barra'),
  ex('ex_overhead_press', 'Desenvolvimento', 'shoulders', ['triceps'], 'Halteres'),
  ex('ex_neutral_pulldown', 'Puxada neutra', 'lats', ['biceps'], 'Polia'),
  ex('ex_barbell_curl', 'Rosca direta', 'biceps', [], 'Barra'),
  ex('ex_skull_crusher', 'Tríceps testa', 'triceps', [], 'Barra'),
  ex('ex_leg_press', 'Leg press 45°', 'quads', ['glutes'], 'Máquina'),
  ex('ex_seated_leg_curl', 'Cadeira flexora', 'hamstrings', [], 'Máquina'),
  ex('ex_hip_thrust', 'Elevação pélvica', 'glutes', ['hamstrings'], 'Barra'),
  ex('ex_bulgarian_split', 'Afundo búlgaro', 'quads', ['glutes'], 'Halteres'),
  ex('ex_standing_calf', 'Panturrilha em pé', 'calves', [], 'Máquina'),
  // Usados só nos modelos do painel (a ficha do Renato não tem)
  ex('ex_pull_up', 'Barra fixa', 'lats', ['biceps'], 'Peso corporal'),
  ex('ex_face_pull', 'Face pull', 'upperBack', ['sideDelts'], 'Polia'),
  ex('ex_hammer_curl', 'Rosca martelo', 'biceps', [], 'Halteres'),
  ex('ex_back_squat', 'Agachamento livre', 'quads', ['glutes'], 'Barra'),
  ex('ex_deadlift', 'Levantamento terra', 'hamstrings', ['glutes', 'upperBack'], 'Barra'),
  ex('ex_push_up', 'Flexão de braço', 'chest', ['triceps', 'shoulders'], 'Peso corporal'),
  ex('ex_bodyweight_squat', 'Agachamento com peso corporal', 'quads', ['glutes'], 'Peso corporal'),
  ex('ex_band_row', 'Remada com elástico', 'upperBack', ['lats', 'biceps'], 'Elástico'),
  ex('ex_plank', 'Prancha', 'core', [], 'Peso corporal'),
  ex('ex_kettlebell_swing', 'Swing com kettlebell', 'glutes', ['hamstrings'], 'Kettlebell'),
]

type Rx = [exerciseId: string, warmup: number, prep: number, working: number, reps: string, rest: number, technique?: string]

const prescribe = (dayId: string, items: Rx[]): PrescribedExercise[] =>
  items.map(([exerciseId, warmupSets, prepSets, workingSets, reps, restSeconds, technique], i) => ({
    id: `${dayId}_${i + 1}`, exerciseId, warmupSets, prepSets, workingSets, reps, restSeconds, technique: technique ?? null,
  }))

const day = (id: string, letter: WorkoutDay['letter'], name: string, weekday: number, focus: string[], items: Rx[]): WorkoutDay => ({
  id, letter, name, weekday, focus, exercises: prescribe(id, items),
})

// Séries e descansos escolhidos para bater com as durações do canvas (~50, ~45, ~55, ~60, ~45 min)
export const renatoPlan: WorkoutPlan = {
  id: 'plan_hipertrofia_b2',
  name: 'Hipertrofia — Bloco 2',
  startsOn: '2026-10-14',
  durationWeeks: 8,
  updatedAt: '2026-10-14',
  validUntil: '2026-12-15',
  phases: [
    { id: 'adaptation', weeks: [1, 1], setMultiplier: 0.7, rir: 3 },
    { id: 'accumulation', weeks: [2, 5], setMultiplier: 1, rir: 2 },
    { id: 'intensification', weeks: [6, 7], setMultiplier: 0.8, rir: 1 },
    { id: 'deload', weeks: [8, 8], setMultiplier: 0.5, rir: 4 },
  ],
  currentPhaseId: 'accumulation',
  notes: [
    { title: 'Execução e carga', text: 'priorize a qualidade do movimento. Só aumente a carga quando completar o topo da faixa de repetições com boa técnica.' },
    { title: 'RIR', text: 'repetições em reserva. RIR 1–2 significa parar com 1 ou 2 repetições ainda possíveis.' },
    { title: 'Descanso', text: '2–3 min nos multiarticulares, 1–2 min nos isolados.' },
  ],
  days: [
    day('day_a', 'A', 'Push', 1, ['Peito', 'Ombro', 'Tríceps'], [
      ['ex_incline_press_machine', 2, 1, 3, '6–10', 120],
      ['ex_fly', 0, 1, 3, '10–12', 90],
      ['ex_french_cable', 0, 0, 3, '10–12', 60],
      ['ex_crossover_high', 0, 0, 3, '12–15', 60],
      ['ex_lateral_raise', 0, 0, 3, '12–15', 60, 'Drop-set'],
      ['ex_triceps_bar', 0, 0, 3, '10–12', 60],
    ]),
    day('day_b', 'B', 'Pull', 2, ['Costas', 'Bíceps'], [
      ['ex_lat_pulldown', 2, 1, 3, '8–10', 120],
      ['ex_bent_row', 0, 1, 3, '6–10', 120],
      ['ex_seated_row_single', 0, 0, 3, '10–12', 90],
      ['ex_scott_curl', 0, 0, 3, '10–12', 60],
      ['ex_concentration_curl', 0, 0, 2, '12–15', 60],
    ]),
    day('day_c', 'C', 'Legs', 3, ['Quadríceps', 'Posterior', 'Glúteos'], [
      ['ex_hack_squat', 2, 1, 3, '6–10', 150],
      ['ex_lying_leg_curl', 0, 0, 3, '10–12', 90],
      ['ex_leg_extension', 0, 0, 3, '12–15', 60],
      ['ex_adductor', 0, 0, 3, '12–15', 60],
      ['ex_stiff', 0, 1, 3, '8–10', 120],
      ['ex_seated_calf', 0, 0, 3, '12–15', 60],
    ]),
    day('day_d', 'D', 'Upper', 5, ['Peito', 'Costas', 'Ombro', 'Braços'], [
      ['ex_bench_press', 2, 1, 3, '6–8', 150],
      ['ex_meadows_row', 0, 1, 3, '8–10', 120],
      ['ex_overhead_press', 0, 0, 3, '8–10', 90],
      ['ex_neutral_pulldown', 0, 0, 3, '10–12', 90],
      ['ex_lateral_raise', 0, 0, 3, '12–15', 60],
      ['ex_barbell_curl', 0, 0, 3, '10–12', 60],
      ['ex_skull_crusher', 0, 0, 2, '10–12', 60],
    ]),
    day('day_e', 'E', 'Lower', 6, ['Glúteos', 'Posterior', 'Quadríceps'], [
      ['ex_leg_press', 2, 1, 3, '8–12', 150],
      ['ex_seated_leg_curl', 0, 0, 3, '10–12', 90],
      ['ex_hip_thrust', 0, 1, 3, '8–10', 120],
      ['ex_bulgarian_split', 0, 0, 2, '10–12', 90],
      ['ex_standing_calf', 0, 0, 3, '12–15', 60],
    ]),
  ],
}
