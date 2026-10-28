import { toast } from 'sonner'
import { initials, type Birthday } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { useCongratulate } from '../api/queries'
import { panelClass } from './panel'

export function BirthdaysCard({ birthdays }: { birthdays: Birthday[] }) {
  const congratulate = useCongratulate()
  if (birthdays.length === 0) return null

  const send = (b: Birthday) =>
    congratulate.mutate(b.studentId, {
      onSuccess: () => toast.success(`Mensagem de parabéns enviada para ${b.name.split(' ')[0]}`),
      onError: () => toast.error('Não foi possível enviar. Tente de novo.'),
    })

  return (
    <section id="aniversariantes" aria-labelledby="aniversariantes-titulo" className={cn(panelClass, 'scroll-mt-6 gap-3')}>
      <h2 id="aniversariantes-titulo" className="text-[15px] font-extrabold lg:text-base">
        Aniversariantes de hoje
      </h2>
      <ul className="flex flex-col gap-3">
        {birthdays.map((b) => (
          <li key={b.studentId} className="flex items-center gap-2.5 lg:gap-3">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold">
              {initials(b.name)}
            </span>
            <span className="grow text-sm font-bold">
              {b.name} <span className="font-medium text-muted-foreground">· {b.age} anos</span>
            </span>
            <Button
              size="sm"
              variant={b.congratulated ? 'outline' : 'default'}
              disabled={b.congratulated}
              aria-label={b.congratulated ? `Parabéns enviado para ${b.name}` : `Parabenizar ${b.name}`}
              onClick={() => send(b)}
              className={cn('h-9 px-3 text-xs disabled:opacity-100', b.congratulated && 'border-primary text-primary')}
            >
              {b.congratulated ? 'Enviado' : 'Parabenizar'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
