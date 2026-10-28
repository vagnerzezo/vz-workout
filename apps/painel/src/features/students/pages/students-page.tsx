import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { filterStudents, sortStudents, statusCounts, studentsToCsv, toIsoDate, type StudentListItem } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { useCoach } from '../../../shared/api/coach'
import { ErrorState } from '../../../shared/components/error-state'
import { useArchiveStudents, useResendInvite, useStudents, useTagStudents, useUnarchiveStudents } from '../api/queries'
import { ArchiveDialog } from '../components/archive-dialog'
import { BulkActions } from '../components/bulk-actions'
import { ListFilters } from '../components/list-filters'
import { ListFooter } from '../components/list-footer'
import { ListHeader } from '../components/list-header'
import { StatusTabs } from '../components/status-tabs'
import { StudentCards } from '../components/student-cards'
import { PAGE_SIZE, StudentsTable } from '../components/students-table'
import { statusTabs, useListParams } from '../hooks/use-list-params'

const tabNoun = { active: 'alunos ativos', pending: 'convites pendentes', overdue: 'alunos vencidos', archived: 'alunos arquivados' } as const

function download(text: string, filename: string) {
  // BOM: o Excel reconhece o UTF-8 (acentos) ao abrir
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`)

export default function StudentsPage() {
  const coach = useCoach()
  const list = useStudents()
  const params = useListParams()
  const [now] = useState(() => new Date())
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [selecting, setSelecting] = useState(false) // modo de seleção do celular
  const [toArchive, setToArchive] = useState<string[]>([])
  const [resent, setResent] = useState<string[]>([])
  const archive = useArchiveStudents()
  const unarchive = useUnarchiveStudents()
  const tag = useTagStudents()
  const resend = useResendInvite()

  const all = useMemo(() => list.data?.students ?? [], [list.data])
  const shown = useMemo(
    () => sortStudents(filterStudents(all, { status: params.status, query: params.query, tags: params.tags }), params.sort),
    [all, params.status, params.query, params.tags, params.sort],
  )
  const counts = statusCounts(all)
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const page = Math.min(params.page, pages)

  // Só vale a seleção do que está na tela: trocar de aba ou filtro não carrega marcados escondidos
  const selectedIds = shown.filter((s) => selection[s.id]).map((s) => s.id)
  const visibleSelection = Object.fromEntries(selectedIds.map((id) => [id, true]))
  const clearSelection = () => setSelection({})
  const nameOf = (id: string) => all.find((s) => s.id === id)?.fullName ?? ''

  const confirmArchive = () =>
    archive.mutate(toArchive, {
      onSuccess: () => {
        toast.success(toArchive.length === 1 ? `${nameOf(toArchive[0]!)} foi arquivado` : `${toArchive.length} alunos arquivados`)
        setToArchive([])
        clearSelection()
        setSelecting(false)
      },
      onError: () => toast.error('Não foi possível arquivar. Tente de novo.'),
    })

  const doUnarchive = (ids: string[]) =>
    unarchive.mutate(ids, {
      onSuccess: () => {
        toast.success(ids.length === 1 ? `${nameOf(ids[0]!)} voltou para os ativos` : `${ids.length} alunos voltaram para os ativos`)
        clearSelection()
        setSelecting(false)
      },
      onError: () => toast.error('Não foi possível reativar. Tente de novo.'),
    })

  const addTag = (t: string) =>
    tag.mutate(
      { ids: selectedIds, tag: t },
      {
        onSuccess: () => toast.success(`Tag "${t}" adicionada a ${plural(selectedIds.length, 'aluno', 'alunos')}`),
        onError: () => toast.error('Não foi possível adicionar a tag. Tente de novo.'),
      },
    )

  const resendInvite = (s: StudentListItem) =>
    resend.mutate(s.id, {
      onSuccess: () => {
        setResent((r) => [...r, s.id])
        toast.success(`Convite reenviado para ${s.fullName.split(' ')[0]}`)
      },
      onError: () => toast.error('Não foi possível reenviar o convite. Tente de novo.'),
    })

  const empty = params.status === 'overdue' && !params.query && params.tags.length === 0 ? 'Nenhum aluno vencido. Tudo em dia.' : 'Nenhum aluno com esses filtros.'

  return (
    <main className="flex flex-col gap-3.5 px-4 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-7 lg:pb-10">
      {list.isError ? (
        <ErrorState title="Não foi possível carregar os alunos" retrying={list.isFetching} onRetry={() => list.refetch()} />
      ) : (
        <>
          <ListHeader
            active={counts.active}
            limit={coach.data?.plan.studentLimit}
            pending={counts.pending}
            selecting={selecting}
            onToggleSelecting={() => {
              setSelecting((v) => !v)
              clearSelection()
            }}
            onExport={() => {
              download(studentsToCsv(shown), `alunos-${statusTabs.find((t) => t.status === params.status)!.param}-${toIsoDate(now)}.csv`)
              toast.success(`${plural(shown.length, 'aluno exportado', 'alunos exportados')}`)
            }}
          />
          <StatusTabs current={params.status} counts={counts} onChange={params.setStatus} />
          <ListFilters
            query={params.query}
            onQuery={params.setQuery}
            tags={list.data?.filterTags ?? []}
            selectedTags={params.tags}
            onToggleTag={params.toggleTag}
            sort={params.sort}
            onToggleSort={params.toggleSort}
          />

          <div className="order-5 flex flex-col gap-3.5 lg:order-none lg:gap-5">
          {!list.data ? (
            <div aria-busy="true" aria-label="Carregando os alunos" className="flex flex-col gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-18 rounded-[18px]" />
              ))}
            </div>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <BulkActions
                  ids={selectedIds}
                  archivedTab={params.status === 'archived'}
                  tags={list.data.filterTags}
                  onTag={addTag}
                  onArchive={() => setToArchive(selectedIds)}
                  onUnarchive={() => doUnarchive(selectedIds)}
                  onClear={clearSelection}
                />
              )}
              <StudentsTable
                students={shown}
                now={now}
                page={page}
                selection={visibleSelection}
                onSelectionChange={setSelection}
                onArchive={setToArchive}
                onUnarchive={doUnarchive}
                onResendInvite={resendInvite}
                empty={empty}
              />
              <StudentCards
                students={shown}
                now={now}
                selecting={selecting}
                selected={visibleSelection}
                onToggle={(id, on) => setSelection((s) => ({ ...s, [id]: on }))}
                resent={resent}
                onResendInvite={resendInvite}
                empty={empty}
              />
              <ListFooter
                shown={Math.min(PAGE_SIZE, shown.length - (page - 1) * PAGE_SIZE)}
                total={shown.length}
                tabLabel={tabNoun[params.status]}
                page={page}
                pages={pages}
                onPage={params.setPage}
              />
            </>
          )}
          </div>
        </>
      )}
      <ArchiveDialog names={toArchive.map(nameOf)} pending={archive.isPending} onConfirm={confirmArchive} onCancel={() => setToArchive([])} />
    </main>
  )
}
