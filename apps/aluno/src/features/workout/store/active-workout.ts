import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoggedSet, SetKind } from '@workspace/core'

/** O que o aluno digitou numa série. kg/reps vazios usam a sugestão da tela. */
export type SetEntry = {
  prescribedId: string
  kind: SetKind
  kg: number | null
  reps: number | null
  doneAt: string | null
}

/**
 * Timer guardado como hora de término (e não como contador): continua certo
 * se o iOS fechar o PWA no meio do descanso.
 */
export type RestState = {
  total: number // segundos
  endsAt: number | null // epoch ms; null = parado
  pausedLeft: number | null // segundos restantes quando pausado
}

export const idleRest: RestState = { total: 0, endsAt: null, pausedLeft: null }

export function restLeft(rest: RestState, now: number): number {
  // Limita ao total: o `now` da tela pode ser de até um tick antes de o descanso começar
  if (rest.endsAt !== null) return Math.min(rest.total, Math.max(0, Math.ceil((rest.endsAt - now) / 1000)))
  return rest.pausedLeft ?? 0
}

export const restRunning = (rest: RestState, now: number) => rest.endsAt !== null && rest.endsAt > now

type ActiveWorkoutState = {
  sessionId: string | null
  dayId: string | null
  startedAt: string | null
  /** Quando o aluno tocou em "Concluir": o resumo mede a duração até aqui */
  finishedAt: string | null
  effort: number | null // esforço percebido, 1 a 10
  comment: string
  entries: Record<string, SetEntry>
  extraSets: Record<string, number> // prescribedId → válidas a mais
  /** Séries alteradas que ainda não chegaram na API: chave → versão */
  pendingSync: Record<string, number>
  rest: RestState
  autoRest: boolean

  start: (dayId: string) => void
  editSet: (key: string, meta: Pick<SetEntry, 'prescribedId' | 'kind'>, patch: Partial<Pick<SetEntry, 'kg' | 'reps'>>) => void
  /** Marca ou desmarca. Ao marcar, grava a carga e as repetições sugeridas se o campo estiver vazio. */
  toggleDone: (key: string, meta: Pick<SetEntry, 'prescribedId' | 'kind'>, fallback: { kg: number; reps: number }) => boolean
  addSet: (prescribedId: string) => void
  markSynced: (key: string, version: number) => void
  markFinished: () => void
  resumeWorkout: () => void
  setEffort: (effort: number | null) => void
  setComment: (comment: string) => void
  reset: () => void

  startRest: (seconds: number) => void
  pauseRest: () => void
  resumeRest: () => void
  adjustRest: (deltaSeconds: number) => void
  skipRest: () => void
  setAutoRest: (on: boolean) => void
}

const empty = {
  sessionId: null,
  dayId: null,
  startedAt: null,
  finishedAt: null,
  effort: null,
  comment: '',
  entries: {},
  extraSets: {},
  pendingSync: {},
  rest: idleRest,
}

const bump = (pending: Record<string, number>, key: string) => ({ ...pending, [key]: (pending[key] ?? 0) + 1 })

export const useActiveWorkout = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      ...empty,
      autoRest: true,

      start: (dayId) =>
        set({ ...empty, sessionId: crypto.randomUUID(), dayId, startedAt: new Date().toISOString() }),

      editSet: (key, meta, patch) =>
        set((s) => {
          const prev = s.entries[key] ?? { ...meta, kg: null, reps: null, doneAt: null }
          const entries = { ...s.entries, [key]: { ...prev, ...patch } }
          // Só sincroniza o que já foi concluído; o resto ainda é rascunho
          return { entries, pendingSync: prev.doneAt ? bump(s.pendingSync, key) : s.pendingSync }
        }),

      toggleDone: (key, meta, fallback) => {
        const prev = get().entries[key] ?? { ...meta, kg: null, reps: null, doneAt: null }
        const done = !prev.doneAt
        const entry: SetEntry = done
          ? { ...prev, kg: prev.kg ?? fallback.kg, reps: prev.reps ?? fallback.reps, doneAt: new Date().toISOString() }
          : { ...prev, doneAt: null }
        set((s) => ({ entries: { ...s.entries, [key]: entry }, pendingSync: bump(s.pendingSync, key) }))
        return done
      },

      addSet: (prescribedId) =>
        set((s) => ({ extraSets: { ...s.extraSets, [prescribedId]: (s.extraSets[prescribedId] ?? 0) + 1 } })),

      markSynced: (key, version) =>
        set((s) => {
          if (s.pendingSync[key] !== version) return {} // mudou de novo enquanto enviava
          const pendingSync = { ...s.pendingSync }
          delete pendingSync[key]
          return { pendingSync }
        }),

      markFinished: () => set({ finishedAt: new Date().toISOString() }),
      resumeWorkout: () => set({ finishedAt: null }),
      setEffort: (effort) => set({ effort }),
      setComment: (comment) => set({ comment }),
      reset: () => set({ ...empty }),

      startRest: (seconds) => set({ rest: { total: seconds, endsAt: Date.now() + seconds * 1000, pausedLeft: null } }),
      pauseRest: () => set((s) => ({ rest: { ...s.rest, endsAt: null, pausedLeft: restLeft(s.rest, Date.now()) } })),
      resumeRest: () =>
        set((s) => {
          const left = s.rest.pausedLeft ?? 0
          return left > 0 ? { rest: { ...s.rest, endsAt: Date.now() + left * 1000, pausedLeft: null } } : {}
        }),
      adjustRest: (delta) =>
        set((s) => {
          const left = Math.max(0, restLeft(s.rest, Date.now()) + delta)
          const total = Math.max(s.rest.total, left)
          if (s.rest.endsAt !== null) return { rest: { total, endsAt: Date.now() + left * 1000, pausedLeft: null } }
          return { rest: { total, endsAt: null, pausedLeft: left } }
        }),
      skipRest: () => set((s) => ({ rest: { ...s.rest, endsAt: null, pausedLeft: 0 } })),
      setAutoRest: (on) => set({ autoRest: on }),
    }),
    { name: 'treino-ativo', version: 1 },
  ),
)

/** Payload da API para uma série do store. */
export function toLoggedSet(key: string, e: SetEntry): LoggedSet {
  return { key, prescribedId: e.prescribedId, kind: e.kind, kg: e.kg ?? 0, reps: e.reps ?? 0, doneAt: e.doneAt }
}
