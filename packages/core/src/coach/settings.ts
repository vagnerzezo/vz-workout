import { bestTextOn, contrastRatio } from '../validation/contrast'
import type { CheckInQuestionType, Permission, PermissionArea, TeamRole, Weekday } from '../schemas/coach-settings'

/** CREF: 6 números, G (graduado) ou P (provisionado) e a UF. */
export const isValidCref = (cref: string) => /^\d{6}-[GP]\/[A-Z]{2}$/.test(cref.trim().toUpperCase())

/** O iPhone corta o nome embaixo do ícone a partir de 12 caracteres. */
export const HOME_NAME_LIMIT = 12
export const homeScreenName = (name: string) => {
  const n = name.trim() || 'Meu app'
  return n.length > HOME_NAME_LIMIT ? `${n.slice(0, HOME_NAME_LIMIT - 1).trim()}…` : n
}

/** Iniciais do ícone sem logo: duas palavras → as duas iniciais; uma → as duas primeiras letras. */
export function appInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? 'A').slice(0, 2)).toUpperCase()
}

const BG = '#0b0c0e' // fundo do app

/**
 * Contraste da cor da marca: texto sobre a cor (4,5:1) e a cor sobre o fundo escuro do app (3:1).
 */
export function brandContrast(hex: string) {
  const onBrand = bestTextOn(hex)
  const text = contrastRatio(hex, onBrand)
  const bg = contrastRatio(hex, BG)
  const level: 'good' | 'fadesOnBackground' | 'low' = text >= 4.5 && bg >= 3 ? 'good' : text >= 4.5 ? 'fadesOnBackground' : 'low'
  const message = { good: 'Contraste ótimo no app inteiro', fadesOnBackground: 'Texto legível, mas a cor some no fundo escuro do app', low: 'Contraste baixo. Escolha uma cor mais clara ou mais escura' }[level]
  return { onBrand, text, bg, level, message }
}

export const BRAND_SWATCHES = ['#A3FF12', '#8B7BFF', '#FF7A2F', '#38E1C6', '#5AB8FF', '#FF5C8A'] as const

export const permissionLabel: Record<Permission, string> = { edit: 'Editar', view: 'Ver', none: 'Sem acesso' }
export const roleLabel: Record<TeamRole, string> = { owner: 'Dono', nutritionist: 'Nutricionista', assistant: 'Assistente' }
export const areaLabel: Record<PermissionArea, string> = { students: 'Alunos', workouts: 'Fichas de treino', diets: 'Fichas de dieta', checkIns: 'Check-ins', chat: 'Chat', finance: 'Financeiro', settings: 'Configurações' }

/** O dono não perde o acesso às configurações (senão ninguém mais consegue mudar nada). */
export const isPermissionLocked = (role: TeamRole, area: PermissionArea) => role === 'owner' && area === 'settings'

export const SPECIALTIES = ['Hipertrofia', 'Emagrecimento', 'Força', 'Corrida', 'Reabilitação', 'Idosos', 'Gestantes'] as const

/**
 * Próxima permissão ao clicar: Editar → Ver → Sem acesso → Editar.
 * Dieta: só a nutricionista edita (prescrever dieta é privativo de nutricionista, Lei 8.234/91).
 */
export function nextPermission(role: TeamRole, area: PermissionArea, current: Permission): Permission {
  const cycle: Permission[] = area === 'diets' && role !== 'nutritionist' ? ['view', 'none'] : ['edit', 'view', 'none']
  const i = cycle.indexOf(current)
  return cycle[(i + 1) % cycle.length]!
}

export const questionTypeLabel: Record<CheckInQuestionType, string> = { rating: 'Nota de 1 a 5', number: 'Número', yesNo: 'Sim ou não', text: 'Texto', photo: 'Fotos' }
export const weekdayShortLabel: Record<Weekday, string> = { mon: 'Segunda', tue: 'Terça', wed: 'Quarta', thu: 'Quinta', fri: 'Sexta', sat: 'Sábado', sun: 'Domingo' }

/** "1min 30s", "45s", "2min". */
export function restLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}min ${s}s` : `${m}min`
}
