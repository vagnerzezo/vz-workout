import { Link, useNavigate } from 'react-router'
import { Copy, MoreHorizontal } from 'lucide-react'
import { dietGoalLabel, formatInt, macroShares, parseIsoDate, shortDate, studentsUsingLabel, updatedAgo, type DietGoal, type DietTemplateSummary } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'
import { cn } from '@workspace/ui/lib/utils'

const goalTone: Record<DietGoal, string> = {
  recomposition: 'bg-primary/14 text-primary',
  fatLoss: 'bg-info/16 text-info',
  hypertrophy: 'bg-warning/16 text-warning',
  maintenance: 'bg-violet/16 text-violet',
}

const pct = (n: number) => `${Math.round(n * 100)}%`

/** Barra de proteína, carboidrato e gordura nas calorias (o leitor de tela ouve as porcentagens). */
export function MacroBar({ macros, className }: { macros: { protein: number; carbs: number; fat: number }; className?: string }) {
  const s = macroShares(macros)
  return (
    <span role="img" aria-label={`Proteína ${pct(s.protein)}, carboidrato ${pct(s.carbs)}, gordura ${pct(s.fat)} das calorias`} className={cn('flex h-2 gap-0.5 overflow-hidden rounded-full lg:h-2.5', className)}>
      <span className="block bg-protein" style={{ width: `${(s.protein * 100).toFixed(1)}%` }} />
      <span className="block bg-carb" style={{ width: `${(s.carbs * 100).toFixed(1)}%` }} />
      <span className="block bg-fat" style={{ width: `${(s.fat * 100).toFixed(1)}%` }} />
    </span>
  )
}

type DietCardProps = {
  template: DietTemplateSummary
  now: Date
  onAssign: () => void
  onDuplicate: () => void
  onArchive: () => void
  onUnarchive: () => void
}

export function DietCard({ template: t, now, onAssign, onDuplicate, onArchive, onUnarchive }: DietCardProps) {
  const navigate = useNavigate()
  const editor = `/dietas/${t.id}`
  const m = t.targets
  return (
    <article aria-labelledby={`dieta-${t.id}`} className="flex flex-col gap-2.5 rounded-[18px] border bg-card p-3.5 lg:gap-3.5 lg:rounded-[20px] lg:p-4.5">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-col gap-0.5 lg:gap-1">
          <Link id={`dieta-${t.id}`} to={editor} className="rounded text-[15px] leading-[1.3] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:text-base">
            {t.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {t.meals} refeições · {t.substitutions} substituições
          </span>
        </div>
        <span className={cn('flex h-5.5 shrink-0 items-center rounded-full px-2 text-[11px] font-extrabold lg:h-6 lg:px-2.5', goalTone[t.goal])}>{dietGoalLabel[t.goal]}</span>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label={`Mais ações para ${t.name}`} className="-my-1 shrink-0 border-input text-foreground-2" />}>
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

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5 lg:flex-col lg:items-stretch">
        <span className="flex items-baseline gap-1.5 lg:gap-2">
          <span className="text-[22px] font-extrabold tracking-[-0.4px] lg:text-[26px]">{formatInt(m.kcal)}</span>
          <span className="text-xs text-muted-foreground lg:text-[13px]">
            <span className="lg:hidden">kcal/dia</span>
            <span className="hidden lg:inline">kcal por dia</span>
          </span>
        </span>
        <MacroBar macros={m} className="order-last w-full lg:order-none" />
        <span className="flex gap-2.5 text-xs text-foreground-2 lg:gap-3">
          <span>
            P <strong className="text-protein">{m.protein} g</strong>
          </span>
          <span>
            C <strong className="text-carb">{m.carbs} g</strong>
          </span>
          <span>
            G <strong className="text-fat">{m.fat} g</strong>
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2 border-t border-[#22252b] pt-2.5 lg:pt-3">
        <span className="grow text-xs text-muted-foreground">
          <span className="lg:hidden">
            {studentsUsingLabel(t.studentsUsing)} · {updatedAgo(t.updatedAt, now)}
          </span>
          <span className="hidden lg:inline">
            {studentsUsingLabel(t.studentsUsing)} · atualizada em {shortDate(parseIsoDate(t.updatedAt))}
          </span>
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
