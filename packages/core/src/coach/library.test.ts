import { describe, expect, it } from 'vitest'
import type { LibraryExercise, LibraryFood } from '../schemas/coach-library'
import { filterExercises, filterFoods, householdLabel, parseSteps } from './library'

const ex = (over: Partial<LibraryExercise>): LibraryExercise => ({ id: 'e', name: 'Exercício', primary: 'chest', secondary: [], equipment: 'Máquina', videoUrl: null, origin: 'base', level: 'beginner', steps: [], alternatives: [], videoSeconds: 20, uses: 0, ...over })
const food = (over: Partial<LibraryFood>): LibraryFood => ({ id: 'f', name: 'Alimento', group: 'carbs', per100: { kcal: 100, protein: 1, carbs: 20, fat: 1 }, unit: null, unitGrams: null, alternatives: [], origin: 'taco', diets: 0, ...over })

describe('biblioteca', () => {
  const list = [ex({ id: 'hack', name: 'Agachamento hack', primary: 'quads' }), ex({ id: 'meadows', name: 'Remada Meadows', primary: 'upperBack', videoSeconds: null }), ex({ id: 'meu', name: 'Afundo búlgaro com pausa', primary: 'quads', origin: 'coach' })]

  it('filtra por busca, grupo, origem e sem vídeo; os meus primeiro', () => {
    expect(filterExercises(list, { query: '', group: 'Pernas', origin: 'all', noVideo: false }).map((e) => e.id)).toEqual(['meu', 'hack'])
    expect(filterExercises(list, { query: 'remada', group: null, origin: 'all', noVideo: false }).map((e) => e.id)).toEqual(['meadows'])
    expect(filterExercises(list, { query: '', group: null, origin: 'base', noVideo: true }).map((e) => e.id)).toEqual(['meadows'])
  })

  it('alimentos, medida caseira e passo a passo', () => {
    expect(filterFoods([food({ id: 'a', name: 'Pão francês' }), food({ id: 'w', name: 'Whey', origin: 'label' })], 'label').map((f) => f.id)).toEqual(['w'])
    expect(filterFoods([food({ id: 'a', name: 'Pão francês' })], 'all', 'pao').map((f) => f.id)).toEqual(['a'])
    expect(householdLabel({ unit: 'un.', unitGrams: 50 })).toBe('1 unidade = 50 g')
    expect(householdLabel({ unit: 'colher de sopa', unitGrams: 15 })).toBe('1 colher de sopa = 15 g')
    expect(householdLabel({ unit: null, unitGrams: null })).toBe('pesado pronto')
    expect(parseSteps('Peito apoiado\n\n  Puxe os cotovelos  \n')).toEqual(['Peito apoiado', 'Puxe os cotovelos'])
  })
})
