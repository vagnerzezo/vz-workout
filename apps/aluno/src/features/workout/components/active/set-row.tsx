import { useState } from 'react'
import { Check } from 'lucide-react'
import { formatKg, parseDecimal } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import type { SetView } from '../../hooks/use-session-view'

const kindStyle = {
  warmup: 'bg-warning/16 text-warning',
  prep: 'bg-info/16 text-info',
  working: 'bg-secondary text-foreground',
} as const

/** "aquecimento 1", "preparatória 1", "série válida 2": usado nos rótulos para leitor de tela */
export function setName(set: Pick<SetView, 'kind' | 'key'>): string {
  const n = set.key.split(':')[1]!.slice(1)
  return { warmup: `aquecimento ${n}`, prep: `preparatória ${n}`, working: `série válida ${n}` }[set.kind]
}

type SetRowProps = {
  set: SetView
  onEdit: (patch: { kg?: number | null; reps?: number | null }) => void
  onToggle: () => void
}

export const SET_GRID = 'grid grid-cols-[44px_minmax(0,1fr)_72px_64px_44px] items-center gap-2'

export function SetRow({ set, onEdit, onToggle }: SetRowProps) {
  const name = setName(set)
  const prev = set.previous ? `${formatKg(set.previous.kg)} kg × ${set.previous.reps}` : '—'

  return (
    <div className={cn(SET_GRID, 'rounded-xl px-0.5 py-1', set.done && 'bg-primary/10')}>
      <span
        aria-hidden="true"
        className={cn('flex h-9 items-center justify-center rounded-[10px] text-sm font-extrabold', kindStyle[set.kind])}
      >
        {set.label}
      </span>
      <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <span className="sr-only">Anterior: </span>
        {prev}
        {set.isRecord && (
          <span className="flex h-5 items-center rounded-full bg-warning px-1.5 text-[10.5px] font-extrabold text-primary-foreground">
            <abbr title="Recorde pessoal" className="no-underline">
              PR
            </abbr>
          </span>
        )}
      </span>
      <NumberField
        label={`Carga da ${name}, em kg`}
        value={set.entry?.kg ?? null}
        placeholder={formatKg(set.suggestion.kg)}
        done={set.done}
        format={formatKg}
        onCommit={(kg) => onEdit({ kg })}
      />
      <NumberField
        label={`Repetições da ${name}`}
        value={set.entry?.reps ?? null}
        placeholder={String(set.suggestion.reps)}
        done={set.done}
        integer
        format={String}
        onCommit={(reps) => onEdit({ reps })}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={set.done}
        aria-label={`${set.done ? 'Desmarcar' : 'Concluir'} ${name}`}
        className={cn(
          'flex h-10 w-11 items-center justify-center rounded-[10px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          set.done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent',
        )}
      >
        <Check aria-hidden="true" className="size-4.5" strokeWidth={2.8} />
      </button>
    </div>
  )
}

type NumberFieldProps = {
  label: string
  value: number | null
  placeholder: string
  done: boolean
  integer?: boolean
  format: (n: number) => string
  onCommit: (value: number | null) => void
}

/** Campo numérico que aceita vírgula: guarda o texto enquanto digita e salva ao sair do campo. */
function NumberField({ label, value, placeholder, done, integer, format, onCommit }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (value === null ? '' : format(value))

  const commit = () => {
    if (draft === null) return
    const n = parseDecimal(draft)
    const clean = n === null || n < 0 ? null : integer ? Math.round(n) : Math.round(n * 2) / 2 // carga em passos de 0,5 kg
    if (clean !== value) onCommit(clean)
    setDraft(null)
  }

  return (
    <input
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      aria-label={label}
      value={shown}
      placeholder={placeholder}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={cn(
        'h-10 w-full rounded-[10px] border bg-sunken text-center text-base font-extrabold outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        done ? 'border-transparent' : 'border-input',
      )}
    />
  )
}
