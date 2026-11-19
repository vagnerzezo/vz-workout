import type { ReactNode } from 'react'
import { cn } from '@workspace/ui/lib/utils'

/** Peças dos formulários do painel (Novo aluno, Editar dados): mesmo visual de campo, rótulo, dica e chips. */
export const field =
  'h-12 w-full rounded-[14px] border bg-card px-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'
export const sectionTitle = 'text-[13px] font-extrabold tracking-[1px] text-muted-foreground'
export const fieldLabel = 'text-xs font-bold text-foreground-2'

export function Hint({ id, tone, children }: { id: string; tone: 'muted' | 'error' | 'warning'; children: ReactNode }) {
  const color = { muted: 'text-muted-foreground', error: 'text-destructive', warning: 'text-warning' }[tone]
  return (
    <span id={id} className={cn('text-[11.5px] leading-[1.4]', color)}>
      {children}
    </span>
  )
}

/** Botões de escolha única (role="radio"), no formato de chip. */
export function Chips<V extends string | null>({ label, value, onChange, options }: { label: string; value: V; onChange: (v: V) => void; options: { value: V; label: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={fieldLabel}>{label}</span>
      <div role="radiogroup" aria-label={label} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {options.map((o) => {
          const on = o.value === value
          return (
            <button
              key={o.value ?? 'nenhum'}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn(
                'h-9.5 shrink-0 rounded-full border px-3 text-[12.5px] font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
