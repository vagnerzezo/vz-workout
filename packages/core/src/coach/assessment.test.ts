import { describe, expect, it } from 'vitest'
import { bmi, bodyDensity, composition, deltaTone, fatPercent, protocolFolds, siri, skinfoldSum, waistHipRatio } from './assessment'

const folds = { chest: 18, midaxillary: 20, triceps: 16, subscapular: 24, abdominal: 32, suprailiac: 26, thigh: 22 }

describe('dobras do protocolo', () => {
  it('7 dobras: todas', () => {
    expect(skinfoldSum(folds, protocolFolds('pollock7', 'male'))).toBe(158)
  })

  it('3 dobras: peitoral, abdômen e coxa no homem; tríceps, suprailíaca e coxa na mulher', () => {
    expect(skinfoldSum(folds, protocolFolds('pollock3', 'male'))).toBe(72)
    expect(skinfoldSum(folds, protocolFolds('pollock3', 'female'))).toBe(64)
  })
})

describe('Jackson & Pollock + Siri', () => {
  it('7 dobras, homem de 33 anos com soma 158 mm: densidade 1,0475 → 22,6% de gordura', () => {
    const d = bodyDensity('pollock7', 'male', 158, 33)
    expect(d).toBeCloseTo(1.0475, 4)
    expect(siri(d)).toBeCloseTo(22.56, 2)
  })

  it('3 dobras, mulher de 28 anos com soma 64 mm: 25,3%', () => {
    expect(siri(bodyDensity('pollock3', 'female', 64, 28))).toBeCloseTo(25.29, 2)
  })

  it('fatPercent escolhe dobras ou bioimpedância', () => {
    expect(fatPercent('bioimpedance', 'male', 33, { skinfolds: folds, bioimpedance: { fatPct: 20.4 } })).toBe(20.4)
    expect(fatPercent('bioimpedance', 'male', 33, { skinfolds: folds, bioimpedance: null })).toBeNull()
    expect(fatPercent('pollock7', 'male', 33, { skinfolds: null, bioimpedance: null })).toBeNull()
    expect(fatPercent('pollock7', 'male', 33, { skinfolds: folds, bioimpedance: null })).toBeCloseTo(22.56, 2)
  })
})

describe('composição e índices', () => {
  it('massa gorda e magra', () => {
    expect(composition(80, 20)).toEqual({ fatKg: 16, leanKg: 64 })
  })

  it('IMC e relação cintura-quadril', () => {
    expect(bmi(82.4, 182)).toBeCloseTo(24.9, 1)
    expect(waistHipRatio(94, 102)).toBeCloseTo(0.92, 2)
  })

  it('cor da diferença', () => {
    expect(deltaTone(-2, true)).toBe('good')
    expect(deltaTone(1.5, false)).toBe('good')
    expect(deltaTone(1, true)).toBe('bad')
    expect(deltaTone(0, true)).toBe('neutral')
  })
})
