import { useNavigate } from 'react-router'
import { MoreHorizontal } from 'lucide-react'
import type { StudentListItem } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'

type RowMenuProps = {
  student: StudentListItem
  onArchive: (ids: string[]) => void
  onUnarchive: (ids: string[]) => void
  onResendInvite: (student: StudentListItem) => void
}

/** ⋮ "Mais ações" de uma linha da tabela. */
export function RowMenu({ student: s, onArchive, onUnarchive, onResendInvite }: RowMenuProps) {
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon-sm" aria-label={`Mais ações para ${s.fullName}`} className="border-input text-foreground-2" />}
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={() => navigate(`/alunos/${s.id}`)}>Ver perfil</DropdownMenuItem>
        {s.conversationId && <DropdownMenuItem onClick={() => navigate(`/chat/${s.conversationId}`)}>Conversar</DropdownMenuItem>}
        {s.status === 'pending' && <DropdownMenuItem onClick={() => onResendInvite(s)}>Reenviar convite</DropdownMenuItem>}
        <DropdownMenuSeparator />
        {s.status === 'archived' ? (
          <DropdownMenuItem onClick={() => onUnarchive([s.id])}>Reativar</DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={() => onArchive([s.id])}>
            Arquivar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
