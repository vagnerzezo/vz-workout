import type { ReactNode } from 'react'
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

const intents = {
  archive: { action: 'Arquivar', pending: 'Arquivando…', destructive: true },
  restore: { action: 'Restaurar', pending: 'Restaurando…', destructive: false },
  delete: { action: 'Excluir', pending: 'Excluindo…', destructive: true },
} as const

export type ConfirmIntent = keyof typeof intents

type ResourceConfirmDialogProps = {
  intent: ConfirmIntent
  open: boolean
  title: string
  description: ReactNode
  pending?: boolean
  /** Troca o texto do botão (ex.: "Reativar") */
  actionLabel?: string
  pendingLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmação padrão para arquivar, restaurar e excluir. Fecha só pelo onCancel/onConfirm de quem usa. */
export function ResourceConfirmDialog({ intent, open, title, description, pending = false, actionLabel, pendingLabel, onConfirm, onCancel }: ResourceConfirmDialogProps) {
  const i = intents[intent]
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !pending && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-extrabold">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Voltar</AlertDialogCancel>
          <AlertDialogAction variant={i.destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={pending}>
            {pending ? (pendingLabel ?? i.pending) : (actionLabel ?? i.action)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
