import { coachName } from './renato'

/**
 * Credenciais de teste da API simulada (não são de ninguém de verdade).
 * Entrar: celular (51) 99734-2201 ou e-mail renato@email.com, senha Treino2026.
 * Recuperar senha: o código é sempre 482913 (o mesmo do protótipo no canvas).
 * Primeiro acesso: convite K7M-2QX, da Fernanda Luz (a aluna do canvas). Link: /primeiro-acesso/K7M-2QX
 */
export const renatoLogin = {
  phone: '51997342201',
  email: 'renato@email.com',
  password: 'Treino2026',
}

export const RECOVERY_CODE = '482913'
export const MAX_ATTEMPTS = 5

export const fernandaInvite = {
  code: 'K7M2QX',
  fullName: 'Fernanda Luz',
  phone: '(51) 99812-4470',
  email: 'fernanda.luz@email.com',
  coachName,
}
