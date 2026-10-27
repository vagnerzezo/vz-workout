import { Check, X } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

export type ShoppingRow = {
  id: string
  name: string
  quantity: string
  removable?: boolean // item fora do plano
}

type ShoppingGroupProps = {
  title: string
  rows: ShoppingRow[]
  checkedIds: Set<string>
  onToggle: (id: string, checked: boolean) => void
  onRemove?: (row: ShoppingRow) => void
}

/** Seção do mercado com os itens marcáveis; o item comprado fica riscado. */
export function ShoppingGroup({ title, rows, checkedIds, onToggle, onRemove }: ShoppingGroupProps) {
  const done = rows.filter((r) => checkedIds.has(r.id)).length
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-extrabold tracking-[1.2px] text-muted-foreground uppercase">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {done} de {rows.length}
        </span>
      </div>
      <ul className="overflow-hidden rounded-[18px] border bg-card">
        {rows.map((row) => {
          const checked = checkedIds.has(row.id)
          return (
            <li key={row.id} className="flex items-center border-t border-border/70 first:border-t-0">
              <label className="flex min-h-13 grow cursor-pointer items-center gap-3 px-3.5 py-2 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-focus-visible:ring-inset">
                <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => onToggle(row.id, !checked)} />
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-lg border-2 text-primary-foreground',
                    checked ? 'border-primary bg-primary' : 'border-line-strong',
                  )}
                >
                  {checked && <Check className="size-3.5" strokeWidth={3.4} />}
                </span>
                <span className={cn('grow text-[15px] font-semibold', checked && 'text-muted-foreground line-through')}>{row.name}</span>
                {row.quantity && (
                  <span className={cn('shrink-0 text-sm font-extrabold whitespace-nowrap', checked ? 'text-muted-foreground' : 'text-foreground-2')}>{row.quantity}</span>
                )}
              </label>
              {row.removable && onRemove && (
                <button
                  type="button"
                  aria-label={`Remover ${row.name}`}
                  onClick={() => onRemove(row)}
                  className="mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
