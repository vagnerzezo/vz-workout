import { z } from 'zod'
import { Macros } from './diet'

export const FoodGroup = z.enum(['protein', 'carbs', 'fruit', 'dairy', 'vegetables', 'fats'])
export type FoodGroup = z.infer<typeof FoodGroup>

/** Alimento da tabela (valores por 100 g, aproximados da TACO; suplementos pelo rótulo). */
export const Food = z.object({
  id: z.string(),
  name: z.string(),
  group: FoodGroup,
  per100: Macros,
  /** Medida caseira: "un." de 50 g, "colher de sopa" de 15 g… null = pesado pronto */
  unit: z.string().nullable(),
  unitGrams: z.number().positive().nullable(),
  /** Substituições que fazem sentido (mesmo papel na refeição) */
  alternatives: z.array(z.string()),
})
export type Food = z.infer<typeof Food>

export const DietGoal = z.enum(['recomposition', 'fatLoss', 'hypertrophy', 'maintenance'])
export type DietGoal = z.infer<typeof DietGoal>

export const CalorieMode = z.enum(['deficit20', 'deficit500', 'maintenance', 'surplus10', 'manual'])
export type CalorieMode = z.infer<typeof CalorieMode>

export const TemplateFood = z.object({
  id: z.string(),
  foodId: z.string(),
  grams: z.number().positive(),
  substitutes: z.array(z.string()), // ids de Food; a porção é calculada pela mesma energia
})
export type TemplateFood = z.infer<typeof TemplateFood>

export const TemplateMeal = z.object({
  id: z.string(),
  name: z.string(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  foods: z.array(TemplateFood),
})
export type TemplateMeal = z.infer<typeof TemplateMeal>

/**
 * Ficha de dieta do painel, em gramas. A pessoa de referência (peso, altura, idade, sexo) alimenta o
 * gasto energético; ao atribuir com ajuste, as porções escalam pelo peso de cada aluno.
 */
export const DietTemplate = z.object({
  id: z.string(),
  name: z.string(),
  appLabel: z.string(), // como aparece no app do aluno: "Dia de treino"
  goal: DietGoal,
  reference: z.object({ weightKg: z.number().positive(), heightCm: z.number().positive(), age: z.number().int().positive(), sex: z.enum(['male', 'female']) }),
  activityFactor: z.number().min(1).max(2.5),
  calorieMode: CalorieMode,
  manualKcal: z.number().positive().nullable(),
  proteinPerKg: z.number().positive(),
  fatPerKg: z.number().positive(),
  meals: z.array(TemplateMeal),
  notes: z.string(),
  updatedAt: z.iso.date(),
  archived: z.boolean(),
})
export type DietTemplate = z.infer<typeof DietTemplate>

/** Card da lista de dietas. */
export const DietTemplateSummary = z.object({
  id: z.string(),
  name: z.string(),
  goal: DietGoal,
  meals: z.number().int().min(0),
  substitutions: z.number().int().min(0),
  targets: Macros, // metas do modelo (kcal e gramas) no peso de referência
  refWeightKg: z.number().positive(),
  studentsUsing: z.number().int().min(0),
  updatedAt: z.iso.date(),
  archived: z.boolean(),
})
export type DietTemplateSummary = z.infer<typeof DietTemplateSummary>

/** Aluno no painel "Atribuir dieta": o peso (para o ajuste) e a dieta que ele tem hoje. */
export const DietCandidate = z.object({
  studentId: z.string(),
  name: z.string(),
  status: z.enum(['active', 'pending', 'overdue', 'archived']),
  weightKg: z.number().positive().nullable(),
  current: z.object({ name: z.string(), until: z.iso.date() }).nullable(),
})
export type DietCandidate = z.infer<typeof DietCandidate>

/** GET /coach/diets */
export const CoachDiets = z.object({
  templates: z.array(DietTemplateSummary),
  /** Aba "Atribuídas a alunos": uma linha por aluno (planName junta as fichas dele) */
  assigned: z.array(z.object({ studentId: z.string(), studentName: z.string(), planName: z.string(), templateId: z.string().nullable(), validUntil: z.iso.date() })),
  candidates: z.array(DietCandidate),
  /** Quem assina as prescrições (aparece no painel de atribuir) */
  nutritionist: z.object({ name: z.string(), credential: z.string() }),
})
export type CoachDiets = z.infer<typeof CoachDiets>

/** POST /coach/diets/:id/assign */
export const AssignDiet = z.object({
  studentIds: z.array(z.string()).min(1),
  startsOn: z.iso.date(),
  scaleToWeight: z.boolean(),
})
export type AssignDiet = z.infer<typeof AssignDiet>
