import type { ReactElement } from 'react'
import { Link } from 'react-router'
import { Archive, ArchiveRestore, Bell, Dumbbell, Tag } from 'lucide-react'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'
import { cn } from '@workspace/ui/lib/utils'

type BulkActionsProps = {
  ids: string[]
  archivedTab: boolean
  tags: string[]
  onTag: (tag: string) => void
  onArchive: () => void
  onUnarchive: () => void
  onClear: () => void
}

/**
 * Ações em massa. Desktop: faixa acima da tabela. Celular: painel flutuante no lugar da barra inferior.
 * Notificar e Atribuir ficha levam os alunos escolhidos para as telas dessas seções.
 */
export function BulkActions({ ids, archivedTab, tags, onTag, onArchive, onUnarchive, onClear }: BulkActionsProps) {
  const list = ids.join(',')
  const actions = [
    { key: 'notify', label: ['Enviar notificação', 'Notificar'], icon: Bell, to: `/notificacoes/nova?alunos=${list}` },
    { key: 'plan', label: ['Atribuir ficha', 'Atribuir ficha'], icon: Dumbbell, to: `/fichas?atribuir=${list}` },
  ]
  const desktopButton = 'h-9 border-line-strong bg-card px-3 text-[13px] font-bold'
  const mobileButton = 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[14px] bg-accent p-1 text-[11px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

  const tagMenu = (trigger: ReactElement, label: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>
        <Tag aria-hidden="true" className="size-4.5 lg:hidden" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Adicionar a tag</DropdownMenuLabel>
          {tags.map((t) => (
            <DropdownMenuItem key={t} onClick={() => onTag(t)}>
              {t}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const count = ids.length === 1 ? '1 selecionado' : `${ids.length} selecionados`

  return (
    <>
      <div role="toolbar" aria-label="Ações em massa" className="hidden flex-wrap items-center gap-2.5 rounded-2xl border border-primary bg-primary/12 px-3.5 py-2.5 lg:flex">
        <span className="grow text-sm font-extrabold">{count}</span>
        {actions.map((a) => (
          <Link key={a.key} to={a.to} className={cn(buttonVariants({ variant: 'outline', className: desktopButton }))}>
            {a.label[0]}
          </Link>
        ))}
        {tagMenu(<Button variant="outline" className={desktopButton} />, 'Adicionar tag')}
        {archivedTab ? (
          <Button variant="outline" onClick={onUnarchive} className={desktopButton}>
            Reativar
          </Button>
        ) : (
          <Button variant="outline" onClick={onArchive} className={cn(desktopButton, 'text-destructive hover:text-destructive')}>
            Arquivar
          </Button>
        )}
        <Button variant="ghost" onClick={onClear} className="h-9 px-3 text-[13px] font-bold text-foreground-2">
          Limpar
        </Button>
      </div>

      <div
        role="toolbar"
        aria-label="Ações em massa no celular"
        className="fixed inset-x-4 bottom-[calc(20px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[568px] flex-col gap-2 rounded-3xl border border-primary bg-[#1a1c21] p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] lg:hidden"
      >
        <span className="px-1.5 text-[13px] font-extrabold">{count}</span>
        <div className="grid grid-cols-4 gap-1.5">
          {actions.map((a) => (
            <Link key={a.key} to={a.to} className={mobileButton}>
              <a.icon aria-hidden="true" className="size-4.5" />
              {a.label[1]}
            </Link>
          ))}
          {tagMenu(<button type="button" className={mobileButton} />, 'Tag')}
          {archivedTab ? (
            <button type="button" onClick={onUnarchive} className={mobileButton}>
              <ArchiveRestore aria-hidden="true" className="size-4.5" />
              Reativar
            </button>
          ) : (
            <button type="button" onClick={onArchive} className={cn(mobileButton, 'text-destructive')}>
              <Archive aria-hidden="true" className="size-4.5" />
              Arquivar
            </button>
          )}
        </div>
      </div>
    </>
  )
}
