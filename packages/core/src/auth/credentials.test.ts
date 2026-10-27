import { describe, expect, it } from 'vitest'
import { formatInviteCode, maskLoginId, normalizeInviteCode, parseLoginId, passwordRules } from './credentials'

describe('parseLoginId', () => {
  it.each([
    ['(51) 99734-2201', { kind: 'phone', value: '51997342201' }],
    ['+55 51 99734-2201', { kind: 'phone', value: '51997342201' }],
    ['  Renato@Email.com ', { kind: 'email', value: 'renato@email.com' }],
  ])('%s', (text, id) => expect(parseLoginId(text)).toEqual(id))

  it.each(['9734-2201', 'renato@', 'renato', ''])('inválido: %s', (text) => expect(parseLoginId(text)).toBeNull())
})

describe('passwordRules', () => {
  it('tamanho e letra + número', () => {
    expect(passwordRules('abc').map((r) => r.ok)).toEqual([false, false])
    expect(passwordRules('abcdefgh').map((r) => r.ok)).toEqual([true, false])
    expect(passwordRules('ação2026').map((r) => r.ok)).toEqual([true, true])
  })
})

describe('maskLoginId', () => {
  it('esconde o meio', () => {
    expect(maskLoginId({ kind: 'phone', value: '51997342201' })).toBe('(51) •••••-2201')
    expect(maskLoginId({ kind: 'email', value: 'renato@email.com' })).toBe('r••••@email.com')
  })
})

describe('primeiro acesso', () => {
  const fernanda = { name: 'Fernanda Luz', phone: '(51) 99812-4470' }

  it('senha não pode ter o nome nem o fim do celular', () => {
    expect(passwordRules('Treino2026', fernanda).map((r) => r.ok)).toEqual([true, true, true])
    expect(passwordRules('fernanda123', fernanda)[2]!.ok).toBe(false)
    expect(passwordRules('Senha4470x', fernanda)[2]!.ok).toBe(false)
    expect(passwordRules('', fernanda)[2]!.ok).toBe(false)
    expect(passwordRules('Treino2026')).toHaveLength(2)
  })

  it('código do convite', () => {
    expect(normalizeInviteCode(' k7m-2qx ')).toBe('K7M2QX')
    expect(normalizeInviteCode('K7M2QXZZ')).toBe('K7M2QX')
    expect(formatInviteCode('K7M2QX')).toBe('K7M-2QX')
    expect(formatInviteCode('K7')).toBe('K7')
  })
})
