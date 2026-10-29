import type { CoachMessage, MessageBody } from '@workspace/core'

/** Horário relativo a hoje: (dias atrás, hora, minuto). */
export type At = [daysAgo: number, h: number, m: number]

type Msg = { at: At; from: 'student' | 'coach'; author?: string; status?: CoachMessage['status']; body: MessageBody }

export type ChatSeed = {
  id: string
  kind: 'student' | 'group'
  studentId: string | null
  title?: string
  online: boolean
  /** Até quando o treinador já leu: mensagens do aluno depois disso contam como não lidas */
  readAt: At
  notes: string
  messages: Msg[]
}

const text = (t: string): MessageBody => ({ type: 'text', text: t })
const s = (at: At, body: MessageBody, author?: string): Msg => ({ at, from: 'student', body, author })
const c = (at: At, body: MessageBody, status: CoachMessage['status'] = 'read'): Msg => ({ at, from: 'coach', body, status })

/** Conversas do canvas (painel e celular). A do Renato vem do app do aluno (renato-chat.ts). */
export const chatSeeds: ChatSeed[] = [
  {
    id: 'grp_desafio', kind: 'group', studentId: null, title: 'Desafio 30 dias — outubro', online: false, readAt: [0, 8, 10], notes: '',
    messages: [
      c([0, 6, 30], text('Bom dia, time! Desafio de hoje: 8 mil passos e treino feito antes das 20h.')),
      s([0, 7, 15], text('Dia 21 concluído, faltam 9!'), 'Júlia Castro'),
      s([0, 7, 40], text('Treino feito antes do trabalho.'), 'Pedro Nunes'),
      s([0, 7, 52], { type: 'image', url: null }, 'Diego Santos'),
      s([0, 8, 5], text('Hoje é dia de perna, alguém mais?'), 'Camila Rocha'),
      s([0, 8, 20], text('Eu! Às 18h.'), 'Thiago Alves'),
    ],
  },
  {
    id: 'conv_ana', kind: 'student', studentId: 'stu_ana', online: false, readAt: [1, 18, 56], notes: 'Prefere treinar cedo. Joelho ok. Gosta de bike mais que esteira.',
    messages: [
      s([1, 18, 55], { type: 'event', event: 'checkIn', title: 'Check-in quinzenal enviado', meta: '3 fotos · peso 64,2 kg · média 4,0/5', link: '/check-ins/revisar/ci_ana_5' }),
      s([1, 19, 2], text('Fiz o check-in! Posso trocar o cardio da esteira pela bike?')),
    ],
  },
  {
    id: 'conv_julia', kind: 'student', studentId: 'stu_julia', online: true, readAt: [1, 19, 0], notes: 'Responde melhor a feedback por áudio. Fome à noite melhorou com a troca do jantar.',
    messages: [c([1, 18, 20], text('Boa, Júlia! A troca do jantar está funcionando, seguimos assim nas próximas 2 semanas.')), s([1, 18, 45], text('Obrigada! Estou bem animada com os resultados.'))],
  },
  {
    id: 'conv_camila', kind: 'student', studentId: 'stu_camila', online: false, readAt: [1, 13, 0], notes: 'Trabalha à noite. Sono é o ponto fraco.',
    messages: [s([1, 12, 40], { type: 'image', url: null }), s([1, 12, 41], text('Assim está certa a quantidade de arroz?')), c([1, 13, 5], text('Perfeito, Camila! Está dentro da porção do plano.'))],
  },
  {
    id: 'conv_pedro', kind: 'student', studentId: 'stu_pedro', online: false, readAt: [3, 18, 0], notes: 'Quer focar em ombro no próximo bloco.',
    messages: [s([3, 17, 20], text('Valeu pelo treino novo, curti muito o upper.')), c([3, 17, 35], text('Que bom, Pedro! Me conta como foram as cargas no fim da semana.'))],
  },
  {
    id: 'conv_marcos', kind: 'student', studentId: 'stu_marcos', online: false, readAt: [4, 10, 0], notes: 'Mudou de turno no trabalho em outubro. Avaliar treino de 3x por semana.',
    messages: [c([4, 9, 12], text('Marcos, tudo bem? Vi que você não treinou essa semana. Aconteceu alguma coisa? Se a rotina mudou, a gente adapta o treino.'), 'delivered')],
  },
  {
    id: 'conv_diego', kind: 'student', studentId: 'stu_diego', online: false, readAt: [4, 19, 0], notes: 'Muito disciplinado. Pode receber progressão mais agressiva.',
    messages: [s([4, 18, 2], text('Posso fazer o supino com pausa no peito?')), c([4, 18, 30], text('Pode sim, Diego. Mantém o descanso de 2 min.'))],
  },
]

export const groupInfo = {
  description: 'Desafio de outubro: treinar 5x por semana e bater 8 mil passos por dia. Ranking atualizado toda segunda.',
  members: ['Júlia Castro', 'Pedro Nunes', 'Diego Santos', 'Camila Rocha', 'Thiago Alves', 'Renato Alves', 'Ana Paula Reis', 'Letícia Moura'],
  memberCount: 24,
}

/** O Renato no painel: as mensagens do app com o título dos cartões do ponto de vista do treinador. */
export const renatoCoachEvents: Record<string, { title: string; link: string }> = {
  m1: { title: 'Treino C — Legs concluído', link: '/alunos/stu_renato?aba=historico' },
  m5: { title: 'Check-in quinzenal enviado', link: '/check-ins/revisar/ci_renato_9' },
  m7: { title: 'Ficha atualizada · Treino C — Legs', link: '/alunos/stu_renato?aba=treino' },
}

export const AUTO_REPLY = { hours: 'seg–sex, 8h–20h', text: 'Oi! Recebi sua mensagem e respondo no próximo horário de atendimento.' }
