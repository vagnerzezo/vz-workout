import { useNavigate } from 'react-router'
import type { StudentListItem } from '@workspace/core'
import { ResourceActionMenu } from '../../../shared/components/resource-actions'

type RowMenuProps = {
  student: StudentListItem
  onArchive: (ids: string[]) => void
  onUnarchive: (ids: string[]) => void
  onResendInvite: (student: StudentListItem) => void
  onDelete: (student: StudentListItem) => void
}

/** ⋯ "Mais ações" de uma linha da tabela. */
export function RowMenu({ student: s, onArchive, onUnarchive, onResendInvite, onDelete }: RowMenuProps) {
  const navigate = useNavigate()
  const archived = s.status === 'archived'
  return (
    <ResourceActionMenu
      name={s.fullName}
      actions={[
        { kind: 'view', label: 'Ver perfil', onSelect: () => navigate(`/alunos/${s.id}`) },
        { kind: 'edit', label: 'Editar dados', onSelect: () => navigate(`/alunos/${s.id}?aba=info&editar=1`) },
        { kind: 'chat', onSelect: () => navigate(`/chat/${s.conversationId}`), when: !!s.conversationId },
        { kind: 'resend', onSelect: () => onResendInvite(s), when: s.status === 'pending' },
        { kind: 'restore', label: 'Reativar', onSelect: () => onUnarchive([s.id]), when: archived },
        { kind: 'archive', onSelect: () => onArchive([s.id]), when: !archived },
        { kind: 'delete', label: 'Excluir convite', onSelect: () => onDelete(s), when: s.status === 'pending' },
      ]}
    />
  )
}
