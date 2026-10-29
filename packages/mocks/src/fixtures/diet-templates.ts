import type { DietTemplate, Food, FoodGroup, TemplateMeal } from '@workspace/core'
import { toIsoDate } from '@workspace/core'

const food = (id: string, name: string, group: FoodGroup, kcal: number, protein: number, carbs: number, fat: number, unit: [string, number] | null, alternatives: string[] = []): Food => ({
  id, name, group, per100: { kcal, protein, carbs, fat }, unit: unit?.[0] ?? null, unitGrams: unit?.[1] ?? null, alternatives,
})

/** Tabela de alimentos do editor (por 100 g, aproximada da TACO; suplementos pelo rótulo). Os 21 primeiros são os do canvas. */
export const foodTable: Food[] = [
  food('pao', 'Pão francês', 'carbs', 300, 8, 58.6, 3.1, ['un.', 50], ['tapioca', 'cuscuz']),
  food('tapioca', 'Goma de tapioca', 'carbs', 240, 0, 60, 0, null, ['pao', 'cuscuz']),
  food('cuscuz', 'Cuscuz de milho cozido', 'carbs', 113, 2.2, 25.3, 0.7, null, ['pao', 'tapioca']),
  food('ovo', 'Ovo de galinha inteiro', 'protein', 146, 13.3, 0.6, 9.5, ['un.', 50], ['queijo']),
  food('queijo', 'Queijo minas frescal', 'dairy', 264, 17.4, 3.2, 20.2, null, ['ovo']),
  food('mamao', 'Mamão papaia', 'fruit', 40, 0.5, 10.4, 0.1, null, ['banana', 'maca']),
  food('banana', 'Banana prata', 'fruit', 98, 1.3, 26, 0.1, ['un.', 70], ['maca', 'mamao']),
  food('maca', 'Maçã fuji', 'fruit', 56, 0.3, 15.2, 0, ['un.', 130], ['banana', 'mamao']),
  food('iogurte', 'Iogurte natural', 'dairy', 51, 4.1, 1.9, 3, ['pote', 170]),
  food('aveia', 'Aveia em flocos', 'carbs', 394, 13.9, 66.6, 8.5, ['colher de sopa', 15], ['tapioca']),
  food('arroz_integral', 'Arroz integral cozido', 'carbs', 124, 2.6, 25.8, 1, null, ['arroz_branco', 'batata_doce']),
  food('arroz_branco', 'Arroz branco cozido', 'carbs', 128, 2.5, 28.1, 0.2, null, ['arroz_integral', 'batata_doce']),
  food('feijao', 'Feijão carioca cozido', 'carbs', 76, 4.8, 13.6, 0.5, ['concha', 100], ['lentilha']),
  food('frango', 'Peito de frango grelhado', 'protein', 159, 32, 0, 2.5, null, ['patinho', 'tilapia']),
  food('patinho', 'Patinho moído grelhado', 'protein', 219, 35.9, 0, 7.3, null, ['frango', 'tilapia']),
  food('tilapia', 'Filé de tilápia grelhado', 'protein', 96, 20.1, 0, 1.7, null, ['frango', 'patinho']),
  food('batata_doce', 'Batata-doce cozida', 'carbs', 77, 0.6, 18.4, 0.1, null, ['arroz_branco', 'arroz_integral']),
  food('brocolis', 'Brócolis cozido', 'vegetables', 25, 2.1, 4.4, 0.5, null),
  food('azeite', 'Azeite de oliva', 'fats', 884, 0, 0, 100, ['colher de sopa', 8]),
  food('whey', 'Whey protein (rótulo)', 'protein', 400, 80, 8, 6, ['scoop', 30]),
  food('amendoim', 'Pasta de amendoim', 'fats', 590, 25, 20, 50, ['colher de sopa', 15], ['castanha']),
  // Usados nas outras dietas
  food('castanha', 'Castanha-do-pará', 'fats', 643, 14.5, 15.1, 63.5, ['un.', 4], ['amendoim']),
  food('macarrao', 'Macarrão cozido', 'carbs', 102, 3.4, 19.9, 1.2, null, ['arroz_branco', 'batata_doce']),
  food('salmao', 'Salmão grelhado', 'protein', 243, 26.1, 0, 14.5, null, ['tilapia', 'frango']),
  food('tofu', 'Tofu firme', 'protein', 81, 8.5, 2, 4.2, null, ['ovo']),
  food('lentilha', 'Lentilha cozida', 'carbs', 93, 6.3, 16.3, 0.5, ['concha', 100], ['feijao', 'grao_de_bico']),
  food('grao_de_bico', 'Grão-de-bico cozido', 'carbs', 164, 8.9, 27.4, 2.6, null, ['lentilha', 'feijao']),
  food('abacate', 'Abacate', 'fats', 96, 1.2, 6, 8.4, null),
  food('salada', 'Salada de folhas e tomate', 'vegetables', 15, 1, 2.8, 0.2, null),
  food('cottage', 'Queijo cottage', 'dairy', 98, 11.1, 3.4, 4.3, null, ['queijo']),
]

type F = [foodId: string, grams: number, substitutes?: string[]]
type M = [name: string, time: string, foods: F[]]

const meals = (id: string, list: M[]): TemplateMeal[] =>
  list.map(([name, time, foods], i) => ({
    id: `${id}_m${i + 1}`,
    name,
    time,
    foods: foods.map(([foodId, grams, substitutes], k) => ({ id: `${id}_m${i + 1}_${k + 1}`, foodId, grams, substitutes: substitutes ?? [] })),
  }))

type Seed = Omit<DietTemplate, 'meals' | 'updatedAt' | 'archived' | 'notes'> & { daysAgo: number; archived?: boolean; meals: M[]; notes?: string }

const NOTES = 'Pese os alimentos já prontos. Use temperos naturais à vontade. Meta de água: 3,5 L por dia.'
const man = (weightKg: number, heightCm: number, age: number) => ({ weightKg, heightCm, age, sex: 'male' as const })
const woman = (weightKg: number, heightCm: number, age: number) => ({ weightKg, heightCm, age, sex: 'female' as const })

const seeds: Seed[] = [
  {
    // A dieta do editor do canvas
    id: 'diet_recomp_treino', name: 'Dia de treino — recomposição', appLabel: 'Dia de treino', goal: 'recomposition', reference: man(91.6, 182, 33), activityFactor: 1.55, calorieMode: 'manual', manualKcal: 2127, proteinPerKg: 1.9, fatPerKg: 0.8, daysAgo: 8,
    meals: [
      ['Café da manhã', '07:30', [['pao', 50, ['tapioca', 'cuscuz']], ['ovo', 100, ['queijo']], ['mamao', 150, ['banana']]]],
      ['Lanche', '10:00', [['iogurte', 170], ['aveia', 30]]],
      ['Almoço', '12:30', [['arroz_integral', 150, ['arroz_branco', 'batata_doce']], ['feijao', 100], ['frango', 150, ['patinho', 'tilapia']], ['brocolis', 100], ['azeite', 8]]],
      ['Pré-treino', '16:00', [['banana', 70, ['maca']], ['aveia', 30], ['whey', 30]]],
      ['Jantar', '20:00', [['batata_doce', 200, ['arroz_branco']], ['patinho', 130, ['frango', 'tilapia']], ['brocolis', 80], ['azeite', 5]]],
      ['Ceia', '22:30', [['iogurte', 170], ['amendoim', 15]]],
    ],
  },
  {
    id: 'diet_recomp_descanso', name: 'Dia de descanso — recomposição', appLabel: 'Dia de descanso', goal: 'recomposition', reference: man(91.6, 182, 33), activityFactor: 1.375, calorieMode: 'manual', manualKcal: 1890, proteinPerKg: 1.75, fatPerKg: 0.75, daysAgo: 8,
    meals: [
      ['Café da manhã', '08:00', [['ovo', 150, ['queijo']], ['pao', 50, ['tapioca']], ['mamao', 150, ['banana']]]],
      ['Lanche', '10:30', [['iogurte', 170], ['castanha', 12, ['amendoim']]]],
      ['Almoço', '13:00', [['arroz_branco', 120, ['batata_doce']], ['feijao', 100], ['frango', 170, ['patinho', 'tilapia']], ['salada', 100], ['azeite', 8]]],
      ['Lanche da tarde', '16:30', [['whey', 30], ['banana', 70, ['maca']]]],
      ['Jantar', '20:00', [['tilapia', 200, ['frango']], ['batata_doce', 150, ['arroz_branco']], ['brocolis', 100], ['azeite', 5]]],
    ],
  },
  {
    id: 'diet_cut1600', name: 'Emagrecimento 1.600 kcal', appLabel: 'Dieta', goal: 'fatLoss', reference: woman(70, 165, 35), activityFactor: 1.375, calorieMode: 'manual', manualKcal: 1600, proteinPerKg: 1.85, fatPerKg: 0.75, daysAgo: 19,
    meals: [
      ['Café da manhã', '07:30', [['ovo', 100, ['queijo']], ['tapioca', 30, ['pao']], ['mamao', 150, ['banana']]]],
      ['Lanche', '10:00', [['iogurte', 170], ['maca', 130, ['banana']]]],
      ['Almoço', '12:30', [['arroz_integral', 100, ['batata_doce']], ['feijao', 80], ['frango', 130, ['tilapia', 'patinho']], ['salada', 150], ['azeite', 5]]],
      ['Lanche da tarde', '16:00', [['whey', 30], ['aveia', 20]]],
      ['Jantar', '19:30', [['tilapia', 150, ['frango']], ['brocolis', 120], ['batata_doce', 80, ['arroz_branco']]]],
    ],
  },
  {
    id: 'diet_bulk2800', name: 'Hipertrofia 2.800 kcal', appLabel: 'Dieta', goal: 'hypertrophy', reference: man(85, 178, 28), activityFactor: 1.725, calorieMode: 'manual', manualKcal: 2800, proteinPerKg: 2, fatPerKg: 0.9, daysAgo: 26,
    meals: [
      ['Café da manhã', '07:00', [['pao', 100, ['tapioca', 'cuscuz']], ['ovo', 150, ['queijo']], ['banana', 140, ['mamao']]]],
      ['Lanche', '10:00', [['aveia', 60], ['whey', 30], ['amendoim', 20, ['castanha']]]],
      ['Almoço', '12:30', [['arroz_branco', 250, ['macarrao', 'batata_doce']], ['feijao', 150], ['patinho', 180, ['frango']], ['salada', 100], ['azeite', 10]]],
      ['Pré-treino', '16:00', [['banana', 140, ['maca']], ['tapioca', 50, ['pao']], ['whey', 30]]],
      ['Jantar', '20:00', [['macarrao', 250, ['arroz_branco']], ['frango', 180, ['patinho', 'salmao']], ['brocolis', 100], ['azeite', 10]]],
      ['Ceia', '22:30', [['iogurte', 170], ['aveia', 30]]],
    ],
  },
  {
    id: 'diet_lowcarb', name: 'Low carb 1.800 kcal', appLabel: 'Dieta', goal: 'fatLoss', reference: man(78, 175, 40), activityFactor: 1.375, calorieMode: 'manual', manualKcal: 1800, proteinPerKg: 1.9, fatPerKg: 1.2, daysAgo: 32,
    meals: [
      ['Café da manhã', '07:30', [['ovo', 150, ['queijo']], ['abacate', 100]]],
      ['Lanche', '10:00', [['cottage', 100, ['queijo']], ['castanha', 12]]],
      ['Almoço', '12:30', [['salmao', 150, ['frango', 'patinho']], ['salada', 200], ['brocolis', 150], ['azeite', 10]]],
      ['Lanche da tarde', '16:00', [['iogurte', 170], ['amendoim', 15]]],
      ['Jantar', '19:30', [['frango', 180, ['tilapia', 'patinho']], ['brocolis', 150], ['azeite', 10]]],
    ],
  },
  {
    id: 'diet_veg', name: 'Vegetariana 2.000 kcal', appLabel: 'Dieta', goal: 'maintenance', reference: woman(68, 168, 30), activityFactor: 1.55, calorieMode: 'manual', manualKcal: 2000, proteinPerKg: 1.6, fatPerKg: 0.9, daysAgo: 53,
    meals: [
      ['Café da manhã', '07:30', [['pao', 50, ['tapioca']], ['ovo', 100, ['tofu']], ['banana', 70, ['mamao']]]],
      ['Lanche', '10:00', [['iogurte', 170], ['aveia', 30]]],
      ['Almoço', '12:30', [['arroz_integral', 150, ['batata_doce']], ['lentilha', 150, ['feijao', 'grao_de_bico']], ['tofu', 150, ['ovo']], ['salada', 100], ['azeite', 8]]],
      ['Lanche da tarde', '16:00', [['whey', 30], ['maca', 130]]],
      ['Jantar', '20:00', [['macarrao', 150, ['arroz_branco']], ['grao_de_bico', 120, ['lentilha']], ['brocolis', 100], ['azeite', 8]]],
    ],
  },
  { id: 'diet_old_cut', name: 'Emagrecimento 1.400 kcal (2025)', appLabel: 'Dieta', goal: 'fatLoss', reference: woman(65, 162, 32), activityFactor: 1.375, calorieMode: 'manual', manualKcal: 1400, proteinPerKg: 1.8, fatPerKg: 0.7, daysAgo: 220, archived: true, meals: [['Almoço', '12:30', [['arroz_integral', 80], ['frango', 120], ['salada', 150]]]] },
  { id: 'diet_old_bulk', name: 'Bulking 3.200 kcal', appLabel: 'Dieta', goal: 'hypertrophy', reference: man(80, 180, 24), activityFactor: 1.725, calorieMode: 'manual', manualKcal: 3200, proteinPerKg: 2, fatPerKg: 1, daysAgo: 260, archived: true, meals: [['Almoço', '12:30', [['arroz_branco', 300], ['patinho', 200], ['feijao', 150]]]] },
  { id: 'diet_old_keto', name: 'Cetogênica adaptada', appLabel: 'Dieta', goal: 'fatLoss', reference: man(90, 178, 38), activityFactor: 1.2, calorieMode: 'manual', manualKcal: 1900, proteinPerKg: 1.6, fatPerKg: 1.5, daysAgo: 300, archived: true, meals: [['Almoço', '12:30', [['salmao', 200], ['abacate', 100], ['brocolis', 150]]]] },
  { id: 'diet_old_summer', name: 'Projeto verão', appLabel: 'Dieta', goal: 'recomposition', reference: woman(62, 160, 27), activityFactor: 1.55, calorieMode: 'manual', manualKcal: 1700, proteinPerKg: 1.8, fatPerKg: 0.8, daysAgo: 340, archived: true, meals: [['Almoço', '12:30', [['arroz_integral', 100], ['tilapia', 150], ['salada', 150]]]] },
]

export function dietTemplates(now: Date): DietTemplate[] {
  return seeds.map(({ daysAgo, archived, meals: list, notes, ...t }) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() - daysAgo)
    return { ...t, meals: meals(t.id, list), notes: notes ?? NOTES, updatedAt: toIsoDate(d), archived: archived ?? false }
  })
}

/** Quantos alunos ativos (na ordem da carteira) usam cada dieta. O Renato é o primeiro: recomposição. */
export const initialDietUsage: [string[], number][] = [
  [['diet_recomp_treino', 'diet_recomp_descanso'], 19],
  [['diet_cut1600'], 15],
  [['diet_bulk2800'], 9],
  [['diet_lowcarb'], 6],
  [['diet_veg'], 3],
]

export const nutritionist = { name: 'Paula Mendes', credential: 'CRN-2 12345' }
