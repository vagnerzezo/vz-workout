import { describe, expect, it } from 'vitest'
import type { Exercise } from '../schemas/workout'
import { estimatedOneRepMax } from './session'
import { sessionRecord } from './records'
import { volumeStatus, weeklyVolume } from './volume'

const prev = (kg: number, reps: number) => ({ kind: 'working' as const, kg, reps })
const best = (sets: { kg: number; reps: number }[]) => Math.max(...sets.map((s) => estimatedOneRepMax(s.kg, s.reps)))

describe('sessionRecord', () => {
  it('maior carga', () => {
    const before = [prev(80, 9), prev(80, 8)]
    expect(sessionRecord([{ key: 'v1', kg: 85, reps: 8 }], before, best(before))).toEqual({
      kind: 'load',
      now: { kg: 85, reps: 8 },
      before: { kg: 80, reps: 9 },
    })
  })

  it('mais repetições com a mesma carga', () => {
    const before = [prev(45, 11), prev(45, 10)]
    expect(sessionRecord([{ key: 'v1', kg: 45, reps: 12 }], before, best(before))?.kind).toBe('reps')
  })

  it('marca melhor com menos carga e muito mais repetições', () => {
    const before = [prev(50, 8)]
    expect(sessionRecord([{ key: 'v1', kg: 45, reps: 15 }], before, best(before))?.kind).toBe('best')
  })

  it('sem recorde quando não passa do histórico', () => {
    const before = [prev(80, 9)]
    expect(sessionRecord([{ key: 'v1', kg: 80, reps: 8 }], before, best(before))).toBeNull()
  })

  it('primeira vez no exercício conta como recorde, sem "antes"', () => {
    expect(sessionRecord([{ key: 'v1', kg: 20, reps: 10 }], [], null)).toMatchObject({ kind: 'load', before: null })
  })
})

// Exemplo da seção 9.1 do guia
const lib: Record<string, Exercise> = {
  bench: { id: 'bench', name: 'Supino', primary: 'chest', secondary: ['triceps', 'shoulders'], equipment: 'Barra', videoUrl: null, origin: 'base' },
}

describe('weeklyVolume', () => {
  it('conta 1 para o músculo principal e 0,5 para os secundários', () => {
    const v = weeklyVolume([{ exercises: [{ exerciseId: 'bench', workingSets: 4 }] }], lib)
    expect(v.get('chest')).toBe(4)
    expect(v.get('triceps')).toBe(2)
  })

  it('aplica o multiplicador da fase (deload ×0,5) sem zerar séries', () => {
    const v = weeklyVolume([{ exercises: [{ exerciseId: 'bench', workingSets: 1 }] }], lib, 0.5)
    expect(v.get('chest')).toBe(1)
  })

  it('ignora exercícios sem séries', () => {
    expect(weeklyVolume([{ exercises: [{ exerciseId: 'bench', workingSets: 0 }] }], lib).size).toBe(0)
  })
})

describe('volumeStatus', () => {
  it.each([[9, 'low'], [10, 'ok'], [20, 'ok'], [21, 'high']] as const)('%i séries → %s', (n, s) => {
    expect(volumeStatus(n)).toBe(s)
  })
})
