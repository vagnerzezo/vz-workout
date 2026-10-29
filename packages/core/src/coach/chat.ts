import type { CoachConversationSummary, CoachMessage } from '../schemas/coach-chat'
import { audioDuration } from '../chat/timeline'

/** Texto da última mensagem na lista: "Você: …", "Thiago: …", "Áudio 0:42", "Foto". */
export function conversationPreview(m: Pick<CoachMessage, 'from' | 'author' | 'body'> | null): string {
  if (!m) return 'Nenhuma mensagem ainda'
  const b = m.body
  const content = b.type === 'text' ? b.text : b.type === 'audio' ? `Áudio ${audioDuration(b.durationSec)}` : b.type === 'image' ? 'Foto' : b.type === 'video' ? 'Vídeo' : b.title
  if (m.from === 'coach') return `Você: ${content}`
  return m.author ? `${m.author.split(' ')[0]}: ${content}` : content
}

export type ConversationFilter = 'all' | 'unread' | 'groups'

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function filterConversations(list: CoachConversationSummary[], query: string, filter: ConversationFilter): CoachConversationSummary[] {
  const q = fold(query.trim())
  return list.filter((c) => (filter === 'all' || (filter === 'unread' && c.unread > 0) || (filter === 'groups' && c.kind === 'group')) && (!q || fold(c.title).includes(q)))
}

/** Transmissão: "{nome}" vira o primeiro nome de cada aluno. */
export const personalize = (text: string, fullName: string) => text.replaceAll('{nome}', fullName.split(' ')[0]!)

/** Respostas rápidas do canvas, com o primeiro nome do aluno. */
export function chatQuickReplies(firstName: string): { label: string; text: string }[] {
  return [
    { label: 'Ótimo treino!', text: `Ótimo treino, ${firstName}! Continue assim.` },
    { label: 'Como você está?', text: `${firstName}, como você está se sentindo nos treinos desta semana?` },
    { label: 'Me manda um vídeo', text: `${firstName}, me manda um vídeo curto da execução para eu ver a técnica.` },
    { label: 'Vou ajustar sua ficha', text: `${firstName}, vou ajustar sua ficha e te aviso quando estiver no app.` },
  ]
}

/** Iniciais do grupo: as letras e números do começo das palavras ("Desafio 30 dias" → "D30"). */
export const groupInitials = (title: string) =>
  title
    .split(/\s+/)
    .filter((w) => /^[\p{L}\d]/u.test(w))
    .slice(0, 2)
    .map((w) => (/^\d/.test(w) ? w.match(/^\d+/)![0] : w[0]!.toUpperCase()))
    .join('')
