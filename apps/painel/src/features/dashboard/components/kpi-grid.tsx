import { Link } from 'react-router'
import { CalendarDays, SquareCheckBig, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import { adherenceSummary, formatSigned, type CoachDashboard } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type Kpi = {
  to: string
  /** Rótulo do desktop e o mais curto do celular (canvas) */
  label: [string, string]
  value: string
  note: [string, string]
  noteClass: string
  icon: LucideIcon
  iconClass: string
}

const Both = ({ text: [desktop, mobile] }: { text: [string, string] }) =>
  desktop === mobile ? (
    <>{desktop}</>
  ) : (
    <>
      <span className="hidden lg:inline">{desktop}</span>
      <span className="lg:hidden">{mobile}</span>
    </>
  )

export function KpiGrid({ dashboard: d }: { dashboard: CoachDashboard }) {
  const adherence = adherenceSummary(d.adherence)
  const pts = `${formatSigned(adherence.deltaPts)} pts`
  const n = d.dueIn7Days.dueTomorrow
  const dueTomorrow = `${n} ${n === 1 ? 'vence' : 'vencem'} amanhã`
  const urgent = (n: number) => (n > 0 ? 'text-destructive' : 'text-muted-foreground')

  const kpis: Kpi[] = [
    {
      to: '/alunos',
      label: ['Alunos ativos', 'Alunos ativos'],
      value: String(d.activeStudents.count),
      note: [`${formatSigned(d.activeStudents.newThisMonth)} este mês`, `${formatSigned(d.activeStudents.newThisMonth)} este mês`],
      noteClass: d.activeStudents.newThisMonth >= 0 ? 'text-primary' : 'text-warning',
      icon: Users,
      iconClass: 'bg-primary/14 text-primary',
    },
    {
      to: '/alunos',
      label: ['Adesão média (7 dias)', 'Adesão 7 dias'],
      value: `${adherence.current}%`,
      note: [`${pts} vs semana passada`, `${pts} na semana`],
      noteClass: adherence.deltaPts < 0 ? 'text-warning' : 'text-primary',
      icon: TrendingUp,
      iconClass: 'bg-warning/14 text-warning',
    },
    {
      to: '/check-ins',
      label: ['Check-ins pendentes', 'Check-ins'],
      value: String(d.pendingCheckIns.count),
      note: [`${d.pendingCheckIns.over48h} há mais de 48 h`, `${d.pendingCheckIns.over48h} há mais de 48 h`],
      noteClass: urgent(d.pendingCheckIns.over48h),
      icon: SquareCheckBig,
      iconClass: 'bg-info/14 text-info',
    },
    {
      to: '/financeiro',
      label: ['Vencimentos em 7 dias', 'Vencem em 7 dias'],
      value: String(d.dueIn7Days.count),
      note: [dueTomorrow, dueTomorrow],
      noteClass: urgent(d.dueIn7Days.dueTomorrow),
      icon: CalendarDays,
      iconClass: 'bg-destructive/14 text-destructive',
    },
  ]

  return (
    <section aria-label="Indicadores" className="grid grid-cols-2 gap-2.5 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] lg:gap-3.5">
      {kpis.map((k) => (
        <Link
          key={k.label[0]}
          to={k.to}
          className="flex flex-col gap-1.5 rounded-[18px] border bg-card p-3.5 outline-none hover:border-input focus-visible:ring-3 focus-visible:ring-ring/50 lg:gap-2.5 lg:rounded-[20px] lg:p-4.5"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-xs text-foreground-2 lg:text-[13px]">
              <Both text={k.label} />
            </span>
            <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg lg:size-9 lg:rounded-[10px]', k.iconClass)}>
              <k.icon aria-hidden="true" className="size-3.5 lg:size-4.5" strokeWidth={2.2} />
            </span>
          </span>
          <span className="text-[28px] leading-none font-extrabold tracking-[-0.6px] lg:text-[32px] lg:leading-tight lg:tracking-[-0.8px]">{k.value}</span>
          <span className={cn('text-[11.5px] font-bold lg:text-xs', k.noteClass)}>
            <Both text={k.note} />
          </span>
        </Link>
      ))}
    </section>
  )
}
