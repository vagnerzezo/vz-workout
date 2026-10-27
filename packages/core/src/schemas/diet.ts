import { z } from 'zod'

export const Macros = z.object({
  kcal: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
})
export type Macros = z.infer<typeof Macros>

/** Opção que a nutri liberou no lugar de um alimento, já na porção equivalente. */
export const Substitution = Macros.extend({
  foodId: z.string(),
  name: z.string(), // "Cuscuz de milho"
  portion: z.string(), // "120 g"
})
export type Substitution = z.infer<typeof Substitution>

/** Seções do mercado, na ordem em que aparecem na lista de compras. */
export const Aisle = z.enum(['produce', 'protein', 'grains', 'dairy', 'other'])
export type Aisle = z.infer<typeof Aisle>

/** O que comprar para uma porção: "Tapioca 1 unidade média" → 40 g de goma de tapioca. */
export const GroceryNeed = z.object({
  itemId: z.string(),
  name: z.string(), // "Goma de tapioca"
  aisle: Aisle,
  amount: z.number().positive(),
  unit: z.enum(['g', 'ml', 'un']),
})
export type GroceryNeed = z.infer<typeof GroceryNeed>

/** Alimento dentro de uma refeição, com a porção que a nutri prescreveu. */
export const MealFood = Substitution.extend({
  substitutes: z.array(Substitution),
  groceries: z.array(GroceryNeed), // vazio: não entra na lista de compras (ex.: refeição livre)
})
export type MealFood = z.infer<typeof MealFood>

export const Meal = z.object({
  id: z.string(),
  name: z.string(), // "Café da manhã"
  time: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().nullable(), // observação da nutri
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
  /** Substituições escolhidas no dia: refeição → alimento → substituto */
  swaps: z.record(z.string(), z.record(z.string(), z.string())),
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
