import { ChevronDown, FileText } from 'lucide-react'
import type { WorkoutPlan } from '@workspace/core'
import { parseIsoDate, planWeek, shortDate } from '@workspace/core'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@workspace/ui/components/collapsible'
import { SurfaceCard } from '../../../shared/components/surface-card'

export function CurrentPlanCard({ plan, today }: { plan: WorkoutPlan; today: Date }) {
  const updated = shortDate(parseIsoDate(plan.updatedAt))
  const validUntil = shortDate(parseIsoDate(plan.validUntil))

  return (
    <SurfaceCard role="region" aria-labelledby="ficha-atual" className="gap-3 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-extrabold tracking-[1.2px] text-muted-foreground">FICHA ATUAL</span>
          <h2 id="ficha-atual" className="text-[17px] font-extrabold">
            {plan.name}
          </h2>
          <span className="text-[13px] text-muted-foreground">
            Atualizada em {updated} · válida até {validUntil}
          </span>
        </div>
        <span className="flex h-6.5 shrink-0 items-center rounded-full bg-primary/15 px-2.5 text-xs font-extrabold text-primary">
          Semana {planWeek(plan, today)} de {plan.durationWeeks}
        </span>
      </div>
      {plan.notes.length > 0 && (
        <Collapsible className="flex flex-col gap-3">
          <CollapsibleTrigger className="group flex h-11 items-center justify-between rounded-[14px] border bg-secondary px-3.5 text-sm font-bold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex items-center gap-2">
              <FileText aria-hidden="true" className="size-4.5 text-primary" strokeWidth={1.9} />
              Orientações do treinador
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-4.5 text-muted-foreground motion-safe:transition-transform group-data-panel-open:rotate-180"
              strokeWidth={2}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 text-[13px] leading-normal text-foreground-2">
            {plan.notes.map((note) => (
              <p key={note.title}>
                <strong className="text-foreground">{note.title}:</strong> {note.text}
              </p>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </SurfaceCard>
  )
}
