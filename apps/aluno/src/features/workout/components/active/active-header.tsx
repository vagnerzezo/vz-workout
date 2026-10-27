import { Link } from 'react-router'
import { ChevronDown, Timer } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

type ActiveHeaderProps = {
  title: string
  exerciseLabel: string
  onOpenTimer: () => void
  onFinish: () => void
}

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

export function ActiveHeader({ title, exerciseLabel, onOpenTimer, onFinish }: ActiveHeaderProps) {
  return (
    <header className="flex items-center gap-2.5 border-b border-secondary px-5 pt-[max(16px,env(safe-area-inset-top))] pb-3">
      {/* O treino continua salvo no aparelho: minimizar só volta para a lista */}
      <Link to="/treinos" aria-label="Minimizar treino" className={iconButton}>
        <ChevronDown aria-hidden="true" className="size-5" strokeWidth={2} />
      </Link>
      <div className="flex min-w-0 grow flex-col">
        <h1 className="truncate text-base font-extrabold">{title}</h1>
        <span className="text-xs text-muted-foreground">{exerciseLabel}</span>
      </div>
      <button type="button" aria-label="Abrir timer de descanso" onClick={onOpenTimer} className={iconButton}>
        <Timer aria-hidden="true" className="size-5" strokeWidth={1.9} />
      </button>
      <Button onClick={onFinish} className="px-4.5">
        Concluir
      </Button>
    </header>
  )
}
