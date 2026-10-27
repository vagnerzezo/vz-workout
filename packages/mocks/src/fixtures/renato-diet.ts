import type { Aisle, DietVariant, GroceryNeed, Meal, MealFood, MealPlan, Substitution } from '@workspace/core'

const g = (itemId: string, name: string, aisle: Aisle, amount: number, unit: GroceryNeed['unit'] = 'g'): GroceryNeed => ({
  itemId, name, aisle, amount, unit,
})

/** O que comprar para uma porção de cada alimento (grãos em peso cru). Quem não está aqui não entra na lista. */
const groceries: Record<string, GroceryNeed[]> = {
  pao_integral: [g('pao_integral', 'Pão integral', 'grains', 50)],
  ovos_mexidos: [g('ovos', 'Ovos', 'protein', 2, 'un')],
  banana: [g('banana', 'Banana prata', 'produce', 1, 'un')],
  cottage: [g('cottage', 'Queijo cottage', 'dairy', 40)],
  iogurte_natural: [g('iogurte_natural', 'Iogurte natural desnatado (170 g)', 'dairy', 1, 'un')],
  whey: [g('whey', 'Whey protein', 'other', 30)],
  arroz_branco: [g('arroz_branco', 'Arroz branco', 'grains', 50)],
  feijao: [g('feijao', 'Feijão carioca', 'grains', 40)],
  frango: [g('frango', 'Peito de frango', 'protein', 150)],
  salada: [g('alface', 'Alface', 'produce', 0.25, 'un'), g('tomate', 'Tomate', 'produce', 100)],
  azeite: [g('azeite', 'Azeite de oliva', 'other', 13, 'ml')],
  tapioca: [g('goma_tapioca', 'Goma de tapioca', 'grains', 40)],
  peito_peru: [g('peito_peru', 'Peito de peru', 'protein', 60)],
  pasta_amendoim: [g('pasta_amendoim', 'Pasta de amendoim', 'other', 15)],
  batata_doce: [g('batata_doce', 'Batata-doce', 'produce', 150)],
  patinho: [g('patinho', 'Patinho moído', 'protein', 120)],
  legumes: [g('legumes', 'Legumes (abobrinha, cenoura, brócolis)', 'produce', 100)],
  arroz_integral: [g('arroz_integral', 'Arroz integral', 'grains', 25)],
  iogurte_grego: [g('iogurte_grego', 'Iogurte grego zero (100 g)', 'dairy', 1, 'un')],
  castanha: [g('castanha', 'Castanha-do-pará', 'other', 1, 'un')],
}

const s = (foodId: string, name: string, portion: string, kcal: number, protein: number, carbs: number, fat: number): Substitution => ({
  foodId, name, portion, kcal, protein, carbs, fat,
})

const f = (foodId: string, name: string, portion: string, kcal: number, protein: number, carbs: number, fat: number, substitutes: Substitution[] = []): MealFood => ({
  ...s(foodId, name, portion, kcal, protein, carbs, fat),
  substitutes,
  groceries: groceries[foodId] ?? [],
})

const subs = {
  pao: [s('tapioca_goma', 'Tapioca (goma)', '40 g', 140, 0, 35, 0), s('cuscuz', 'Cuscuz de milho cozido', '120 g', 136, 3, 30, 1)],
  ovos: [s('frango_desfiado', 'Peito de frango desfiado', '70 g', 112, 22, 0, 2), s('cottage_100', 'Queijo cottage', '100 g', 98, 11, 3, 4)],
  fruta: [s('maca', 'Maçã', '1 unidade', 72, 0, 19, 0), s('mamao', 'Mamão papaia', '150 g', 60, 1, 15, 0)],
  arroz: [s('batata_inglesa', 'Batata inglesa cozida', '180 g', 155, 3, 36, 0), s('mandioca', 'Mandioca cozida', '100 g', 155, 1, 38, 0)],
  carne: [s('tilapia', 'Filé de tilápia grelhado', '180 g', 230, 38, 0, 8), s('patinho_grelhado', 'Patinho grelhado', '130 g', 240, 36, 0, 10)],
}

// Alimentos escolhidos para somar exatamente os números do canvas (dia de treino: 2.127 kcal · P 160 g)
const cafe: Meal = {
  id: 'cafe', name: 'Café da manhã', time: '07:30', note: null,
  foods: [
    f('pao_integral', 'Pão integral', '2 fatias', 140, 6, 24, 2, subs.pao),
    f('ovos_mexidos', 'Ovos mexidos', '2 unidades', 150, 13, 1, 10, subs.ovos),
    f('banana', 'Banana prata', '1 unidade', 90, 1, 23, 0, subs.fruta),
    f('cottage', 'Queijo cottage', '40 g', 40, 10, 2, 0),
  ],
}
const lanche: Meal = {
  id: 'lanche', name: 'Lanche', time: '10:00', note: 'Se não der tempo, o whey pode ir batido com água.',
  foods: [
    f('iogurte_natural', 'Iogurte natural desnatado', '170 g', 90, 8, 15, 0, [s('leite_desnatado', 'Leite desnatado', '250 ml', 88, 8, 12, 1)]),
    f('whey', 'Whey protein', '1 scoop (30 g)', 120, 12, 3, 6),
  ],
}
const almoco: Meal = {
  id: 'almoco', name: 'Almoço', time: '12:30', note: 'Comece pela salada. O azeite vai por cima dela, não para refogar.',
  foods: [
    f('arroz_branco', 'Arroz branco', '120 g', 155, 3, 34, 0, subs.arroz),
    f('feijao', 'Feijão carioca', '80 g', 60, 4, 11, 0),
    f('frango', 'Peito de frango grelhado', '150 g', 240, 33, 0, 8, subs.carne),
    f('salada', 'Salada verde', 'à vontade', 15, 2, 5, 0),
    f('azeite', 'Azeite de oliva', '1 colher de sopa', 140, 0, 0, 12),
  ],
}
const pre: Meal = {
  id: 'pre', name: 'Pré-treino', time: '16:00',
  note: 'Consuma de 60 a 90 minutos antes do treino. Se treinar em jejum, leve a banana para depois.',
  foods: [
    f('tapioca', 'Tapioca', '1 unidade média', 140, 0, 34, 0, [s('pao_frances', 'Pão francês', '1 unidade (50 g)', 150, 4, 29, 2), s('cuscuz', 'Cuscuz de milho cozido', '120 g', 136, 3, 30, 1)]),
    f('peito_peru', 'Peito de peru', '60 g', 60, 12, 1, 1, [s('ovo_cozido', 'Ovo cozido', '1 unidade', 70, 6, 1, 5), s('queijo_branco', 'Queijo minas frescal', '30 g', 66, 5, 1, 5)]),
    f('pasta_amendoim', 'Pasta de amendoim', '15 g', 100, 8, 5, 7),
  ],
}
const jantar: Meal = {
  id: 'jantar', name: 'Jantar', time: '20:00', note: null,
  foods: [
    f('batata_doce', 'Batata-doce', '150 g', 130, 2, 30, 0, [s('mandioquinha', 'Mandioquinha cozida', '160 g', 128, 2, 30, 0), s('abobora', 'Abóbora cabotiá', '300 g', 120, 4, 26, 1)]),
    f('patinho', 'Patinho moído', '120 g', 220, 32, 0, 13, subs.carne),
    f('legumes', 'Legumes cozidos', '100 g', 40, 2, 8, 0),
    f('arroz_integral', 'Arroz integral', '60 g', 90, 2, 10, 1),
  ],
}
const ceia: Meal = {
  id: 'ceia', name: 'Ceia', time: '22:30', note: null,
  foods: [
    f('iogurte_grego', 'Iogurte grego zero', '100 g', 60, 9, 4, 2),
    f('castanha', 'Castanha-do-pará', '1 unidade', 47, 1, 4, 2, [s('amendoas', 'Amêndoas', '8 unidades', 46, 2, 2, 4)]),
  ],
}
const livre: Meal = {
  id: 'livre', name: 'Refeição livre', time: '20:00', note: 'Aproveite sem culpa, mas sem exagero na quantidade.',
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
