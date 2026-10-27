import { describe, expect, it } from 'vitest'
import { audioDuration, chatDayLabel, chatTimeline, messageTime } from './timeline'

const now = new Date(2026, 9, 21, 20, 0)
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString()

describe('chatTimeline', () => {
  it('ordena e põe um separador por dia', () => {
    const msgs = [
      { id: 'b', sentAt: at(21, 8, 10) },
      { id: 'a', sentAt: at(20, 21, 12) },
      { id: 'c', sentAt: at(21, 8, 32) },
      { id: 'z', sentAt: at(14, 9) },
    ]
    expect(chatTimeline(msgs, now).map((i) => (i.type === 'day' ? i.label : i.message.id))).toEqual(['14/10', 'z', 'Ontem', 'a', 'Hoje', 'b', 'c'])
  })

  it('conversa vazia, sem separadores', () => {
    expect(chatTimeline([], now)).toEqual([])
  })
})

describe('formatos', () => {
  it('dia, hora e duração do áudio', () => {
    expect(chatDayLabel(at(21, 1), now)).toBe('Hoje')
    expect(messageTime(at(20, 21, 12))).toBe('21:12')
    expect(audioDuration(42)).toBe('0:42')
    expect(audioDuration(125)).toBe('2:05')
  })
})
