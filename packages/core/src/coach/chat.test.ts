import { describe, expect, it } from 'vitest'
import type { CoachConversationSummary } from '../schemas/coach-chat'
import { chatQuickReplies, conversationPreview, filterConversations, groupInitials, personalize } from './chat'

const conv = (over: Partial<CoachConversationSummary>): CoachConversationSummary => ({ id: 'c', kind: 'student', title: 'Aluno', studentId: 's', online: false, unread: 0, awaitingReply: false, last: null, ...over })

describe('chat do treinador', () => {
  it('prévia da última mensagem', () => {
    expect(conversationPreview({ from: 'coach', author: null, body: { type: 'text', text: 'Oi!' } })).toBe('Você: Oi!')
    expect(conversationPreview({ from: 'student', author: 'Thiago Alves', body: { type: 'text', text: 'Eu! Às 18h.' } })).toBe('Thiago: Eu! Às 18h.')
    expect(conversationPreview({ from: 'student', author: null, body: { type: 'audio', url: null, durationSec: 42 } })).toBe('Áudio 0:42')
    expect(conversationPreview({ from: 'student', author: null, body: { type: 'event', event: 'checkIn', title: 'Check-in enviado', meta: '', link: '/' } })).toBe('Check-in enviado')
    expect(conversationPreview(null)).toBe('Nenhuma mensagem ainda')
  })

  it('filtros e busca sem acento', () => {
    const list = [conv({ id: 'a', title: 'Júlia Castro', unread: 1 }), conv({ id: 'g', title: 'Desafio 30 dias', kind: 'group' }), conv({ id: 'p', title: 'Pedro Nunes' })]
    expect(filterConversations(list, '', 'unread').map((c) => c.id)).toEqual(['a'])
    expect(filterConversations(list, '', 'groups').map((c) => c.id)).toEqual(['g'])
    expect(filterConversations(list, 'julia', 'all').map((c) => c.id)).toEqual(['a'])
  })

  it('transmissão com {nome}, respostas rápidas e iniciais do grupo', () => {
    expect(personalize('Oi, {nome}! Feriado na segunda.', 'Renato Alves')).toBe('Oi, Renato! Feriado na segunda.')
    expect(chatQuickReplies('Ana')[0]!.text).toBe('Ótimo treino, Ana! Continue assim.')
    expect(groupInitials('Desafio 30 dias — outubro')).toBe('D30')
  })
})
