import type { DietVariant, Meal, MealFood, MealPlan } from '@workspace/core'

const f = (foodId: string, name: string, portion: string, kcal: number, protein: number, carbs: number, fat: number): MealFood => ({
  foodId, name, portion, kcal, protein, carbs, fat,
})

// Alimentos escolhidos para somar exatamente os números do canvas (dia de treino: 2.127 kcal · P 160 g)
const cafe: Meal = {
  id: 'cafe', name: 'Café da manhã', time: '07:30',
  foods: [
    f('pao_integral', 'Pão integral', '2 fatias', 140, 6, 24, 2),
    f('ovos_mexidos', 'Ovos mexidos', '2 unidades', 150, 13, 1, 10),
    f('banana', 'Banana prata', '1 unidade', 90, 1, 23, 0),
    f('cottage', 'Queijo cottage', '40 g', 40, 10, 2, 0),
  ],
}
const lanche: Meal = {
  id: 'lanche', name: 'Lanche', time: '10:00',
  foods: [
    f('iogurte_natural', 'Iogurte natural desnatado', '170 g', 90, 8, 15, 0),
    f('whey', 'Whey protein', '1 scoop (30 g)', 120, 12, 3, 6),
  ],
}
const almoco: Meal = {
  id: 'almoco', name: 'Almoço', time: '12:30',
  foods: [
    f('arroz_branco', 'Arroz branco', '120 g', 155, 3, 34, 0),
    f('feijao', 'Feijão carioca', '80 g', 60, 4, 11, 0),
    f('frango', 'Peito de frango grelhado', '150 g', 240, 33, 0, 8),
    f('salada', 'Salada verde', 'à vontade', 15, 2, 5, 0),
    f('azeite', 'Azeite de oliva', '1 colher de sopa', 140, 0, 0, 12),
  ],
}
const pre: Meal = {
  id: 'pre', name: 'Pré-treino', time: '16:00',
  foods: [
    f('tapioca', 'Tapioca', '1 unidade média', 140, 0, 34, 0),
    f('peito_peru', 'Peito de peru', '60 g', 60, 12, 1, 1),
    f('pasta_amendoim', 'Pasta de amendoim', '15 g', 100, 8, 5, 7),
  ],
}
const jantar: Meal = {
  id: 'jantar', name: 'Jantar', time: '20:00',
  foods: [
    f('batata_doce', 'Batata-doce', '150 g', 130, 2, 30, 0),
    f('patinho', 'Patinho moído', '120 g', 220, 32, 0, 13),
    f('legumes', 'Legumes cozidos', '100 g', 40, 2, 8, 0),
    f('arroz_integral', 'Arroz integral', '60 g', 90, 2, 10, 1),
  ],
}
const ceia: Meal = {
  id: 'ceia', name: 'Ceia', time: '22:30',
  foods: [
    f('iogurte_grego', 'Iogurte grego zero', '100 g', 60, 9, 4, 2),
    f('castanha', 'Castanha-do-pará', '1 unidade', 47, 1, 4, 2),
  ],
}
const livre: Meal = {
  id: 'livre', name: 'Refeição livre', time: '20:00',
  foods: [f('livre', 'Refeição livre', 'com moderação', 800, 35, 80, 35)],
}

const variants: DietVariant[] = [
  {
    id: 'dieta_treino', label: 'Dia de treino', kind: 'training',
    goals: { kcal: 2127, protein: 160, carbs: 230, fat: 70 },
    meals: [cafe, lanche, almoco, pre, jantar, ceia],
  },
  {
    id: 'dieta_descanso', label: 'Dia de descanso', kind: 'rest',
    goals: { kcal: 1827, protein: 160, carbs: 170, fat: 70 },
    meals: [cafe, lanche, almoco, jantar, ceia],
  },
  {
    id: 'dieta_livre', label: 'Refeição livre', kind: 'free',
    goals: { kcal: 2450, protein: 160, carbs: 260, fat: 90 },
    meals: [cafe, lanche, almoco, pre, livre, ceia],
  },
]

export const renatoDiet: MealPlan = {
  id: 'diet_renato_b2',
  updatedAt: '2026-10-13',
  authorRole: 'nutritionist',
  notes: [
    { title: 'Água', text: 'mínimo de 3,5 L por dia; aumente nos dias de treino.' },
    { title: 'Substituições', text: 'troque o arroz por batata ou mandioca na mesma quantidade de calorias, se preferir.' },
    { title: 'Refeição livre', text: 'uma vez por semana, de preferência depois do treino de pernas.' },
  ],
  variants,
}

/** Quanto do plano o Renato cumpriu nos dias anteriores da semana, como no canvas (96%, 88%…). */
export const pastDayPercents = [96, 88, 92, 100, 85, 90]
