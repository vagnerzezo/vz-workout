import { describe, expect, it } from 'vitest'
import { CheckInAnswers } from '../schemas/checkin'
import { checkInProgress, joinList, type CheckInDraft } from './form'

const pending = {
  poses: ['front', 'side', 'back'] as const,
  questions: [
    { id: 'energia', label: 'Energia no dia a dia' },
    { id: 'sono', label: 'Qualidade do sono' },
  ],
}
const empty: CheckInDraft = { photos: [], weightKg: null, ratings: {}, pain: null, painWhere: '' }

describe('checkInProgress', () => {
  it('conta fotos, peso, notas e a pergunta da dor', () => {
    expect(checkInProgress({ ...pending, poses: [...pending.poses] }, empty)).toEqual({
      filled: 0,
      total: 7,
      missing: ['foto de frente', 'foto de lado', 'foto de costas', 'peso de hoje', 'Energia no dia a dia', 'Qualidade do sono', 'dor ou desconforto'],
    })
  })

  it('tudo preenchido, sem dor', () => {
    const draft = { photos: ['front', 'side', 'back'] as const, weightKg: 82.4, ratings: { energia: 4, sono: 3 }, pain: false, painWhere: '' }
    expect(checkInProgress({ ...pending, poses: [...pending.poses] }, { ...draft, photos: [...draft.photos] })).toEqual({ filled: 7, total: 7, missing: [] })
  })

  it('com dor, só conta depois de dizer onde', () => {
    const draft = { ...empty, pain: true }
    expect(checkInProgress({ ...pending, poses: [...pending.poses] }, draft).missing.at(-1)).toBe('onde doeu')
    expect(checkInProgress({ ...pending, poses: [...pending.poses] }, { ...draft, painWhere: 'joelho' }).missing).not.toContain('onde doeu')
  })
})

describe('joinList', () => {
  it.each([
    [[], ''],
    [['a'], 'a'],
    [['a', 'b'], 'a e b'],
    [['a', 'b', 'c'], 'a, b e c'],
  ])('%j → %s', (items, text) => expect(joinList(items)).toBe(text))
})

describe('CheckInAnswers', () => {
  const ok = { weightKg: 82.2, ratings: { energia: 4 }, pain: false, painWhere: null, notes: null }

  it('aceita respostas válidas', () => {
    expect(CheckInAnswers.safeParse(ok).success).toBe(true)
  })

  it('dor exige dizer onde; nota fora de 1 a 5 não passa', () => {
    expect(CheckInAnswers.safeParse({ ...ok, pain: true }).success).toBe(false)
    expect(CheckInAnswers.safeParse({ ...ok, pain: true, painWhere: 'joelho direito' }).success).toBe(true)
    expect(CheckInAnswers.safeParse({ ...ok, ratings: { energia: 6 } }).success).toBe(false)
  })
})
