import { addDays } from 'date-fns'
import type { PendingCheckIn } from '@workspace/core'
import { toIsoDate } from '@workspace/core'

/** Check-in quinzenal do Renato: vence sempre daqui a 2 dias, como no canvas. */
export const renatoCheckIn = (today: Date, lastWeightKg: number | null): PendingCheckIn => ({
  id: 'ci_quinzenal_2',
  label: 'Check-in quinzenal',
  dueDate: toIsoDate(addDays(today, 2)),
  coachName: 'Carlos Oliveira',
  poses: ['front', 'side', 'back'],
  questions: [
    { id: 'energia', label: 'Energia no dia a dia' },
    { id: 'sono', label: 'Qualidade do sono' },
    { id: 'fome', label: 'Controle da fome' },
    { id: 'treino', label: 'Aderência ao treino' },
    { id: 'dieta', label: 'Aderência à dieta' },
  ],
  lastWeightKg,
})
