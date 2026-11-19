import { ResourceConfirmDialog } from '../../../shared/components/resource-confirm-dialog'

type ArchiveDialogProps = {
  /** Nomes dos alunos a arquivar; vazio = fechado */
  names: string[]
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ArchiveDialog({ names, pending, onConfirm, onCancel }: ArchiveDialogProps) {
  const one = names.length === 1
  return (
    <ResourceConfirmDialog
      intent="archive"
      open={names.length > 0}
      title={one ? `Arquivar ${names[0]}?` : `Arquivar ${names.length} alunos?`}
      description={`${one ? 'O aluno perde' : 'Eles perdem'} o acesso ao app e a vaga do seu plano fica livre. Dá para reativar depois, na aba Arquivados.`}
      pending={pending}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
