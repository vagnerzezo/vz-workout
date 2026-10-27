import type { Message, MessageBody } from '@workspace/core'

const at = (now: Date, daysAgo: number, h: number, m: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, h, m).toISOString()

/** Conversa do canvas (ontem à noite e hoje de manhã), montada a cada pedido para acompanhar o dia de hoje. */
export function renatoConversation(now: Date): Message[] {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const iso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  const me = (id: string, sentAt: string, body: MessageBody): Message => ({ id, from: 'student', sentAt, status: 'read', body })
  const coach = (id: string, sentAt: string, body: MessageBody): Message => ({ id, from: 'coach', sentAt, status: null, body })
  const text = (t: string): MessageBody => ({ type: 'text', text: t })

  const list: Message[] = [
    me('m1', at(now, 1, 20, 50), { type: 'event', event: 'workout', title: 'Você concluiu o Treino C — Legs', meta: '58 min · 9.870 kg · 2 recordes', link: `/treinos/historico?dia=${iso}` }),
    me('m2', at(now, 1, 21, 12), text('Carlos, senti o joelho direito na última série do hack. Nada forte, mas incomodou.')),
    coach('m3', at(now, 1, 21, 40), text('Obrigado por avisar. Doeu na descida ou na subida?')),
    me('m4', at(now, 1, 21, 44), text('Na descida, quando passa da paralela.')),
    me('m5', at(now, 0, 7, 30), { type: 'event', event: 'checkIn', title: 'Você enviou o check-in quinzenal', meta: '3 fotos · 82,4 kg', link: '/perfil/progresso#fotos' }),
    coach('m6', at(now, 0, 8, 10), text('Vou trocar o hack pelo leg press 45° nas próximas 2 semanas, com amplitude menor. Já atualizei a ficha.')),
    coach('m7', at(now, 0, 8, 11), { type: 'event', event: 'plan', title: 'Carlos atualizou sua ficha', meta: 'Treino C — Legs · hack → leg press 45°', link: '/treinos' }),
    me('m8', at(now, 0, 8, 31), { type: 'audio', url: null, durationSec: 42 }),
    me('m9', at(now, 0, 8, 32), text('Ok! Vou testar o leg press no lugar do hack hoje.')),
  ]
  // Nada no futuro: de madrugada, a conversa de hoje ainda não aconteceu
  return list.filter((m) => m.sentAt <= now.toISOString())
}
