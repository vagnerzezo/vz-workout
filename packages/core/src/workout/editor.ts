import type { Exercise, Muscle, Phase, PrescribedExercise, WorkoutDay } from '../schemas/workout'
import { applyPhase } from './session'

/**
 * Regras do editor de ficha (painel). Tudo devolve um dia novo: o editor guarda a ficha em rascunho
 * e só manda para a API ao salvar.
 */

export const MAX_WORKING_SETS = 8
const LETTERS: WorkoutDay['letter'][] = ['A', 'B', 'C', 'D', 'E', 'F']

const mapItems = (day: WorkoutDay, fn: (items: PrescribedExercise[]) => PrescribedExercise[]): WorkoutDay => ({ ...day, exercises: fn(day.exercises) })

/** Exercício novo no fim do dia: 1 preparatória, 3 válidas de 8–12 e 1min30 de descanso (o padrão do canvas). */
export const addExercise = (day: WorkoutDay, exerciseId: string, id: string) =>
  mapItems(day, (items) => [...items, { id, exerciseId, warmupSets: 0, prepSets: 1, workingSets: 3, reps: '8–12', restSeconds: 90, technique: null }])

export const removeExercise = (day: WorkoutDay, itemId: string) => mapItems(day, (items) => items.filter((e) => e.id !== itemId))

/** Sobe (-1) ou desce (+1) uma posição; nas pontas não faz nada. */
export function moveExercise(day: WorkoutDay, itemId: string, delta: -1 | 1): WorkoutDay {
  const i = day.exercises.findIndex((e) => e.id === itemId)
  const j = i + delta
  if (i < 0 || j < 0 || j >= day.exercises.length) return day
  return mapItems(day, (items) => {
    const next = [...items]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    return next
  })
}

/** Séries válidas da base (antes do multiplicador da fase), entre 1 e 8. */
export const setWorkingSets = (day: WorkoutDay, itemId: string, n: number) =>
  mapItems(day, (items) => items.map((e) => (e.id === itemId ? { ...e, workingSets: Math.min(MAX_WORKING_SETS, Math.max(1, n)) } : e)))

/** "Trocar": outro exercício no lugar, com as mesmas séries e descanso. */
export const swapExercise = (day: WorkoutDay, itemId: string, exerciseId: string) =>
  mapItems(day, (items) => items.map((e) => (e.id === itemId ? { ...e, exerciseId } : e)))

/** "+ Dia": a próxima letra, no primeiro dia da semana ainda livre. Sem letra sobrando (já tem F) → null. */
export function newDay(days: WorkoutDay[], id: string): WorkoutDay | null {
  const letter = LETTERS.find((l) => !days.some((d) => d.letter === l))
  if (!letter) return null
  const weekday = [1, 2, 3, 4, 5, 6, 7].find((w) => !days.some((d) => d.weekday === w)) ?? 1
  return { id, letter, name: 'Novo treino', weekday, focus: [], exercises: [] }
}

export type SetRow = { kind: 'warmup' | 'prep' | 'working'; label: string; reps: string; effort: string; restSeconds: number }

/** Linhas da tabela do exercício: aquecimento, preparatórias e as válidas já com o multiplicador da fase. */
export function setRows(item: PrescribedExercise, phase: Pick<Phase, 'setMultiplier' | 'rir'>): SetRow[] {
  return [
    ...Array.from({ length: item.warmupSets }, (): SetRow => ({ kind: 'warmup', label: 'Aquecimento', reps: '12–15', effort: '~50% da carga de trabalho', restSeconds: 60 })),
    ...Array.from({ length: item.prepSets }, (): SetRow => ({ kind: 'prep', label: 'Preparatória', reps: '6–8', effort: '~75% da carga de trabalho', restSeconds: 90 })),
    ...Array.from({ length: applyPhase(item.workingSets, phase) }, (_, i): SetRow => ({
      kind: 'working',
      label: `Válida ${i + 1}`,
      reps: item.reps,
      effort: `RIR ${phase.rir} · última até a falha técnica`,
      restSeconds: item.restSeconds,
    })),
  ]
}

/** "Sem. 3–6" ou "Sem. 10". */
export const phaseWeeksLabel = (p: Pick<Phase, 'weeks'>) => (p.weeks[0] === p.weeks[1] ? `Sem. ${p.weeks[0]}` : `Sem. ${p.weeks[0]}–${p.weeks[1]}`)

/** Cor da barra de volume: abaixo de 6 e acima de 24 em vermelho; 6–9 e 21–24 em amarelo; 10–20 na faixa. */
export type VolumeTone = 'danger' | 'warning' | 'ok'
export const volumeTone = (n: number): VolumeTone => (n < 6 || n > 24 ? 'danger' : n < 10 || n > 20 ? 'warning' : 'ok')

export type VolumeAlert = { muscle: Muscle | null; text: string; tone: VolumeTone | 'info' }

const br = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

/** Alertas da ficha. No deload o volume cai de propósito: um aviso só, sem os de faixa. */
export function volumeAlerts(volume: Map<Muscle, number>, muscles: Muscle[], phaseId: Phase['id']): VolumeAlert[] {
  if (phaseId === 'deload') return [{ muscle: null, text: 'volume reduzido de propósito, alertas de faixa desligados.', tone: 'info' }]
  return muscles.flatMap((m): VolumeAlert[] => {
    const n = volume.get(m) ?? 0
    if (n < 10) return [{ muscle: m, text: `${br(n)} séries na semana, abaixo de 10.`, tone: volumeTone(n) }]
    if (n > 20) return [{ muscle: m, text: `${br(n)} séries na semana, acima de 20. Confira a recuperação.`, tone: volumeTone(n) }]
    return []
  })
}

/** Os músculos do painel de volume, na ordem do canvas (o core só entra se algum exercício usar). */
export const VOLUME_MUSCLES: Muscle[] = ['chest', 'lats', 'upperBack', 'shoulders', 'sideDelts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'adductors', 'calves']

/** "ABCDE · Push, Pull, Legs, Upper, Lower": a linha do card na lista de fichas. */
export const planSplit = (days: Pick<WorkoutDay, 'letter' | 'name'>[]) => `${days.map((d) => d.letter).join('')} · ${days.map((d) => d.name).join(', ')}`

export const exerciseGroups = ['Peito', 'Costas', 'Ombro', 'Braços', 'Pernas', 'Core'] as const
export type ExerciseGroup = (typeof exerciseGroups)[number]

export const muscleGroup: Record<Muscle, ExerciseGroup> = {
  chest: 'Peito',
  lats: 'Costas',
  upperBack: 'Costas',
  shoulders: 'Ombro',
  sideDelts: 'Ombro',
  biceps: 'Braços',
  triceps: 'Braços',
  quads: 'Pernas',
  hamstrings: 'Pernas',
  glutes: 'Pernas',
  adductors: 'Pernas',
  calves: 'Pernas',
  core: 'Core',
}

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Biblioteca do editor: busca pelo nome (sem acento) e grupo pelo músculo principal. */
export function filterLibrary(library: Exercise[], query: string, group: ExerciseGroup | null): Exercise[] {
  const q = fold(query.trim())
  return library.filter((e) => (!group || muscleGroup[e.primary] === group) && (!q || fold(e.name).includes(q)))
}
