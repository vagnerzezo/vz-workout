import { Link } from 'react-router'
import type { CoachDashboard } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type Chip = { to: string; label: [string, string]; value: number; dot: string; only?: 'desktop' | 'mobile' }

/** Resumo rápido em chips. Desktop e celular mostram conjuntos um pouco diferentes (canvas). */
export function SummaryChips({ dashboard: d }: { dashboard: CoachDashboard }) {
  const chips: Chip[] = [
    { to: '/alunos', label: ['Treinaram hoje', 'Treinaram hoje'], value: d.trainedToday, dot: 'bg-primary' },
    { to: '/fichas', label: ['Fichas vencendo em 7 dias', 'Fichas vencendo'], value: d.plansExpiring, dot: 'bg-warning' },
    { to: '/alunos', label: ['Sem vigência', 'Sem vigência'], value: d.withoutPlan, dot: 'bg-warning' },
    { to: '/financeiro', label: ['Alunos vencidos', 'Alunos vencidos'], value: d.overdueStudents, dot: 'bg-line-strong', only: 'desktop' },
    { to: '/financeiro', label: ['Comprovantes', 'Comprovantes'], value: d.pendingProofs, dot: 'bg-info', only: 'mobile' },
    { to: '#aniversariantes', label: ['Aniversariantes hoje', 'Aniversários'], value: d.birthdays.length, dot: 'bg-violet' },
  ]

  return (
    <nav aria-label="Resumo rápido" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:gap-2.5 lg:px-0">
      {chips.map((c) => (
        <Link
          key={c.label[0]}
          to={c.to}
          className={cn(
            'flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-sidebar px-3 text-xs whitespace-nowrap text-foreground-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-10 lg:gap-2 lg:px-3.5 lg:text-[13px]',
            c.only === 'desktop' && 'hidden lg:flex',
            c.only === 'mobile' && 'lg:hidden',
          )}
        >
          <span aria-hidden="true" className={cn('size-1.75 rounded-full lg:size-2', c.dot)} />
          <span className="hidden lg:inline">{c.label[0]}</span>
          <span className="lg:hidden">{c.label[1]}</span>
          <strong className="text-foreground">{c.value}</strong>
        </Link>
      ))}
    </nav>
  )
}
