import type { LucideIcon } from 'lucide-react'
import { Bell, Dumbbell, LayoutDashboard, LibraryBig, MessageCircle, Settings, SquareCheckBig, Users, Utensils, Wallet } from 'lucide-react'
import type { CoachCounters } from '@workspace/core'

export type Section = {
  to: string
  label: string
  icon: LucideIcon
  /** Contador do menu; `highlight` pinta na cor da marca (pede ação), senão fica neutro */
  badge?: (c: CoachCounters) => number
  highlight?: boolean
}

/** As seções do painel, na ordem da sidebar do canvas. */
export const sections: Section[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alunos', label: 'Alunos', icon: Users, badge: (c) => c.students },
  { to: '/fichas', label: 'Fichas de treino', icon: Dumbbell },
  { to: '/dietas', label: 'Fichas de dieta', icon: Utensils },
  { to: '/biblioteca', label: 'Biblioteca', icon: LibraryBig },
  { to: '/check-ins', label: 'Check-ins', icon: SquareCheckBig, badge: (c) => c.pendingCheckIns, highlight: true },
  { to: '/chat', label: 'Chat', icon: MessageCircle, badge: (c) => c.unreadChats, highlight: true },
  { to: '/notificacoes', label: 'Notificações', icon: Bell },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, badge: (c) => c.pendingProofs, highlight: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

const byPath = (to: string) => sections.find((s) => s.to === to)!

/** Na barra inferior (< lg) ficam estas; o resto vai para o "Mais". */
export const tabSections = ['/alunos', '/check-ins', '/chat'].map(byPath)
export const moreSections = ['/fichas', '/dietas', '/biblioteca', '/notificacoes', '/financeiro', '/configuracoes'].map(byPath)

/** A rota atual pertence à seção? ("/alunos/12" é de Alunos; "/" só na rota exata) */
export const inSection = (pathname: string, to: string) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`))
