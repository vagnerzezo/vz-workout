import { describe, expect, it } from 'vitest'
import { chartY, linePoints, loadGain, measurementRows, weeklyBestLoads, weightDomain, weightWindow } from './progress'

const today = new Date(2026, 9, 21, 20) // quarta, 21/10/2026
const w = (date: string, kg: number) => ({ id: date, date, kg })

describe('weightWindow', () => {
  const entries = [w('2026-10-14', 82.4), w('2026-08-01', 85), w('2026-09-22', 83.4), w('2026-09-21', 83.5)]

  it('últimos 30 dias contando hoje, em ordem', () => {
    expect(weightWindow(entries, 30, today).map((e) => e.date)).toEqual(['2026-09-22', '2026-10-14'])
  })

  it('90 dias pega tudo', () => {
    expect(weightWindow(entries, 90, today)).toHaveLength(4)
  })
})

describe('escala do gráfico', () => {
  const box = { width: 300, height: 170, padX: 8, padY: 10, min: 75, max: 85 }

  it('o maior valor fica em cima e o menor embaixo', () => {
    expect(chartY(85, box)).toBe(10)
    expect(chartY(75, box)).toBe(160)
  })

  it('pontos espalhados por igual; um ponto só fica no meio', () => {
    expect(linePoints([85, 80, 75], box).map((p) => p.x)).toEqual([8, 150, 292])
    expect(linePoints([80], box)).toEqual([{ x: 150, y: 85 }])
  })

  it('a faixa inclui a meta', () => {
    expect(weightDomain([82.4, 85], 76)).toEqual([75.5, 85.5])
    expect(weightDomain([82.4, 85], null)).toEqual([81.9, 85.5])
  })
})

describe('weeklyBestLoads', () => {
  const sets = [
    { date: '2026-10-19', kg: 85, reps: 8 }, // semana 43 (de hoje)
    { date: '2026-10-14', kg: 80, reps: 8 },
    { date: '2026-10-12', kg: 82.5, reps: 6 }, // mesma semana 42: 80×8 tem 1RM maior que 82,5×6
    { date: '2026-09-30', kg: 77.5, reps: 8 }, // semana 40
  ]

  it('uma barra por semana, terminando na de hoje, com a melhor série', () => {
    const weeks = weeklyBestLoads(sets, 4, today)
    expect(weeks.map((x) => x.label)).toEqual(['S40', 'S41', 'S42', 'S43'])
    expect(weeks.map((x) => x.set?.kg ?? null)).toEqual([77.5, null, 80, 85])
    expect(weeks[0]!.weekStart).toBe('2026-09-28')
  })

  it('ganho: última semana treinada menos a primeira', () => {
    expect(loadGain(weeklyBestLoads(sets, 4, today))).toBe(7.5)
    expect(loadGain(weeklyBestLoads(sets.slice(0, 1), 4, today))).toBeNull()
  })
})

describe('measurementRows', () => {
  it('diferença arredondada, na ordem da tabela', () => {
    const rows = measurementRows(
      { date: '2026-08-01', waist: 98, hips: 104, chest: 108, arm: 37, thigh: 61 },
      { date: '2026-10-17', waist: 94, hips: 102, chest: 109, arm: 38.5, thigh: 62.1 },
    )
    expect(rows.map((r) => [r.label, r.diff])).toEqual([
      ['Cintura', -4],
      ['Quadril', -2],
      ['Peito', 1],
      ['Braço (contraído)', 1.5],
      ['Coxa', 1.1],
    ])
  })
})
