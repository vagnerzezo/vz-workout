import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from './app-shell'
import { RequireAuth } from './require-auth'

const page = (load: () => Promise<{ default: ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
})

const comingSoon = (title: string) => ({
  ...page(() => import('../shared/pages/coming-soon-page')),
  handle: { title },
})

export const routes: RouteObject[] = [
  { path: '/entrar', ...page(() => import('../features/auth/pages/login-page')) },
  { path: '/primeiro-acesso/:code?', ...page(() => import('../features/auth/pages/first-access-page')) },
  { path: '/recuperar-senha', ...page(() => import('../features/auth/pages/reset-password-page')) },
  { path: '/acesso-pausado', ...page(() => import('../features/profile/pages/paused-page')) },
  {
    element: <RequireAuth />, // sem sessão → /entrar · acesso pausado → /acesso-pausado
    children: [
      { path: '/treinos/:dayId/ativo', ...page(() => import('../features/workout/pages/active-workout-page')) },
      { path: '/treinos/:sessionId/resumo', ...page(() => import('../features/workout/pages/session-summary-page')) },
      { path: '/treinos/historico', ...page(() => import('../features/workout/pages/history-page')) },
      { path: '/chat', ...page(() => import('../features/chat/pages/chat-page')) },
      { path: '/notificacoes', ...page(() => import('../features/notifications/pages/notifications-page')) },
      { path: '/perfil/pagamento', ...page(() => import('../features/profile/pages/payment-page')) },
      { path: '/perfil/configuracoes', ...page(() => import('../features/profile/pages/settings-page')) },
      { path: '/perfil/check-in', ...page(() => import('../features/profile/pages/check-in-page')) },
      { path: '/perfil/progresso', ...page(() => import('../features/profile/pages/progress-page')) },
      { path: '/dieta/lista-de-compras', ...page(() => import('../features/diet/pages/shopping-list-page')) },
      { path: '/dieta/refeicoes/:mealId', ...page(() => import('../features/diet/pages/meal-page')) },
      {
        element: <AppShell />, // BottomNav
        children: [
          { index: true, ...page(() => import('../features/home/pages/home-page')) },
          { path: 'treinos', ...page(() => import('../features/workout/pages/workout-list-page')) },
          { path: 'dieta', ...page(() => import('../features/diet/pages/diet-page')) },
          { path: 'perfil', ...page(() => import('../features/profile/pages/profile-page')) },
          { path: 'perfil/configuracoes/dados-pessoais', ...comingSoon('Dados pessoais') },
          { path: 'perfil/configuracoes/objetivo', ...comingSoon('Objetivo e nível') },
          { path: 'perfil/configuracoes/acesso', ...comingSoon('E-mail e senha') },
          { path: 'perfil/configuracoes/meus-dados', ...comingSoon('Meus dados') },
          { path: 'perfil/configuracoes/ajuda', ...comingSoon('Central de ajuda') },
          { path: 'perfil/configuracoes/termos', ...comingSoon('Termos e privacidade') },
          { path: '*', ...comingSoon('Página não encontrada') },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
