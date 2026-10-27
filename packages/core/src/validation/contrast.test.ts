import { describe, expect, it } from 'vitest'
import { bestTextOn, contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('preto e branco dão 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('é simétrico', () => {
    expect(contrastRatio('#a3ff12', '#0b0c0e')).toBeCloseTo(contrastRatio('#0b0c0e', '#a3ff12'))
  })
})

describe('bestTextOn', () => {
  it.each([
    ['#A3FF12', '#0b0c0e'], // verde-limão do canvas
    ['#38E1C6', '#0b0c0e'],
    ['#1E3A8A', '#ffffff'], // azul escuro
    ['#000000', '#ffffff'],
  ])('%s → %s', (bg, fg) => {
    expect(bestTextOn(bg)).toBe(fg)
  })
})
