import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { foodGroupLabel, FoodGroup, type Food } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
const one = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

/** Tabela de alimentos: busca, grupos e o + que adiciona à refeição aberta. */
export function FoodTable({ foods, mealName, onAdd }: { foods: Food[]; mealName: string | null; onAdd: (f: Food) => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<FoodGroup | null>(null)
  const q = fold(query.trim())
  const shown = foods.filter((f) => (!group || f.group === group) && (!q || fold(f.name).includes(q)))
  const chip = (on: boolean) => cn('h-8 shrink-0 rounded-full border px-2.5 text-xs font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/12 text-primary' : 'border-input text-foreground-2')
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <label className="flex h-10.5 shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 focus-within:ring-3 focus-within:ring-ring/50">
        <Search aria-hidden="true" className="size-4 text-muted-foreground" />
        <input type="search" aria-label="Buscar alimento" placeholder="Buscar alimento" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 grow bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
      </label>
      <div role="group" aria-label="Grupo de alimentos" className="-mx-4 flex shrink-0 gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <button type="button" aria-pressed={group === null} onClick={() => setGroup(null)} className={chip(group === null)}>
          Todos
        </button>
        {FoodGroup.options.map((g) => (
          <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(group === g ? null : g)} className={chip(group === g)}>
            {foodGroupLabel[g]}
          </button>
        ))}
      </div>
      <ul aria-label="Alimentos" className="flex min-h-0 flex-col gap-1.5 overflow-y-auto">
        {shown.map((f) => (
          <li key={f.id} className="flex items-center gap-2.5 rounded-xl border bg-[#1a1c21] py-2 pr-2 pl-3">
            <span className="flex min-w-0 grow flex-col">
              <span className="text-[13px] font-bold">{f.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {f.per100.kcal} kcal · P {one(f.per100.protein)} · C {one(f.per100.carbs)} · G {one(f.per100.fat)}
              </span>
            </span>
            <button
              type="button"
              disabled={!mealName}
              aria-label={mealName ? `Adicionar ${f.name} ao ${mealName}` : `Abra uma refeição para adicionar ${f.name}`}
              onClick={() => onAdd(f)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
            >
              <Plus aria-hidden="true" strokeWidth={2.6} className="size-4" />
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="px-2 py-4 text-[13px] text-muted-foreground">Nenhum alimento encontrado.</li>}
      </ul>
    </div>
  )
}
