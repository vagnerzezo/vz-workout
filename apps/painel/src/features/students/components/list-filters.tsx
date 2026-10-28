import { ArrowDownUp, Search } from 'lucide-react'
import type { StudentSort } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type ListFiltersProps = {
  query: string
  onQuery: (q: string) => void
  tags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  sort: StudentSort
  onToggleSort: () => void
}

const sortLabel: Record<StudentSort, [string, string]> = {
  activity: ['Ordenar: última atividade', 'Última atividade'],
  adherence: ['Ordenar: menor adesão primeiro', 'Menor adesão'],
}

/** Busca (o texto mora na URL e muda enquanto digita), chips de tag e a ordem. */
export function ListFilters({ query, onQuery, tags, selectedTags, onToggleTag, sort, onToggleSort }: ListFiltersProps) {
  const sortButton = (
    <button
      type="button"
      onClick={onToggleSort}
      className="flex h-8.5 shrink-0 items-center gap-1.5 rounded-full border border-input bg-card px-3 text-xs font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:order-last lg:h-9 lg:text-[13px]"
    >
      <ArrowDownUp aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
      <span className="hidden lg:inline">{sortLabel[sort][0]}</span>
      <span className="lg:hidden">{sortLabel[sort][1]}</span>
    </button>
  )

  return (
    // No celular a busca vem antes das abas de status e os chips depois (canvas): `contents` deixa o pai ordenar
    <div className="contents lg:flex lg:flex-row lg:flex-wrap lg:items-center lg:gap-2.5">
      <label className="order-2 flex h-11.5 items-center gap-2.5 rounded-full border bg-card px-4 focus-within:ring-3 focus-within:ring-ring/50 lg:h-11 lg:max-w-[420px] lg:flex-[1_1_280px]">
        <Search aria-hidden="true" className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={2} />
        <input
          type="search"
          aria-label="Buscar aluno"
          placeholder="Buscar por nome ou e-mail"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="min-w-0 grow bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      <div className="order-4 -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:grow lg:flex-wrap lg:overflow-visible lg:px-0">
        {sortButton}
        <div role="group" aria-label="Tags" className="flex gap-1.5 lg:flex-wrap">
          {tags.map((tag) => {
            const on = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleTag(tag)}
                className={cn(
                  'h-8.5 shrink-0 rounded-full border px-3 text-xs font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-9 lg:text-[13px]',
                  on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2 hover:text-foreground',
                )}
              >
                {tag}
              </button>
            )
          })}
        </div>
        <div className="hidden grow lg:block" />
      </div>
    </div>
  )
}
