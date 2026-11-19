import type { ComponentProps, ReactElement } from 'react'
import { Archive, ArchiveRestore, Copy, Eye, MessageCircle, MoreHorizontal, Pencil, Phone, Power, PowerOff, Send, Trash2, type LucideIcon } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/utils'

/** Ações padronizadas do painel: cada uma tem ícone e rótulo fixos (ver doc/PLANO-ETAPA-1-GERENCIAMENTO-PAINEL.md). */
export const resourceActions = {
  view: { icon: Eye, label: 'Visualizar' },
  edit: { icon: Pencil, label: 'Editar' },
  duplicate: { icon: Copy, label: 'Duplicar' },
  chat: { icon: MessageCircle, label: 'Conversar' },
  whatsapp: { icon: Phone, label: 'Abrir WhatsApp' },
  resend: { icon: Send, label: 'Reenviar convite' },
  activate: { icon: Power, label: 'Ativar' },
  deactivate: { icon: PowerOff, label: 'Desativar' },
  restore: { icon: ArchiveRestore, label: 'Restaurar' },
  archive: { icon: Archive, label: 'Arquivar' },
  delete: { icon: Trash2, label: 'Excluir' },
} satisfies Record<string, { icon: LucideIcon; label: string }>

export type ResourceActionKind = keyof typeof resourceActions

/** Ações que tiram o registro de circulação: ficam no fim do menu, separadas e em vermelho. */
const destructive = new Set<ResourceActionKind>(['archive', 'delete', 'deactivate'])

export type ResourceAction = {
  kind: ResourceActionKind
  /** Troca o rótulo padrão (ex.: "Ver perfil", "Reativar") mantendo o ícone */
  label?: string
  onSelect?: () => void
  /** Item que é um link (ex.: WhatsApp em nova aba) */
  render?: ReactElement
  disabled?: boolean
  /** false esconde a ação (atalho para listas condicionais) */
  when?: boolean
}

type ResourceActionMenuProps = {
  /** Nome do registro, para o rótulo acessível "Mais ações para …" */
  name?: string
  actions: ResourceAction[]
  triggerClassName?: string
  triggerSize?: ComponentProps<typeof Button>['size']
}

/** Menu ⋯ "Mais ações" de um registro, com ícones e destrutivas separadas no fim. */
export function ResourceActionMenu({ name, actions, triggerClassName, triggerSize = 'icon-sm' }: ResourceActionMenuProps) {
  const visible = actions.filter((a) => a.when !== false)
  const regular = visible.filter((a) => !destructive.has(a.kind))
  const danger = visible.filter((a) => destructive.has(a.kind))
  const item = (a: ResourceAction) => {
    const { icon: Icon, label } = resourceActions[a.kind]
    return (
      <DropdownMenuItem key={a.kind} variant={destructive.has(a.kind) ? 'destructive' : 'default'} onClick={a.onSelect} render={a.render} disabled={a.disabled}>
        <Icon aria-hidden="true" />
        {a.label ?? label}
      </DropdownMenuItem>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size={triggerSize} aria-label={name ? `Mais ações para ${name}` : 'Mais ações'} className={cn('shrink-0 border-input text-foreground-2', triggerClassName)} />}
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {regular.map(item)}
        {regular.length > 0 && danger.length > 0 && <DropdownMenuSeparator />}
        {danger.map(item)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type ActionIconButtonProps = Omit<ComponentProps<typeof Button>, 'children' | 'aria-label'> & {
  /** Rótulo acessível e texto do tooltip */
  label: string
  icon: LucideIcon
}

/** Botão só com ícone: sempre com aria-label e tooltip. */
export function ActionIconButton({ label, icon: Icon, variant = 'outline', size = 'icon-sm', ...props }: ActionIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant={variant} size={size} aria-label={label} {...props} />}>
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
