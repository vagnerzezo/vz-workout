import { describe, expect, it } from 'vitest'
import { formatClock, formatKg, formatRest, parseDecimal } from '../format/numbers'
import { musclesLine } from './muscles'
import {
  applyPhase,
  estimatedOneRepMax,
  exerciseInitials,
  personalRecordKey,
  planSets,
  repsFloor,
  sessionVolume,
  shortExerciseName,
} from './session'

const hack = { id: 'day_c_1', warmupSets: 1, prepSets: 1, workingSets: 3 }

describe('planSets', () => {
  it('ordena aquecimento, preparatória e válidas, numerando só as válidas', () => {
    const sets = planSets(hack, null)
    expect(sets.map((s) => s.label)).toEqual(['A', 'P', '1', '2', '3'])
    expect(sets.map((s) => s.key)).toEqual(['day_c_1:w1', 'day_c_1:p1', 'day_c_1:v1', 'day_c_1:v2', 'day_c_1:v3'])
  })

  it('casa cada série com a anterior do mesmo tipo', () => {
    const sets = planSets(hack, null, [
      { kind: 'warmup', kg: 40, reps: 12 },
      { kind: 'prep', kg: 70, reps: 10 },
      { kind: 'working', kg: 80, reps: 9 },
      { kind: 'working', kg: 80, reps: 8 },
    ])
    expect(sets.map((s) => s.previous && `${s.previous.kg}×${s.previous.reps}`)).toEqual(['40×12', '70×10', '80×9', '80×8', null])
  })

  it('aplica a fase e soma as séries adicionadas', () => {
    expect(planSets(hack, { setMultiplier: 0.5 }).filter((s) => s.kind === 'working')).toHaveLength(2)
    expect(planSets(hack, null, [], 2).at(-1)).toMatchObject({ key: 'day_c_1:v5', label: '5' })
  })
})

describe('applyPhase', () => {
  it.each([
    [4, 1, 4],
    [4, 0.7, 3],
    [1, 0.5, 1],
  ])('%i séries × %f → %i', (sets, mult, expected) => {
    expect(applyPhase(sets, { setMultiplier: mult })).toBe(expected)
  })
})

describe('recordes', () => {
  it('Epley: 100 kg × 10 ≈ 133 kg; uma repetição é a própria carga', () => {
    expect(estimatedOneRepMax(100, 10)).toBeCloseTo(133.3, 1)
    expect(estimatedOneRepMax(100, 1)).toBe(100)
    expect(estimatedOneRepMax(100, 0)).toBe(0)
  })

  it('marca só a melhor série do dia, se passar do histórico', () => {
    const done = [
      { key: 'v1', kg: 85, reps: 9 },
      { key: 'v2', kg: 85, reps: 8 },
    ]
    expect(personalRecordKey(done, estimatedOneRepMax(80, 9))).toBe('v1')
    expect(personalRecordKey(done, estimatedOneRepMax(90, 9))).toBeNull()
    expect(personalRecordKey([], null)).toBeNull()
  })
})

describe('auxiliares', () => {
  it('volume soma carga × repetições', () => {
    expect(sessionVolume([{ kg: 40, reps: 12 }, { kg: 85, reps: 9 }])).toBe(1245)
  })

  it('iniciais e nome curto ignoram o equipamento entre parênteses', () => {
    expect(exerciseInitials('Agachamento hack (máquina)')).toBe('AH')
    expect(exerciseInitials('Stiff')).toBe('S')
    expect(shortExerciseName('Agachamento hack (máquina)')).toBe('Agachamento hack')
  })

  it('menor número da faixa de repetições', () => {
    expect(repsFloor('6–9')).toBe(6)
    expect(repsFloor('AMRAP')).toBeNull()
  })

  it('músculos com o principal primeiro', () => {
    expect(musclesLine('quads', ['glutes'])).toBe('Quadríceps · Glúteos')
  })
})

describe('formatação do treino', () => {
  it.each([
    [72, '01:12'],
    [0, '00:00'],
    [1475, '24:35'],
    [3725, '1:02:05'],
  ])('relógio %i s → %s', (s, expected) => {
    expect(formatClock(s)).toBe(expected)
  })

  it.each([
    [150, '2min 30s'],
    [90, '1min 30s'],
    [60, '1min'],
    [45, '45s'],
  ])('descanso %i s → %s', (s, expected) => {
    expect(formatRest(s)).toBe(expected)
  })

  it('carga com vírgula', () => {
    expect(formatKg(82.5)).toBe('82,5')
    expect(formatKg(85)).toBe('85')
    expect(parseDecimal('82,5')).toBe(82.5)
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
  })
})
