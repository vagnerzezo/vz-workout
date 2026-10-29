import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from './app-shell'

const page = (load: () => Promise<{ default: ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
})

const comingSoon = (title: string) => ({
  ...page(() => import('../shared/pages/coming-soon-page')),
  handle: { title },
})

/** Rotas da seção 7.2 do guia. As que ainda não têm tela abrem "Em construção". */
export const routes: RouteObject[] = [
  {
    element: <AppShell />, // sidebar (lg+) ou barra inferior com "Mais"
    children: [
      { index: true, ...page(() => import('../features/dashboard/pages/dashboard-page')) },
      { path: 'alunos', ...page(() => import('../features/students/pages/students-page')) },
      { path: 'alunos/novo', ...page(() => import('../features/new-student/pages/new-student-page')) },
      { path: 'alunos/:id', ...page(() => import('../features/student-profile/pages/student-page')) },
      { path: 'fichas', ...page(() => import('../features/plans/pages/plans-page')) },
      { path: 'fichas/nova', ...page(() => import('../features/plan-editor/pages/new-plan-page')) },
      { path: 'fichas/:id', ...page(() => import('../features/plan-editor/pages/plan-editor-page')) },
      { path: 'dietas', ...page(() => import('../features/diets/pages/diets-page')) },
      { path: 'dietas/nova', ...page(() => import('../features/diet-editor/pages/new-diet-page')) },
      { path: 'dietas/:id', ...page(() => import('../features/diet-editor/pages/diet-editor-page')) },
      { path: 'check-ins', ...page(() => import('../features/check-ins/pages/check-ins-page')) },
      { path: 'check-ins/revisar/:id', ...page(() => import('../features/check-ins/pages/review-page')) },
      { path: 'chat/:conversationId?', ...comingSoon('Chat') },
      { path: 'notificacoes', ...comingSoon('Notificações') },
      { path: 'notificacoes/nova', ...comingSoon('Nova notificação') },
      { path: 'financeiro', ...comingSoon('Financeiro') },
      { path: 'financeiro/comprovantes/:id', ...comingSoon('Conferir comprovante') },
      { path: 'biblioteca', ...comingSoon('Biblioteca') },
      { path: 'biblioteca/exercicios/:id', ...comingSoon('Exercício') },
      { path: 'configuracoes', ...comingSoon('Configurações') },
      { path: 'configuracoes/marca', ...comingSoon('Marca do app') },
      { path: '*', ...comingSoon('Página não encontrada') },
    ],
  },
]

export const router = createBrowserRouter(routes)
