import type { CoachSettings } from '@workspace/core'
import { coachName, renatoMe } from './renato'

const q = (id: string, text: string, type: CoachSettings['checkIn']['questions'][number]['type']) => ({ id, text, type })
const day = (on: boolean, from = '08:00', to = '20:00') => ({ on, from, to })

/** Configurações do canvas (PainelConfig / TmConfig), com o Kaue no lugar do Carlos. */
export const initialCoachSettings = (): CoachSettings => ({
  profile: {
    name: coachName,
    cref: '012345-G/RS',
    email: 'kaue@teamoliveira.com.br',
    phone: '(51) 99876-5432',
    bio: 'Personal trainer há 9 anos, especialista em hipertrofia e recomposição corporal. Acompanhamento online com treino, dieta em parceria com nutricionista e check-in quinzenal.',
    specialties: ['Hipertrofia', 'Emagrecimento'],
    inviteLink: 'teamoliveira.app/convite/kaue',
  },
  branding: { ...renatoMe.branding, logoName: null },
  team: [
    { id: 'tm_kaue', name: coachName, role: 'owner', meta: 'Você · todos os alunos', pending: false },
    { id: 'tm_paula', name: 'Paula Mendes', role: 'nutritionist', meta: 'CRN-2 12345 · 31 alunos com dieta', pending: false },
    { id: 'tm_lucas', name: 'Lucas Souza', role: 'assistant', meta: 'Estagiário · convite enviado em 18/10', pending: true },
  ],
  permissions: {
    students: { owner: 'edit', nutritionist: 'view', assistant: 'edit' },
    workouts: { owner: 'edit', nutritionist: 'none', assistant: 'view' },
    diets: { owner: 'view', nutritionist: 'edit', assistant: 'none' },
    checkIns: { owner: 'edit', nutritionist: 'edit', assistant: 'view' },
    chat: { owner: 'edit', nutritionist: 'edit', assistant: 'edit' },
    finance: { owner: 'edit', nutritionist: 'none', assistant: 'none' },
    settings: { owner: 'edit', nutritionist: 'none', assistant: 'none' },
  },
  checkIn: {
    frequency: 'biweekly',
    questions: [
      q('q1', 'Peso de hoje (em jejum)', 'number'),
      q('q2', 'Fotos: frente, lado e costas', 'photo'),
      q('q3', 'Energia no dia a dia', 'rating'),
      q('q4', 'Qualidade do sono', 'rating'),
      q('q5', 'Controle da fome', 'rating'),
      q('q6', 'Aderência ao treino', 'rating'),
      q('q7', 'Aderência à dieta', 'rating'),
      q('q8', 'Sentiu dor ou desconforto?', 'yesNo'),
      q('q9', 'Algo mais para o treinador?', 'text'),
    ],
  },
  hours: {
    days: { mon: day(true), tue: day(true), wed: day(true), thu: day(true), fri: day(true), sat: day(true, '08:00', '12:00'), sun: day(false, '08:00', '12:00') },
    responseTime: 'Respondo em até 24 horas úteis',
    autoReplyText: 'Oi! Recebi sua mensagem e respondo no próximo horário de atendimento.',
  },
  defaults: { restSeconds: 90 },
  security: {
    twoFactor: true,
    biometrics: true,
    sessions: [
      { id: 'ses_mac', device: 'Chrome no macOS · Novo Hamburgo, RS', meta: 'Agora', current: true },
      { id: 'ses_iphone', device: 'Safari no iPhone · Novo Hamburgo, RS', meta: 'Último acesso hoje, 07:12', current: false },
    ],
  },
  plan: { name: 'Pro', price: 89, studentLimit: 80, renewsOn: '2026-11-05' },
})
