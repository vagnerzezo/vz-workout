import { Link } from 'react-router'
import { Dumbbell, SquareCheckBig, Trophy, Utensils, Wallet, Weight, type LucideIcon } from 'lucide-react'
import { timeAgo, type ActivityEvent, type ActivityKind } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { panelClass } from './panel'

const kinds: Record<ActivityKind, { icon: LucideIcon; className: string }> = {
  record: { icon: Trophy, className: 'bg-warning/14 text-warning' },
  proof: { icon: Wallet, className: 'bg-info/14 text-info' },
  checkIn: { icon: SquareCheckBig, className: 'bg-info/14 text-info' },
  weight: { icon: Weight, className: 'bg-primary/14 text-primary' },
  workout: { icon: Dumbbell, className: 'bg-primary/14 text-primary' },
  dietSwap: { icon: Utensils, className: 'bg-violet/14 text-violet' },
}

export function ActivityFeed({ events, now }: { events: ActivityEvent[]; now: Date }) {
  return (
    <section aria-labelledby="atividade-titulo" className={cn(panelClass, 'gap-3 lg:gap-3.5')}>
      <div className="flex items-baseline justify-between">
        <h2 id="atividade-titulo" className="text-[15px] font-extrabold lg:text-base">
          Atividade recente
        </h2>
        <Link to="/notificacoes" className="text-[13px] font-extrabold text-primary lg:hidden">
          Ver tudo
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada por aqui ainda. Os treinos, check-ins e pesagens dos alunos aparecem aqui.</p>
      ) : (
        <ul className="flex flex-col gap-3 lg:gap-3.5">
          {events.map((e) => {
            const { icon: Icon, className } = kinds[e.kind]
            return (
              <li key={e.id} className="flex items-start gap-2.5 lg:gap-3">
                <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-[10px] lg:size-8.5', className)}>
                  <Icon className="size-3.75 lg:size-4" strokeWidth={2} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] leading-[1.4]">
                    <strong>{e.studentName}</strong> {e.text}
                  </span>
                  <span className="text-[11.5px] text-muted-foreground lg:text-xs">{timeAgo(e.at, now)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
