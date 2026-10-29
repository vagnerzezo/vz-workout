import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, Search } from 'lucide-react'
import { exerciseGroups, filterLibrary, muscleLabel, type Exercise, type ExerciseGroup } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type LibraryListProps = {
  library: Exercise[]
  /** Nome acessível de cada botão: "Adicionar Stiff ao Treino A — Push" */
  actionLabel: (e: Exercise) => string
  onPick: (e: Exercise) => void
  /** Desktop: botão + à direita; celular: a linha inteira é o botão */
  variant: 'aside' | 'sheet'
}

/** Busca, grupos musculares e a lista da biblioteca (painel do desktop e folha do celular). */
export function LibraryList({ library, actionLabel, onPick, variant }: LibraryListProps) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<ExerciseGroup | null>(null)
  const shown = filterLibrary(library, query, group)
  const chip = (on: boolean) =>
    cn('h-8 shrink-0 rounded-full border px-2.5 text-xs font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/12 text-primary' : 'border-input text-foreground-2')

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <span aria-live="polite" className="text-xs text-muted-foreground">
        {shown.length === 1 ? '1 exercício' : `${shown.length} exercícios`}
      </span>
      <label className="flex h-10.5 shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 focus-within:ring-3 focus-within:ring-ring/50">
        <Search aria-hidden="true" className="size-4 text-muted-foreground" />
        <input type="search" aria-label="Buscar exercício" placeholder="Buscar exercício" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 grow bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
      </label>
      <div role="group" aria-label="Grupo muscular" className="-mx-4 flex shrink-0 gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <button type="button" aria-pressed={group === null} onClick={() => setGroup(null)} className={chip(group === null)}>
          Todos
        </button>
        {exerciseGroups
          .filter((g) => library.some((e) => filterLibrary([e], '', g).length > 0))
          .map((g) => (
            <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(group === g ? null : g)} className={chip(group === g)}>
              {g}
            </button>
          ))}
      </div>
      <ul aria-label="Exercícios da biblioteca" className="flex min-h-0 flex-col gap-1.5 overflow-y-auto">
        {shown.map((e) => {
          const meta = `${muscleLabel[e.primary]} · ${e.equipment}`
          return variant === 'aside' ? (
            <li key={e.id} className="flex items-center gap-2.5 rounded-xl border bg-[#1a1c21] py-2 pr-2 pl-3">
              <span className="flex min-w-0 grow flex-col">
                <span className="text-[13px] font-bold">{e.name}</span>
                <span className="text-[11px] text-muted-foreground">{meta}</span>
              </span>
              <button type="button" aria-label={actionLabel(e)} onClick={() => onPick(e)} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Plus aria-hidden="true" strokeWidth={2.6} className="size-4" />
              </button>
            </li>
          ) : (
            <li key={e.id}>
              <button type="button" aria-label={actionLabel(e)} onClick={() => onPick(e)} className="flex min-h-13 w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="flex min-w-0 grow flex-col">
                  <span className="text-sm font-bold">{e.name}</span>
                  <span className="text-[11.5px] text-muted-foreground">{meta}</span>
                </span>
                <Plus aria-hidden="true" className="size-4.5 text-primary" />
              </button>
            </li>
          )
        })}
        {shown.length === 0 && <li className="px-2 py-4 text-[13px] text-muted-foreground">Nenhum exercício encontrado.</li>}
      </ul>
      {variant === 'aside' && (
        <Link to="/biblioteca?novo=1" className="flex h-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-line-strong text-[13px] font-bold text-foreground-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          + Cadastrar exercício com vídeo
        </Link>
      )}
    </div>
  )
}
