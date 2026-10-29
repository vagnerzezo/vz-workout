import { Link, useNavigate } from 'react-router'
import { Copy, MoreHorizontal } from 'lucide-react'
import { levelLabel, parseIsoDate, planGoalLabel, shortDate, studentsUsingLabel, updatedAgo, type PlanGoal, type PlanTemplateSummary } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'
import { cn } from '@workspace/ui/lib/utils'

export const goalTone: Record<PlanGoal, string> = {
  hypertrophy: 'bg-primary/14 text-primary',
  fatLoss: 'bg-info/16 text-info',
  strength: 'bg-destructive/16 text-destructive',
  conditioning: 'bg-warning/16 text-warning',
}

type TemplateCardProps = {
  template: PlanTemplateSummary
  now: Date
  onAssign: () => void
  onDuplicate: () => void
  onArchive: () => void
  onUnarchive: () => void
}

/** Card do modelo. Desktop: números em três colunas e "Atualizada em"; celular: "atualizada há…" (canvas). */
export function TemplateCard({ template: t, now, onAssign, onDuplicate, onArchive, onUnarchive }: TemplateCardProps) {
  const navigate = useNavigate()
  const editor = `/fichas/${t.id}`
  const chip = 'flex h-6 items-center rounded-full px-2.5 text-[11px]'
  return (
    <article aria-labelledby={`ficha-${t.id}`} className="flex flex-col gap-3 rounded-[18px] border bg-card p-3.5 lg:gap-3.5 lg:rounded-[20px] lg:p-4.5">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <Link id={`ficha-${t.id}`} to={editor} className="rounded text-[15px] leading-[1.3] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:text-base">
            {t.name}
          </Link>
          <span className="text-xs text-muted-foreground">{t.split}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label={`Mais ações para ${t.name}`} className="shrink-0 border-input text-foreground-2" />}>
            <MoreHorizontal aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onClick={() => navigate(editor)}>Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>Duplicar</DropdownMenuItem>
            <DropdownMenuSeparator />
            {t.archived ? (
              <DropdownMenuItem onClick={onUnarchive}>Restaurar</DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onClick={onArchive}>
                Arquivar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={cn(chip, 'font-extrabold', goalTone[t.goal])}>{planGoalLabel[t.goal]}</span>
        <span className={cn(chip, 'border font-bold text-foreground-2')}>{levelLabel[t.level]}</span>
        {t.atHome && <span className={cn(chip, 'border font-bold text-foreground-2')}>Em casa</span>}
      </div>

      <dl className="grid grid-cols-3 gap-2 border-t border-[#22252b] pt-3">
        <div className="flex flex-col-reverse gap-0.5">
          <dt className="text-[11px] text-muted-foreground">por semana</dt>
          <dd className="text-lg font-extrabold">{t.daysPerWeek}x</dd>
        </div>
        <div className="flex flex-col-reverse gap-0.5">
          <dt className="text-[11px] text-muted-foreground">{t.phaseCount} fases</dt>
          <dd className="text-lg font-extrabold">{t.durationWeeks} sem</dd>
        </div>
        <div className="flex flex-col-reverse gap-0.5">
          <dt className="text-[11px] text-muted-foreground">alunos usando</dt>
          <dd className="text-lg font-extrabold">{t.studentsUsing}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-2">
        <span className="grow text-xs text-muted-foreground">
          <span className="lg:hidden">
            {studentsUsingLabel(t.studentsUsing)} · {updatedAgo(t.updatedAt, now)}
          </span>
          <span className="hidden lg:inline">Atualizada em {shortDate(parseIsoDate(t.updatedAt))}</span>
        </span>
        <Button variant="outline" size="sm" onClick={onDuplicate} aria-label={`Duplicar ${t.name}`} className="h-10 w-10 border-line-strong px-0 lg:h-9 lg:w-auto lg:px-3 lg:text-xs lg:font-bold">
          <Copy aria-hidden="true" className="lg:hidden" />
          <span className="hidden lg:inline">Duplicar</span>
        </Button>
        {t.archived ? (
          <Button size="sm" onClick={onUnarchive} className="h-10 px-3.5 text-[13px] font-extrabold lg:h-9 lg:px-3 lg:text-xs">
            Restaurar
          </Button>
        ) : (
          <Button size="sm" onClick={onAssign} aria-label={`Atribuir ${t.name}`} className="h-10 px-3.5 text-[13px] font-extrabold lg:h-9 lg:px-3 lg:text-xs">
            Atribuir
          </Button>
        )}
      </div>
    </article>
  )
}
