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
      { path: 'alunos', ...comingSoon('Alunos') },
      { path: 'alunos/novo', ...comingSoon('Novo aluno') },
      { path: 'alunos/:id', ...comingSoon('Perfil do aluno') },
      { path: 'fichas', ...comingSoon('Fichas de treino') },
      { path: 'fichas/:id', ...comingSoon('Editor de ficha') },
      { path: 'dietas', ...comingSoon('Fichas de dieta') },
      { path: 'dietas/:id', ...comingSoon('Editor de dieta') },
      { path: 'check-ins', ...comingSoon('Check-ins') },
      { path: 'check-ins/revisar/:id', ...comingSoon('Revisar check-in') },
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
