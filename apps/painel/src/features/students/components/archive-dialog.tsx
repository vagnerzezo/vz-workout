import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'

type ArchiveDialogProps = {
  /** Nomes dos alunos a arquivar; vazio = fechado */
  names: string[]
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ArchiveDialog({ names, pending, onConfirm, onCancel }: ArchiveDialogProps) {
  const title = names.length === 1 ? `Arquivar ${names[0]}?` : `Arquivar ${names.length} alunos?`
  return (
    <AlertDialog open={names.length > 0} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-extrabold">{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {names.length === 1 ? 'O aluno perde' : 'Eles perdem'} o acesso ao app e a vaga do seu plano fica livre. Dá para reativar depois, na aba Arquivados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? 'Arquivando…' : 'Arquivar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
