import type { AdherenceTone, DueTone, StudentAlert, StudentStatus } from '@workspace/core'

/** Cores da legenda: 80% ou mais · 60–79% · abaixo de 60%. */
export const adherenceText: Record<AdherenceTone, string> = {
  good: 'text-primary',
  warning: 'text-warning',
  bad: 'text-destructive',
  none: 'text-muted-foreground',
}

export const adherenceBar: Record<AdherenceTone, string> = {
  good: 'bg-primary',
  warning: 'bg-warning',
  bad: 'bg-destructive',
  none: 'bg-transparent',
}

export const adherenceStroke: Record<AdherenceTone, string> = {
  good: 'stroke-primary',
  warning: 'stroke-warning',
  bad: 'stroke-destructive',
  none: 'stroke-transparent',
}

export const alertClass: Record<StudentAlert['tone'], string> = {
  info: 'bg-info/16 text-info',
  warning: 'bg-warning/16 text-warning',
  danger: 'bg-destructive/16 text-destructive',
}

export const dueText: Record<DueTone, string> = {
  normal: 'text-foreground-2',
  warning: 'text-warning',
  danger: 'text-destructive',
}

export const statusBadge: Record<StudentStatus, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-primary/12 text-primary' },
  pending: { label: 'Pendente', className: 'bg-warning/14 text-warning' },
  overdue: { label: 'Vencido', className: 'bg-destructive/14 text-destructive' },
  archived: { label: 'Arquivado', className: 'bg-secondary text-muted-foreground' },
}
