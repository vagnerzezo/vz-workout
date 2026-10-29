import type { LibraryExercise, LibraryFood } from '../schemas/coach-library'
import { filterLibrary, type ExerciseGroup } from '../workout/editor'

export const exerciseLevelLabel = { beginner: 'iniciante', intermediate: 'intermediário', advanced: 'avançado' } as const
export const foodOriginLabel = { taco: 'TACO', label: 'Rótulo', coach: 'Meu' } as const
export const EQUIPMENT = ['Máquina', 'Barra', 'Halteres', 'Polia', 'Peso corporal', 'Elástico', 'Kettlebell'] as const

export type ExerciseFilters = { query: string; group: ExerciseGroup | null; origin: 'all' | 'base' | 'coach'; noVideo: boolean }

/** Busca e grupo como no editor de ficha, mais a origem e "só sem vídeo". Os meus primeiro. */
export function filterExercises(list: LibraryExercise[], f: ExerciseFilters): LibraryExercise[] {
  return (filterLibrary(list, f.query, f.group) as LibraryExercise[])
    .filter((e) => (f.origin === 'all' || e.origin === f.origin) && (!f.noVideo || e.videoSeconds === null))
    .sort((a, b) => (a.origin === b.origin ? 0 : a.origin === 'coach' ? -1 : 1))
}

export function filterFoods(list: LibraryFood[], origin: 'all' | LibraryFood['origin'], query = ''): LibraryFood[] {
  const fold = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
  const q = fold(query.trim())
  return list.filter((f) => (origin === 'all' || f.origin === origin) && (!q || fold(f.name).includes(q)))
}

/** "1 unidade = 50 g" ou "pesado pronto". */
export const householdLabel = (f: Pick<LibraryFood, 'unit' | 'unitGrams'>) => (f.unit && f.unitGrams ? `1 ${f.unit === 'un.' ? 'unidade' : f.unit} = ${f.unitGrams} g` : 'pesado pronto')

/** Passo a passo digitado (uma etapa por linha), sem linhas vazias. */
export const parseSteps = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
