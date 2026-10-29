import type { CalorieMode, DietTemplate } from '../schemas/diet-templates'
import { macroTargets } from './macros'

/** Taxa metabólica basal (Mifflin-St Jeor), em kcal. */
export function mifflinStJeor(p: { weightKg: number; heightCm: number; age: number; sex: 'male' | 'female' }): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161)
}

export const tdee = (bmr: number, factor: number) => bmr * factor

export const ACTIVITY_FACTORS: { label: string; value: number }[] = [
  { label: 'Sedentário', value: 1.2 },
  { label: 'Leve', value: 1.375 },
  { label: 'Moderado', value: 1.55 },
  { label: 'Intenso', value: 1.725 },
  { label: 'Muito intenso', value: 1.9 },
]

export const calorieModes: Record<CalorieMode, { label: string; note: string }> = {
  deficit20: { label: 'Déficit de 20%', note: '20% abaixo do gasto' },
  deficit500: { label: 'Déficit de 500', note: '500 kcal abaixo do gasto' },
  maintenance: { label: 'Manutenção', note: 'igual ao gasto estimado' },
  surplus10: { label: 'Superávit de 10%', note: '10% acima do gasto' },
  manual: { label: 'Manual', note: 'definida manualmente' },
}

/** Meta calórica do dia a partir do gasto total. */
export function targetKcal(total: number, mode: CalorieMode, manual: number | null): number {
  const value = { deficit20: total * 0.8, deficit500: total - 500, maintenance: total, surplus10: total * 1.1, manual: manual ?? total }[mode]
  return Math.round(value)
}

/** Gasto e metas de um modelo, no peso de referência ou no peso de um aluno. */
export function templateTargets(t: Pick<DietTemplate, 'reference' | 'activityFactor' | 'calorieMode' | 'manualKcal' | 'proteinPerKg' | 'fatPerKg'>, weightKg = t.reference.weightKg) {
  const bmr = mifflinStJeor({ ...t.reference, weightKg })
  const total = tdee(bmr, t.activityFactor)
  const manual = t.manualKcal === null ? null : t.manualKcal * (weightKg / t.reference.weightKg)
  return { bmr, total, targets: macroTargets(targetKcal(total, t.calorieMode, manual), t.proteinPerKg, t.fatPerKg, weightKg) }
}

