import type { Exercise, LibraryExercise, Material } from '@workspace/core'

const GENERIC_STEPS = ['Ajuste o equipamento à sua altura antes da primeira série', 'Faça a fase de descida em 2 a 3 segundos', 'Mantenha o tronco estável durante todo o movimento', 'Expire na fase de força e não trave as articulações']

/** O que a ficha não guarda: passo a passo, nível, vídeo e substituições (o canvas detalha o hack). */
export const exerciseExtras: Record<string, Partial<Pick<LibraryExercise, 'level' | 'steps' | 'alternatives' | 'videoSeconds'>>> = {
  ex_hack_squat: {
    level: 'intermediate',
    steps: ['Costas e quadril bem apoiados no encosto', 'Pés na largura dos ombros, no meio da plataforma', 'Desça controlando até a coxa passar da paralela', 'Suba empurrando com o pé inteiro, sem travar o joelho'],
    alternatives: ['ex_leg_press', 'ex_back_squat', 'ex_bulgarian_split'],
    videoSeconds: 24,
  },
  ex_bench_press: { level: 'intermediate', videoSeconds: 28 },
  ex_bent_row: { level: 'advanced', videoSeconds: 26 },
  ex_meadows_row: { level: 'advanced', videoSeconds: null },
  ex_deadlift: { level: 'advanced', videoSeconds: 33 },
  ex_band_row: { videoSeconds: null },
  ex_kettlebell_swing: { level: 'intermediate', videoSeconds: null },
}

export const genericSteps = GENERIC_STEPS

/** Os do treinador que o canvas mostra ("MEU"). */
export const coachExercises: (Exercise & Partial<LibraryExercise>)[] = [
  { id: 'ex_coach_bulgarian_pause', name: 'Afundo búlgaro com pausa', primary: 'quads', secondary: ['glutes'], equipment: 'Halteres', videoUrl: null, origin: 'coach', level: 'advanced', videoSeconds: 31, steps: ['Pé de trás apoiado no banco', 'Desça até o joelho de trás quase encostar no chão', 'Segure 2 segundos embaixo', 'Suba empurrando com o calcanhar da frente'], alternatives: ['ex_bulgarian_split', 'ex_leg_press'] },
  { id: 'ex_coach_plank_tap', name: 'Prancha com toque no ombro', primary: 'core', secondary: ['shoulders'], equipment: 'Peso corporal', videoUrl: null, origin: 'coach', level: 'beginner', videoSeconds: null, steps: ['Apoio nas mãos, corpo em linha', 'Toque o ombro oposto sem girar o quadril', 'Alterne os lados devagar'], alternatives: ['ex_plank'] },
]

export const materials: Material[] = [
  { id: 'mat_install', title: 'Como instalar o app no celular', kind: 'pdf', meta: 'PDF · 2 páginas', description: 'Passo a passo para iPhone e Android, com a permissão das notificações.', audience: 'Todos os alunos', views: 47, students: 52 },
  { id: 'mat_checkin', title: 'Como tirar as fotos do check-in', kind: 'video', meta: 'Vídeo · 1:20', description: 'Luz, distância e poses de frente, lado e costas para comparar a evolução.', audience: 'Todos os alunos', views: 39, students: 52 },
  { id: 'mat_swaps', title: 'Tabela de substituições de alimentos', kind: 'pdf', meta: 'PDF · 4 páginas', description: 'Trocas por grupo com a porção equivalente em energia.', audience: 'Alunos com dieta', views: 31, students: 44 },
  { id: 'mat_water', title: 'Guia de hidratação', kind: 'pdf', meta: 'PDF · 1 página', description: 'Quanto beber por dia, no treino e nos dias quentes.', audience: 'Todos os alunos', views: 22, students: 52 },
  { id: 'mat_squat', title: 'Técnica do agachamento', kind: 'video', meta: 'Vídeo · 3:05', description: 'Os erros mais comuns e como corrigir a descida.', audience: 'Hipertrofia', views: 18, students: 27 },
  { id: 'mat_recipes', title: 'Receitas rápidas para a semana', kind: 'link', meta: 'Link externo', description: 'Marmitas de frango, carne e opções vegetarianas dentro do plano.', audience: 'Emagrecimento', views: 14, students: 18 },
]
