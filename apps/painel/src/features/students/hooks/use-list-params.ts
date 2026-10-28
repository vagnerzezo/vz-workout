import { useSearchParams } from 'react-router'
import type { StudentSort, StudentStatus } from '@workspace/core'

export const statusTabs: { status: StudentStatus; param: string; label: string }[] = [
  { status: 'active', param: 'ativos', label: 'Ativos' },
  { status: 'pending', param: 'pendentes', label: 'Pendentes' },
  { status: 'overdue', param: 'vencidos', label: 'Vencidos' },
  { status: 'archived', param: 'arquivados', label: 'Arquivados' },
]

/**
 * Filtros da lista na URL (seção 8.5 do guia): `?aba=pendentes&busca=ana&tags=Online,Hipertrofia&ordem=adesao&pagina=2`.
 * Recarregar mantém tudo e o link pode ser compartilhado. A busca do Dashboard chega por aqui.
 */
export function useListParams() {
  const [params, setParams] = useSearchParams()

  const status = statusTabs.find((t) => t.param === params.get('aba'))?.status ?? 'active'
  const query = params.get('busca') ?? ''
  const tags = params.get('tags')?.split(',').filter(Boolean) ?? []
  const sort: StudentSort = params.get('ordem') === 'adesao' ? 'adherence' : 'activity'
  const page = Math.max(1, Number(params.get('pagina')) || 1)

  /** Muda um filtro e volta para a página 1 (a não ser que a mudança seja a própria página). */
  const update = (changes: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!('pagina' in changes)) next.delete('pagina')
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  return {
    status,
    query,
    tags,
    sort,
    page,
    setStatus: (s: StudentStatus) => update({ aba: s === 'active' ? null : statusTabs.find((t) => t.status === s)!.param }),
    setQuery: (q: string) => update({ busca: q || null }),
    toggleTag: (tag: string) => update({ tags: (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]).join(',') || null }),
    toggleSort: () => update({ ordem: sort === 'activity' ? 'adesao' : null }),
    setPage: (p: number) => update({ pagina: p > 1 ? String(p) : null }),
  }
}
