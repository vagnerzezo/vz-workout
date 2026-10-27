import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Rascunho do check-in: se o aluno sair no meio, as respostas continuam ao voltar.
 * As fotos não entram aqui (arquivo não cabe no localStorage); ficam só na tela.
 */
type CheckInDraftState = {
  checkInId: string | null
  weightKg: number | null
  ratings: Record<string, number>
  pain: boolean | null
  painWhere: string
  notes: string

  /** Começa o rascunho deste check-in; se for de outro, descarta o antigo. */
  open: (checkInId: string, lastWeightKg: number | null) => void
  setWeight: (kg: number) => void
  rate: (questionId: string, value: number) => void
  setPain: (pain: boolean) => void
  setPainWhere: (text: string) => void
  setNotes: (text: string) => void
  reset: () => void
}

const empty = { checkInId: null, weightKg: null, ratings: {}, pain: null, painWhere: '', notes: '' }

export const useCheckInDraft = create<CheckInDraftState>()(
  persist(
    (set, get) => ({
      ...empty,
      open: (checkInId, lastWeightKg) => {
        if (get().checkInId !== checkInId) set({ ...empty, checkInId, weightKg: lastWeightKg })
      },
      setWeight: (weightKg) => set({ weightKg }),
      rate: (questionId, value) => set((s) => ({ ratings: { ...s.ratings, [questionId]: value } })),
      setPain: (pain) => set({ pain }),
      setPainWhere: (painWhere) => set({ painWhere }),
      setNotes: (notes) => set({ notes }),
      reset: () => set(empty),
    }),
    { name: 'check-in-rascunho', version: 1 },
  ),
)
