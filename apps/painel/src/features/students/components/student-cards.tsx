import { Link } from 'react-router'
import { MessageCircle } from 'lucide-react'
import { activityLine, adherenceTone, initials, isInactive, type StudentListItem } from '@workspace/core'
import { RingProgress } from '@workspace/ui/blocks/ring-progress'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { SelectBox } from './select-box'
import { adherenceStroke, adherenceText, alertClass } from './tones'

type StudentCardsProps = {
  students: StudentListItem[]
  now: Date
  selecting: boolean
  selected: Record<string, boolean>
  onToggle: (id: string, on: boolean) => void
  resent: string[]
  onResendInvite: (s: StudentListItem) => void
  empty: string
}

/** Lista do celular: anel de adesão em volta das iniciais, alertas e o atalho do chat. */
export function StudentCards({ students, now, selecting, selected, onToggle, resent, onResendInvite, empty }: StudentCardsProps) {
  return (
    <section aria-label="Lista de alunos" className="flex flex-col gap-2 lg:hidden">
      {students.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-line-strong p-5.5 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {students.map((s) => {
            const on = !!selected[s.id]
            const tone = adherenceTone(s.adherence30d)
            const wasResent = resent.includes(s.id)
            return (
              <li key={s.id} className={cn('flex items-center gap-3 rounded-[18px] border p-3', on ? 'border-primary bg-primary/14' : 'bg-card')}>
                {selecting && <SelectBox label={`Selecionar ${s.fullName}`} checked={on} onChange={(v) => onToggle(s.id, v)} className="m-2.5 mr-0" />}
                <Link to={`/alunos/${s.id}`} aria-label={`Abrir perfil de ${s.fullName}`} className="flex min-w-0 grow items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <RingProgress
                    value={(s.adherence30d ?? 0) / 100}
                    label={s.adherence30d === null ? 'Sem dados de adesão' : `Adesão de ${Math.round(s.adherence30d)}% em 30 dias`}
                    size={48}
                    strokeWidth={3}
                    indicatorClassName={adherenceStroke[tone]}
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-extrabold">{initials(s.fullName)}</span>
                  </RingProgress>
                  <span className="flex min-w-0 grow flex-col gap-0.75">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[15px] font-extrabold">{s.fullName}</span>
                      {s.adherence30d !== null && <span className={cn('shrink-0 text-[13px] font-extrabold', adherenceText[tone])}>{Math.round(s.adherence30d)}%</span>}
                    </span>
                    <span className={cn('text-xs', isInactive(s, now) ? 'text-destructive' : 'text-muted-foreground')}>{activityLine(s, now)}</span>
                    {s.alerts.length > 0 && (
                      <span className="flex flex-wrap gap-1">
                        {s.alerts.map((a) => (
                          <span key={a.label} className={cn('flex h-5 items-center rounded-full px-1.75 text-[10.5px] font-extrabold', alertClass[a.tone])}>
                            {a.label}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </Link>
                {s.status === 'pending' && !selecting && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={wasResent}
                    onClick={() => onResendInvite(s)}
                    aria-label={wasResent ? `Convite reenviado para ${s.fullName}` : `Reenviar convite para ${s.fullName}`}
                    className={cn('h-9 shrink-0 px-2.5 text-xs disabled:opacity-100', wasResent && 'border-primary text-primary')}
                  >
                    {wasResent ? 'Reenviado' : 'Reenviar'}
                  </Button>
                )}
                {s.conversationId && !selecting && (
                  <Link to={`/chat/${s.conversationId}`} aria-label={`Conversar com ${s.fullName}`} className={cn(buttonVariants({ variant: 'outline', size: 'icon', className: 'shrink-0 border-input text-foreground-2' }))}>
                    <MessageCircle aria-hidden="true" className="size-4.5" />
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
