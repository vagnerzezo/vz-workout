import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { initials, parseIsoDate, planDueTone, shortDate, type AssignedPlan } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

/** Aba "Atribuídas a alunos": a ficha de cada aluno abre na aba Treino do perfil, onde é ajustada. */
export function AssignedList({ items, now }: { items: AssignedPlan[]; now: Date }) {
  if (items.length === 0) return <p className="rounded-[18px] border border-dashed border-line-strong p-6 text-center text-sm text-muted-foreground">Nenhuma ficha com esses filtros.</p>
  return (
    <ul aria-label="Fichas dos alunos" className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
      {items.map((a) => (
        <li key={a.studentId}>
          <Link
            to={`/alunos/${a.studentId}?aba=treino`}
            className="flex items-center gap-3 rounded-[18px] border bg-card p-3.5 outline-none hover:border-input focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-xs font-extrabold">
              {initials(a.studentName)}
            </span>
            <span className="flex min-w-0 grow flex-col gap-0.5">
              <span className="truncate text-sm font-extrabold">{a.studentName}</span>
              <span className="truncate text-xs text-muted-foreground">{a.planName}</span>
            </span>
            <span className={cn('shrink-0 text-xs font-bold', planDueTone(a.validUntil, now) === 'warning' ? 'text-warning' : 'text-foreground-2')}>até {shortDate(parseIsoDate(a.validUntil))}</span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
