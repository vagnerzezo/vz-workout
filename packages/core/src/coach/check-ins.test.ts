import { describe, expect, it } from 'vitest'
import { average, checkInAlerts, isOverdue, lateLabel, replyTemplates, reviewOrder } from './check-ins'

const now = new Date(2026, 9, 21, 20, 0)
const r = (label: string, value: number, previous: number | null) => ({ label, value, previous })
const base = { pain: null, comment: null, ratings: [r('Energia', 4, 4)], sentAt: new Date(2026, 9, 21, 10).toISOString() }

describe('check-ins do treinador', () => {
  it('alertas: dor, notas que caíram e pergunta', () => {
    expect(checkInAlerts({ pain: 'joelho direito', comment: 'Posso trocar a esteira pela bike?', ratings: [r('Sono', 2, 3), r('Energia', 4, 3), r('Fome', 3, null)] })).toEqual([
      { text: 'Relatou dor no joelho direito', tone: 'danger' },
      { text: 'Sono caiu de 3 para 2', tone: 'warning' },
      { text: 'Fez uma pergunta', tone: 'info' },
    ])
    expect(checkInAlerts(base)).toEqual([])
  })

  it('ordem da revisão: dor, alertas e depois o mais antigo', () => {
    const list = [
      { ...base, id: 'sem-alerta-antigo', sentAt: new Date(2026, 9, 19).toISOString() },
      { ...base, id: 'sem-alerta-novo' },
      { ...base, id: 'pergunta', comment: 'Pode?' },
      { ...base, id: 'dor', pain: 'ombro' },
    ]
    expect(reviewOrder(list).map((c) => c.id)).toEqual(['dor', 'pergunta', 'sem-alerta-antigo', 'sem-alerta-novo'])
  })

  it('mais de 48 h, atraso e média', () => {
    expect(isOverdue({ sentAt: new Date(2026, 9, 19, 19).toISOString() }, now)).toBe(true)
    expect(isOverdue({ sentAt: new Date(2026, 9, 19, 21).toISOString() }, now)).toBe(false)
    expect(lateLabel('2026-10-18', now)).toBe('3 dias de atraso')
    expect(lateLabel('2026-10-21', now)).toBe('1 dia de atraso')
    expect(average([4, 3, 2, 4, 5])).toBe(3.6)
  })

  it('respostas prontas com o nome', () => {
    expect(replyTemplates('Renato')[0]).toEqual({ label: 'Ótima evolução', text: expect.stringMatching(/^Ótima evolução, Renato!/) })
  })
})
