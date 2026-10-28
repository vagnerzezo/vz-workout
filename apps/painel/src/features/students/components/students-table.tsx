import { Link } from 'react-router'
import { MessageCircle } from 'lucide-react'
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, type ColumnDef, type RowSelectionState } from '@tanstack/react-table'
import {
  adherenceTone,
  initials,
  isInactive,
  lastWorkoutLabel,
  parseIsoDate,
  planDueTone,
  shortDate,
  subscriptionDueTone,
  type StudentListItem,
} from '@workspace/core'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { RowMenu } from './row-menu'
import { SelectBox } from './select-box'
import { adherenceBar, adherenceText, dueText, statusBadge } from './tones'

export const PAGE_SIZE = 25

type StudentsTableProps = {
  students: StudentListItem[]
  now: Date
  page: number
  selection: RowSelectionState
  onSelectionChange: (s: RowSelectionState) => void
  onArchive: (ids: string[]) => void
  onUnarchive: (ids: string[]) => void
  onResendInvite: (student: StudentListItem) => void
  empty: string
}

const date = (iso: string | null) => (iso ? shortDate(parseIsoDate(iso)) : '—')

/** Tabela do desktop (Data Table do shadcn com TanStack Table): seleção em lote e páginas de 25. */
export function StudentsTable({ students, now, page, selection, onSelectionChange, onArchive, onUnarchive, onResendInvite, empty }: StudentsTableProps) {
  const columns: ColumnDef<StudentListItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <SelectBox
          label="Selecionar todos"
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={(v) => table.toggleAllRowsSelected(v)}
        />
      ),
      cell: ({ row }) => <SelectBox label={`Selecionar ${row.original.fullName}`} checked={row.getIsSelected()} onChange={(v) => row.toggleSelected(v)} />,
    },
    {
      id: 'student',
      header: 'Aluno',
      cell: ({ row: { original: s } }) => (
        <Link to={`/alunos/${s.id}`} className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span aria-hidden="true" className="flex size-9.5 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-xs font-extrabold">
            {initials(s.fullName)}
          </span>
          <span className="flex min-w-0 flex-col">
            <strong className="text-sm font-extrabold">{s.fullName}</strong>
            <span className="truncate text-xs text-muted-foreground">{s.email}</span>
          </span>
        </Link>
      ),
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.map((t) => (
            <span key={t} className="flex h-5.5 items-center rounded-full border border-input px-2 text-[11px] font-bold text-foreground-2">
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: 'adherence',
      header: 'Adesão 30d',
      cell: ({ row: { original: s } }) => {
        const tone = adherenceTone(s.adherence30d)
        return (
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-1.5 grow overflow-hidden rounded-full bg-border">
              <span className={cn('block h-1.5', adherenceBar[tone])} style={{ width: `${s.adherence30d ?? 0}%` }} />
            </span>
            <span className={cn('w-9.5 text-right text-[13px] font-extrabold', adherenceText[tone])}>{s.adherence30d === null ? '—' : `${Math.round(s.adherence30d)}%`}</span>
          </div>
        )
      },
    },
    {
      id: 'last',
      header: 'Último treino',
      cell: ({ row: { original: s } }) => (
        <span className={cn('text-[13px]', isInactive(s, now) ? 'text-destructive' : 'text-foreground-2')}>
          {s.invite ? 'Convite enviado' : lastWorkoutLabel(s.lastWorkoutOn, now)}
        </span>
      ),
    },
    {
      id: 'plan',
      header: 'Ficha até',
      cell: ({ row: { original: s } }) =>
        s.planEndsOn ? <span className={cn('text-[13px]', dueText[planDueTone(s.planEndsOn, now)])}>{date(s.planEndsOn)}</span> : <span className="text-[13px] text-muted-foreground">Sem ficha</span>,
    },
    {
      id: 'subscription',
      header: 'Plano até',
      cell: ({ row: { original: s } }) => (
        <span className={cn('text-[13px]', s.status === 'archived' ? 'text-muted-foreground' : dueText[subscriptionDueTone(s.subscriptionEndsOn, now)])}>{date(s.subscriptionEndsOn)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const badge = statusBadge[row.original.status]
        return <span className={cn('inline-flex h-6 items-center rounded-full px-2.25 text-[11px] font-extrabold', badge.className)}>{badge.label}</span>
      },
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Ações</span>,
      cell: ({ row: { original: s } }) => (
        <div className="flex justify-end gap-1">
          {s.conversationId && (
            <Link to={`/chat/${s.conversationId}`} aria-label={`Conversar com ${s.fullName}`} className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm', className: 'border-input text-foreground-2' }))}>
              <MessageCircle aria-hidden="true" />
            </Link>
          )}
          <RowMenu student={s} onArchive={onArchive} onUnarchive={onUnarchive} onResendInvite={onResendInvite} />
        </div>
      ),
    },
  ]

  // O TanStack Table (Data Table do guia) não é memoizável pelo React Compiler; este componente fica sem memo automático
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: students,
    columns,
    getRowId: (s) => s.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { rowSelection: selection, pagination: { pageIndex: page - 1, pageSize: PAGE_SIZE } },
    onRowSelectionChange: (updater) => onSelectionChange(typeof updater === 'function' ? updater(selection) : updater),
    autoResetPageIndex: false,
  })

  return (
    <section aria-label="Tabela de alunos" className="hidden overflow-hidden rounded-[20px] border bg-card lg:block">
      <Table className="min-w-[980px] table-fixed">
        <colgroup>
          <col className="w-11" />
          <col className="w-[24%]" />
          <col className="w-[19%]" />
          <col className="w-37.5" />
          <col className="w-27.5" />
          <col className="w-24" />
          <col className="w-24" />
          <col className="w-24" />
          <col className="w-24" />
        </colgroup>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="border-border hover:bg-transparent">
              {group.headers.map((h) => (
                <TableHead key={h.id} className="h-11 px-2 text-[11px] font-extrabold tracking-[0.8px] text-muted-foreground uppercase first:pl-4 last:pr-4">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-8 text-center text-sm text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined} className="border-[#22252b] data-[state=selected]:bg-primary/12">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-2 py-2.5 whitespace-normal first:pl-4 last:pr-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  )
}
