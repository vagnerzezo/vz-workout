import type { PendingCheckIn, PhotoPose } from '../schemas/checkin'

export const ratingWords: Record<number, string> = { 1: 'Muito ruim', 2: 'Ruim', 3: 'Regular', 4: 'Bom', 5: 'Excelente' }

export const poseLabels: Record<PhotoPose, string> = { front: 'Frente', side: 'Lado', back: 'Costas' }

export type CheckInDraft = {
  photos: PhotoPose[] // poses que já têm foto
  weightKg: number | null
  ratings: Record<string, number>
  pain: boolean | null
  painWhere: string
}

export type CheckInProgress = {
  filled: number
  total: number
  /** O que falta, na ordem da tela: "foto de lado", "Qualidade do sono", "dor ou desconforto"… */
  missing: string[]
}

/** Quanto do check-in está preenchido: cada foto, o peso, cada nota e a pergunta da dor. O texto livre é opcional. */
export function checkInProgress(pending: Pick<PendingCheckIn, 'poses' | 'questions'>, draft: CheckInDraft): CheckInProgress {
  const items: [boolean, string][] = [
    ...pending.poses.map((p): [boolean, string] => [draft.photos.includes(p), `foto de ${poseLabels[p].toLowerCase()}`]),
    [draft.weightKg !== null, 'peso de hoje'],
    ...pending.questions.map((q): [boolean, string] => [!!draft.ratings[q.id], q.label]),
    [draft.pain === false || (draft.pain === true && draft.painWhere.trim() !== ''), draft.pain ? 'onde doeu' : 'dor ou desconforto'],
  ]
  return {
    filled: items.filter(([ok]) => ok).length,
    total: items.length,
    missing: items.filter(([ok]) => !ok).map(([, label]) => label),
  }
}

/** "foto de lado, Qualidade do sono e dor ou desconforto" */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`
}
