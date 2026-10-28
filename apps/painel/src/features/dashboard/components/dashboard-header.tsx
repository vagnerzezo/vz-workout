import { Link } from 'react-router'
import { Bell, Plus } from 'lucide-react'
import { dayLabel, greetingFor, initials } from '@workspace/core'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { SearchBox } from './search-box'

function BellLink({ unread, className }: { unread: number; className?: string }) {
  return (
    <Link
      to="/notificacoes"
      aria-label={unread ? `Notificações, ${unread} novas` : 'Notificações'}
      className={cn('relative flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50', className)}
    >
      <Bell aria-hidden="true" className="size-5" strokeWidth={1.9} />
      {unread > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10.5px] font-extrabold text-background">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}

/** Barra do topo do desktop: busca com Ctrl K, sino e "Novo aluno". */
export function DesktopTopBar({ unread }: { unread: number }) {
  return (
    <div className="hidden flex-wrap items-center gap-3 lg:flex">
      <SearchBox placeholder="Buscar aluno, ficha ou exercício" shortcut className="max-w-[520px] flex-[1_1_320px]" />
      <div className="grow" />
      <BellLink unread={unread} />
      <Link to="/alunos/novo" className={cn(buttonVariants({ size: 'lg' }))}>
        <Plus aria-hidden="true" strokeWidth={2.6} />
        Novo aluno
      </Link>
    </div>
  )
}

type DashboardHeaderProps = {
  coachFirstName: string
  coachFullName: string
  now: Date
  unread: number
  /** Alunos diferentes na lista "Precisa da sua atenção" */
  studentsNeedingAttention: number
}

export function DashboardHeader({ coachFirstName, coachFullName, now, unread, studentsNeedingAttention: n }: DashboardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-2.5 lg:items-end lg:justify-between lg:gap-3">
      <div className="flex grow flex-col gap-0.5 lg:grow-0 lg:gap-1">
        <span className="text-[13px] text-muted-foreground">{dayLabel(now)}</span>
        <h1 className="text-2xl font-extrabold tracking-[-0.4px] lg:text-[28px] lg:tracking-[-0.5px]">
          {greetingFor(now)}, {coachFirstName}
        </h1>
      </div>
      <p className="hidden text-sm text-foreground-2 lg:block">
        {n === 0 ? (
          'Nenhum aluno precisa da sua atenção hoje'
        ) : (
          <>
            <strong className="text-primary">{n === 1 ? '1 aluno' : `${n} alunos`}</strong> {n === 1 ? 'precisa' : 'precisam'} da sua atenção hoje
          </>
        )}
      </p>
      <BellLink unread={unread} className="lg:hidden" />
      <Link
        to="/configuracoes"
        aria-label="Seu perfil e configurações"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
      >
        {initials(coachFullName)}
      </Link>
    </header>
  )
}
