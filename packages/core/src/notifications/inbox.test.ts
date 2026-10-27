import { describe, expect, it } from 'vitest'
import { groupNotifications, notificationTime } from './inbox'

const now = new Date(2026, 9, 21, 20, 0) // quarta, 21/10/2026, 20h
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString()

describe('groupNotifications', () => {
  it('agrupa por dia, da mais nova para a mais antiga', () => {
    const items = [
      { id: 'semana', createdAt: at(19, 9) }, // segunda desta semana
      { id: 'manha', createdAt: at(21, 8, 12) },
      { id: 'ontem', createdAt: at(20, 20, 52) },
      { id: 'noite', createdAt: at(21, 19) },
      { id: 'antiga', createdAt: at(17, 10) }, // sábado da semana passada
    ]
    expect(groupNotifications(items, now).map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
      ['Hoje', ['noite', 'manha']],
      ['Ontem', ['ontem']],
      ['Esta semana', ['semana']],
      ['Anteriores', ['antiga']],
    ])
  })

  it('sem itens, sem grupos', () => {
    expect(groupNotifications([], now)).toEqual([])
  })
})

describe('notificationTime', () => {
  it.each([
    [at(21, 19), '19:00'],
    [at(20, 8), '08:00'],
    [at(19, 9), 'seg'],
    [at(14, 9), '14/10'],
  ])('%s → %s', (iso, text) => expect(notificationTime(iso, now)).toBe(text))
})
