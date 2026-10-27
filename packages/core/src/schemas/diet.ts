import { z } from 'zod'

export const Macros = z.object({
  kcal: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
})
export type Macros = z.infer<typeof Macros>

/** Alimento dentro de uma refeição, com a porção que a nutri prescreveu. */
export const MealFood = Macros.extend({
  foodId: z.string(),
  name: z.string(), // "Ovos mexidos"
  portion: z.string(), // "2 unidades"
})
export type MealFood = z.infer<typeof MealFood>

export const Meal = z.object({
  id: z.string(),
  name: z.string(), // "Café da manhã"
  time: z.string().regex(/^\d{2}:\d{2}$/),
  foods: z.array(MealFood),
})
export type Meal = z.infer<typeof Meal>

/** Uma das fichas que a nutri montou: dia de treino, dia de descanso, refeição livre… */
export const DietVariant = z.object({
  id: z.string(),
  label: z.string(), // "Dia de treino"
  kind: z.enum(['training', 'rest', 'free']),
  goals: Macros,
  meals: z.array(Meal),
})
export type DietVariant = z.infer<typeof DietVariant>

export const MealPlan = z.object({
  id: z.string(),
  updatedAt: z.iso.date(),
  authorRole: z.enum(['coach', 'nutritionist']), // quem montou: "pelo treinador" ou "pela nutri"
  notes: z.array(z.object({ title: z.string(), text: z.string() })),
  variants: z.array(DietVariant).min(1),
})
export type MealPlan = z.infer<typeof MealPlan>

export const DietDay = z.object({
  date: z.iso.date(),
  variantId: z.string(),
  doneMealIds: z.array(z.string()),
})
export type DietDay = z.infer<typeof DietDay>

/** Resposta de GET /me/diet?date=2026-10-21 */
export const StudentDiet = z.object({
  plan: MealPlan.nullable(), // null = a nutri ainda não montou a dieta
  day: DietDay.nullable(),
  /** Segunda a domingo da semana da data pedida; percent = kcal concluídas / meta (null no futuro) */
  week: z.array(z.object({ date: z.iso.date(), percent: z.number().min(0).nullable() })).length(7),
})
export type StudentDiet = z.infer<typeof StudentDiet>
