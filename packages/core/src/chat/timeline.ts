import { differenceInCalendarDays } from 'date-fns'

export type TimelineItem<M> = { type: 'day'; label: string; key: string } | { type: 'message'; message: M }

const pad = (n: number) => String(n).padStart(2, '0')

/** "Hoje", "Ontem" ou "14/10" */
export function chatDayLabel(iso: string, now: Date): string {
  const at = new Date(iso)
  const days = differenceInCalendarDays(now, at)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  return `${pad(at.getDate())}/${pad(at.getMonth() + 1)}`
}

/** Mensagens em ordem, com um separador antes do primeiro item de cada dia. */
export function chatTimeline<M extends { sentAt: string }>(messages: M[], now: Date): TimelineItem<M>[] {
  const items: TimelineItem<M>[] = []
  let last = ''
  for (const message of [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt))) {
    const at = new Date(message.sentAt)
    const key = `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`
    if (key !== last) items.push({ type: 'day', label: chatDayLabel(message.sentAt, now), key })
    last = key
    items.push({ type: 'message', message })
  }
  return items
}

/** Hora da mensagem: "21:12" */
export const messageTime = (iso: string) => {
  const at = new Date(iso)
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`
}

/** Duração de áudio: 42 → "0:42" · 125 → "2:05" */
export const audioDuration = (sec: number) => `${Math.floor(sec / 60)}:${pad(Math.round(sec) % 60)}`
