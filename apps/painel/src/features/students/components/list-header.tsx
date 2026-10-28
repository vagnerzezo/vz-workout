import { Link } from 'react-router'
import { Download, Plus } from 'lucide-react'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

type ListHeaderProps = {
  active: number
  limit: number | undefined
  pending: number
  selecting: boolean
  onToggleSelecting: () => void
  onExport: () => void
}

export function ListHeader({ active, limit, pending, selecting, onToggleSelecting, onExport }: ListHeaderProps) {
  const usage = limit ? `${active} ativos de ${limit} do seu plano` : `${active} ativos`
  return (
    <header className="order-1 flex flex-wrap lg:order-none items-center justify-between gap-2.5 lg:gap-3">
      <div className="flex grow flex-col gap-0.5 lg:grow-0 lg:gap-1">
        <h1 className="text-[26px] font-extrabold tracking-[-0.5px] lg:text-[28px]">Alunos</h1>
        <span className="text-[13px] text-muted-foreground">
          {usage}
          <span className="hidden lg:inline">
            {pending > 0 && ` · ${pending} ${pending === 1 ? 'convite pendente' : 'convites pendentes'}`}
          </span>
        </span>
      </div>

      {/* Celular: "Selecionar" liga o modo de seleção; "+" cadastra */}
      <Button variant="outline" onClick={onToggleSelecting} className={cn('border-border px-3.5 text-[13px] lg:hidden', selecting ? 'bg-accent' : 'bg-card')}>
        {selecting ? 'Cancelar' : 'Selecionar'}
      </Button>
      <Link to="/alunos/novo" aria-label="Cadastrar aluno" className={cn(buttonVariants({ size: 'icon', className: 'lg:hidden' }))}>
        <Plus aria-hidden="true" strokeWidth={2.6} className="size-5" />
      </Link>

      <div className="hidden flex-wrap gap-2.5 lg:flex">
        <Button variant="outline" size="lg" onClick={onExport} className="font-bold">
          <Download aria-hidden="true" />
          Exportar CSV
        </Button>
        <Link to="/alunos/novo" className={cn(buttonVariants({ size: 'lg' }))}>
          <Plus aria-hidden="true" strokeWidth={2.6} />
          Convidar aluno
        </Link>
      </div>
    </header>
  )
}
