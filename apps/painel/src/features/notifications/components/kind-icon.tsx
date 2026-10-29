import { AlertTriangle, CalendarClock, ClipboardCheck, Clock, Gift, MessageCircle, Wallet } from 'lucide-react'
import type { CoachInboxItem } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

const kinds = {
  message: { icon: MessageCircle, tone: 'bg-primary/14 text-primary' },
  pain: { icon: AlertTriangle, tone: 'bg-destructive/16 text-destructive' },
  payment: { icon: Wallet, tone: 'bg-info/16 text-info' },
  inactive: { icon: Clock, tone: 'bg-warning/16 text-warning' },
  checkIn: { icon: ClipboardCheck, tone: 'bg-info/16 text-info' },
  plan: { icon: CalendarClock, tone: 'bg-warning/16 text-warning' },
  birthday: { icon: Gift, tone: 'bg-violet/16 text-violet' },
} satisfies Record<CoachInboxItem['kind'], unknown>

export function KindIcon({ kind, className }: { kind: CoachInboxItem['kind']; className?: string }) {
  const { icon: Icon, tone } = kinds[kind]
  return (
    <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tone, className)}>
      <Icon className="size-4.5" />
    </span>
  )
}
