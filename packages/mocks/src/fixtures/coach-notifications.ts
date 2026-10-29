import type { Automation, CoachInboxItem, CoachPrefKey, SentNotification } from '@workspace/core'

type At = [daysAgo: number, h: number, m: number]
const at = (now: Date, [d, h, m]: At) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, h, m).toISOString()

/** Caixa do treinador (canvas do celular): 4 de hoje sem ler. */
export function coachInbox(now: Date): Omit<CoachInboxItem, 'read'>[] {
  const n = (id: string, when: At, kind: CoachInboxItem['kind'], title: string, body: string, cta: string, link: string, primary = false) => ({ id, kind, title, body, cta, link, primary, createdAt: at(now, when) })
  return [
    n('cn1', [0, 8, 32], 'message', 'Renato Alves respondeu', '"Ok! Vou testar o leg press no lugar do hack hoje."', 'Responder', '/chat/conv_renato'),
    n('cn2', [0, 7, 58], 'pain', 'Renato relatou dor no check-in', 'Joelho direito no agachamento hack. Controle da fome caiu de 3 para 2.', 'Revisar check-in', '/check-ins/revisar/ci_renato_9', true),
    n('cn3', [0, 7, 55], 'payment', 'Pedro Nunes enviou comprovante', 'Mensal · R$ 230,00 · vence hoje', 'Conferir', '/financeiro', true),
    n('cn4', [0, 7, 0], 'inactive', 'Marcos Lima está há 7 dias sem treinar', 'O aviso automático foi enviado a ele ontem e ainda não foi aberto.', 'Mandar mensagem', '/chat/conv_marcos'),
    n('cn5', [1, 18, 55], 'checkIn', 'Ana Paula Reis enviou o check-in', 'Fez uma pergunta: trocar a esteira pela bike.', 'Revisar', '/check-ins/revisar/ci_ana_5'),
    n('cn6', [1, 12, 2], 'payment', 'Camila Rocha enviou comprovante', 'Valor informado R$ 200,00 de R$ 230,00', 'Conferir', '/financeiro'),
    n('cn7', [1, 9, 0], 'plan', 'Ficha de Ana Paula vence amanhã', 'Monte o próximo bloco ou renove a ficha atual.', 'Abrir fichas', '/fichas'),
    n('cn8', [1, 8, 0], 'birthday', 'Aniversário de Thiago Alves', 'A mensagem automática foi enviada às 8h.', 'Ver conversa', '/chat/conv_thiago'),
  ]
}

/** Lidas desde o começo: as de ontem. */
export const initiallyRead = ['cn5', 'cn6', 'cn7', 'cn8']

export const automations: Omit<Automation, 'enabled'>[] = [
  { id: 'workout', name: 'Lembrete de treino', trigger: '1 h antes do horário habitual', audience: 'student', stats: '41% abertas' },
  { id: 'meal', name: 'Lembrete de refeição', trigger: '15 min antes de cada refeição', audience: 'student', stats: '22% abertas' },
  { id: 'water', name: 'Lembrete de água', trigger: 'A cada 2 h se a meta não foi atingida', audience: 'student', stats: null },
  { id: 'checkIn', name: 'Check-in disponível', trigger: 'No dia do check-in, às 8h', audience: 'student', stats: '71% abertas' },
  { id: 'checkInLate', name: 'Check-in atrasado', trigger: '24 h após o prazo sem envio', audience: 'student', stats: '63% abertas' },
  { id: 'inactive', name: 'Aluno sem treinar', trigger: '3 dias seguidos sem treino', audience: 'both', stats: '48% abertas' },
  { id: 'planEnding', name: 'Ficha vencendo', trigger: '5 dias antes do fim da ficha', audience: 'coach', stats: '9 enviadas' },
  { id: 'subscription', name: 'Plano vencendo', trigger: '7 dias e 1 dia antes', audience: 'both', stats: '58% abertas' },
  { id: 'birthday', name: 'Aniversário', trigger: 'No dia, às 8h', audience: 'student', stats: '83% abertas' },
  { id: 'record', name: 'Recorde pessoal', trigger: 'Ao concluir treino com recorde', audience: 'student', stats: '66% abertas' },
]
export const automationsOff = ['water']

export function sentHistory(now: Date): SentNotification[] {
  return [
    { id: 'sn4', at: at(now, [-2, 6, 30]), title: 'Bora treinar, {nome}!', body: 'Seu {treino} está te esperando. Registre as cargas para acompanharmos sua evolução.', audienceLabel: 'Tag: Presencial', target: 'workout', status: 'scheduled', sent: null, push: null, openRate: null },
    { id: 'sn3', at: at(now, [3, 10, 0]), title: 'Feriado na segunda', body: 'A academia abre das 8h às 14h na segunda, {nome}. Ajuste seu treino!', audienceLabel: 'Todos os ativos', target: 'home', status: 'sent', sent: 52, push: 41, openRate: 62 },
    { id: 'sn2', at: at(now, [8, 9, 0]), title: 'Desafio de outubro começou', body: 'Treinar 5x por semana e bater 8 mil passos por dia. Bora, {nome}?', audienceLabel: 'Tag: Online', target: 'chat', status: 'sent', sent: 38, push: 30, openRate: 55 },
    { id: 'sn1', at: at(now, [14, 8, 0]), title: 'Check-in quinzenal chegando', body: 'Separe as fotos de frente, lado e costas para o check-in de amanhã.', audienceLabel: 'Todos os ativos', target: 'checkIn', status: 'sent', sent: 50, push: 39, openRate: 71 },
  ]
}

export const initialPrefs: Record<CoachPrefKey, boolean> = { checkIn: true, payment: true, message: true, inactive: true, plan: true, quietHours: true }
