import { describe, expect, it } from 'vitest'
import { audienceLabel, fillNotification, insertVariable, notificationReach, quietHoursAdjust } from './notifications'

const students = [
  { id: 'a', name: 'Renato Alves', tags: ['Online', 'Hipertrofia'], push: true },
  { id: 'b', name: 'Marcos Lima', tags: ['Presencial'], push: false },
  { id: 'c', name: 'Júlia Castro', tags: ['Online', 'Emagrecimento'], push: true },
]

describe('notificações do treinador', () => {
  it('variáveis e inserção no campo', () => {
    expect(fillNotification('Bora treinar, {nome}! Seu {treino} te espera. — {treinador}', { name: 'Renato Alves', workout: 'Treino C — Legs', coach: 'Kaue Oliveira' })).toBe('Bora treinar, Renato! Seu Treino C — Legs te espera. — Kaue')
    expect(insertVariable('Oi,  ', '{nome}')).toBe('Oi, {nome}')
    expect(insertVariable('', '{nome}')).toBe('{nome}')
  })

  it('horário silencioso: entre 22h e 7h vai para as 7h', () => {
    expect(quietHoursAdjust(new Date(2026, 9, 23, 6, 30))).toEqual({ at: new Date(2026, 9, 23, 7, 0), moved: true })
    expect(quietHoursAdjust(new Date(2026, 9, 23, 22, 15))).toEqual({ at: new Date(2026, 9, 24, 7, 0), moved: true })
    expect(quietHoursAdjust(new Date(2026, 9, 23, 7, 30)).moved).toBe(false)
  })

  it('alcance por público, com push', () => {
    expect(notificationReach(students, { audience: 'all', tags: [], studentIds: [] })).toMatchObject({ total: 3, push: 2, noPush: 1 })
    expect(notificationReach(students, { audience: 'tags', tags: ['Online'], studentIds: [] })).toMatchObject({ total: 2, push: 2 })
    expect(notificationReach(students, { audience: 'students', tags: [], studentIds: ['b'] })).toMatchObject({ total: 1, push: 0, noPush: 1 })
    expect(audienceLabel({ audience: 'tags', tags: ['Online', 'Presencial'], studentIds: [] })).toBe('Tag: Online, Presencial')
    expect(audienceLabel({ audience: 'students', tags: [], studentIds: ['a', 'b', 'c'] })).toBe('3 alunos')
  })
})
