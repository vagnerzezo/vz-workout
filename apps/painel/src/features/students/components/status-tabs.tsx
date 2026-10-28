import type { StudentStatus } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { statusTabs } from '../hooks/use-list-params'

type StatusTabsProps = {
  current: StudentStatus
  counts: Record<StudentStatus, number>
  onChange: (s: StudentStatus) => void
}

/** Ativos · Pendentes · Vencidos · Arquivados. Sublinhado no desktop, pílulas no celular (canvas). */
export function StatusTabs({ current, counts, onChange }: StatusTabsProps) {
  return (
    <div role="group" aria-label="Status" className="order-3 -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:order-none lg:mx-0 lg:flex-wrap lg:gap-1 lg:overflow-visible lg:border-b lg:border-secondary lg:px-0">
      {statusTabs.map((t) => {
        const on = t.status === current
        return (
          <button
            key={t.status}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.status)}
            className={cn(
              'flex h-9.5 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-extrabold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              'lg:-mb-px lg:h-11 lg:gap-2 lg:rounded-none lg:border-b-2 lg:bg-transparent lg:text-sm',
              on ? 'bg-primary text-primary-foreground lg:border-primary lg:text-foreground' : 'bg-card text-foreground-2 lg:border-transparent lg:text-muted-foreground',
            )}
          >
            {t.label}
            <span className="opacity-75 lg:flex lg:h-5.5 lg:min-w-5.5 lg:items-center lg:justify-center lg:rounded-full lg:bg-secondary lg:px-1.5 lg:text-[11px] lg:text-foreground-2 lg:opacity-100">
              {counts[t.status]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
