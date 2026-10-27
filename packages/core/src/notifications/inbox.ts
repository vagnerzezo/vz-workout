import { differenceInCalendarDays, startOfISOWeek } from 'date-fns'

export type NotificationGroup<T> = { label: string; items: T[] }

/** Hoje, Ontem, Esta semana e Anteriores, da mais nova para a mais antiga. Grupos vazios somem. */
export function groupNotifications<T extends { createdAt: string }>(items: T[], now: Date): NotificationGroup<T>[] {
  const weekStart = startOfISOWeek(now)
  const labelOf = (iso: string) => {
    const at = new Date(iso)
    const days = differenceInCalendarDays(now, at)
    if (days <= 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    return at >= weekStart ? 'Esta semana' : 'Anteriores'
  }
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return ['Hoje', 'Ontem', 'Esta semana', 'Anteriores']
    .map((label) => ({ label, items: sorted.filter((n) => labelOf(n.createdAt) === label) }))
    .filter((g) => g.items.length > 0)
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const pad = (n: number) => String(n).padStart(2, '0')

/** Horário ao lado do título: "19:00" hoje e ontem, "seg" nesta semana, "14/10" antes. */
export function notificationTime(iso: string, now: Date): string {
  const at = new Date(iso)
  const days = differenceInCalendarDays(now, at)
  if (days <= 1) return `${pad(at.getHours())}:${pad(at.getMinutes())}`
  if (at >= startOfISOWeek(now)) return WEEKDAYS[at.getDay()]!
  return `${pad(at.getDate())}/${pad(at.getMonth() + 1)}`
}
