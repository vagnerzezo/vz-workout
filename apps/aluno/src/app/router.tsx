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

// TODO(etapa 3): guard RequireAuth, /entrar, /primeiro-acesso e /recuperar-senha (seção 7.3 do guia)
export const routes: RouteObject[] = [
  { path: '/treinos/:dayId/ativo', ...page(() => import('../features/workout/pages/active-workout-page')) },
  { path: '/treinos/:sessionId/resumo', ...page(() => import('../features/workout/pages/session-summary-page')) },
  { path: '/treinos/historico', ...page(() => import('../features/workout/pages/history-page')) },
  { path: '/dieta/lista-de-compras', ...page(() => import('../features/diet/pages/shopping-list-page')) },
  { path: '/dieta/refeicoes/:mealId', ...page(() => import('../features/diet/pages/meal-page')) },
  {
    element: <AppShell />, // BottomNav
    children: [
      { index: true, ...page(() => import('../features/home/pages/home-page')) },
      { path: 'notificacoes', ...comingSoon('Notificações') },
      { path: 'chat', ...comingSoon('Chat') },
      { path: 'treinos', ...page(() => import('../features/workout/pages/workout-list-page')) },
      { path: 'dieta', ...page(() => import('../features/diet/pages/diet-page')) },
      { path: 'perfil', ...comingSoon('Perfil') },
      { path: 'perfil/progresso', ...comingSoon('Progresso') },
      { path: '*', ...comingSoon('Página não encontrada') },
    ],
  },
]

export const router = createBrowserRouter(routes)
