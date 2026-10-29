import { z } from 'zod'
import { Exercise, Muscle } from './workout'
import { Food } from './diet-templates'

export const ExerciseLevel = z.enum(['beginner', 'intermediate', 'advanced'])

/** Exercício da biblioteca: o da ficha mais o passo a passo, o nível, o vídeo e onde é usado. */
export const LibraryExercise = Exercise.extend({
  level: ExerciseLevel,
  steps: z.array(z.string()),
  alternatives: z.array(z.string()), // ids de exercícios para o aluno trocar sozinho
  videoSeconds: z.number().int().positive().nullable(), // null = sem vídeo
  uses: z.number().int().min(0), // fichas (modelos + cópias dos alunos)
})
export type LibraryExercise = z.infer<typeof LibraryExercise>

export const LibraryFood = Food.extend({
  origin: z.enum(['taco', 'label', 'coach']),
  diets: z.number().int().min(0),
})
export type LibraryFood = z.infer<typeof LibraryFood>

export const Material = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(['pdf', 'video', 'link']),
  meta: z.string(), // "PDF · 4 páginas"
  description: z.string(),
  audience: z.string(), // "Todos os alunos"
  views: z.number().int().min(0),
  students: z.number().int().min(0),
})
export type Material = z.infer<typeof Material>

/** GET /coach/library */
export const CoachLibrary = z.object({
  exercises: z.array(LibraryExercise),
  foods: z.array(LibraryFood),
  materials: z.array(Material),
})
export type CoachLibrary = z.infer<typeof CoachLibrary>

/** GET /coach/library/exercises/:id: o exercício e as fichas que o usam. */
export const ExerciseDetail = z.object({
  exercise: LibraryExercise,
  usedIn: z.array(z.object({ name: z.string(), meta: z.string(), link: z.string().startsWith('/') })),
  templates: z.number().int(),
  students: z.number().int(),
})
export type ExerciseDetail = z.infer<typeof ExerciseDetail>

/** POST /coach/library/exercises */
export const NewExercise = z.object({
  name: z.string().trim().min(3, 'Dê um nome com pelo menos 3 letras').max(60),
  primary: Muscle,
  secondary: z.array(Muscle),
  equipment: z.string().min(1),
  steps: z.array(z.string().trim().min(1)).max(8),
  videoName: z.string().nullable(), // arquivo escolhido (o upload real fica para a API)
  youtubeUrl: z.union([z.literal(''), z.url('Link inválido')]),
})
export type NewExercise = z.infer<typeof NewExercise>
