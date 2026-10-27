import { CloudOff } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

type ErrorStateProps = {
  title: string
  onRetry: () => void
  retrying: boolean
}

/** Erro de carregamento de uma tela inteira, com "Tentar de novo". */
export function ErrorState({ title, onRetry, retrying }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <CloudOff aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold">{title}</h1>
        <p className="text-sm text-muted-foreground">Confira sua conexão e tente de novo.</p>
      </div>
      <Button size="lg" onClick={onRetry} disabled={retrying}>
        {retrying ? 'Tentando…' : 'Tentar de novo'}
      </Button>
    </div>
  )
}
