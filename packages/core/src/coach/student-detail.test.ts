import { describe, expect, it } from 'vitest'
import { effortTone, ratingTone, recentWeights, weightChange, weightChart } from './student-detail'

describe('weightChange', () => {
  it('peso atual e a diferença desde a primeira pesagem', () => {
    expect(weightChange([{ kg: 85 }, { kg: 84.6 }, { kg: 82.4 }])).toEqual({ currentKg: 82.4, deltaKg: -2.6 })
  })

  it('sem pesagens', () => {
    expect(weightChange([])).toBeNull()
  })
})

describe('recentWeights', () => {
  it('mantém só as 12 últimas semanas', () => {
    const now = new Date(2026, 9, 21)
    const list = [{ date: '2026-07-20' }, { date: '2026-07-29' }, { date: '2026-10-14' }]
    expect(recentWeights(list, now).map((w) => w.date)).toEqual(['2026-07-29', '2026-10-14'])
  })
})

describe('weightChart', () => {
  it('a meta entra na escala: o ponto mais baixo do quadro é a meta', () => {
    const { points, goalY } = weightChart([{ kg: 85 }, { kg: 80 }], 75, 100, 100, 0)
    expect(points).toBe('0,0 100,50')
    expect(goalY).toBe(100)
  })

  it('sem meta e com um peso só', () => {
    expect(weightChart([{ kg: 80 }], null, 100, 50, 5)).toEqual({ points: '0,5', goalY: null })
  })
})

describe('tons', () => {
  it.each([
    [10, 'max'],
    [9, 'max'],
    [8, 'hard'],
    [7, 'hard'],
    [6, 'easy'],
  ] as const)('esforço %d → %s', (e, tone) => {
    expect(effortTone(e)).toBe(tone)
  })

  it.each([
    [5, 'good'],
    [4, 'good'],
    [3, 'warning'],
    [2, 'bad'],
  ])('nota %d → %s', (v, tone) => {
    expect(ratingTone(v)).toBe(tone)
  })
})
