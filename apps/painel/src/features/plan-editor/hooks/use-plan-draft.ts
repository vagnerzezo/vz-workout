import { useReducer } from 'react'
import { addExercise, moveExercise, newDay, removeExercise, setWorkingSets, swapExercise, type WorkoutDay, type WorkoutPlan } from '@workspace/core'

type Action =
  | { type: 'load'; plan: WorkoutPlan }
  | { type: 'rename'; name: string }
  | { type: 'add'; dayId: string; exerciseId: string }
  | { type: 'remove'; dayId: string; itemId: string }
  | { type: 'move'; dayId: string; itemId: string; delta: -1 | 1 }
  | { type: 'sets'; dayId: string; itemId: string; n: number }
  | { type: 'swap'; dayId: string; itemId: string; exerciseId: string }
  | { type: 'addDay' }

type State = { plan: WorkoutPlan | null; dirty: boolean; seq: number }

const onDay = (plan: WorkoutPlan, dayId: string, fn: (d: WorkoutDay) => WorkoutDay): WorkoutPlan => ({ ...plan, days: plan.days.map((d) => (d.id === dayId ? fn(d) : d)) })

function reducer(state: State, action: Action): State {
  if (action.type === 'load') return { plan: action.plan, dirty: false, seq: state.seq }
  const plan = state.plan
  if (!plan) return state
  const seq = state.seq + 1 // ids novos: únicos dentro do rascunho
  const next = (p: WorkoutPlan): State => ({ plan: p, dirty: true, seq })
  switch (action.type) {
    case 'rename':
      return next({ ...plan, name: action.name })
    case 'add':
      return next(onDay(plan, action.dayId, (d) => addExercise(d, action.exerciseId, `${d.id}_novo${seq}`)))
    case 'remove':
      return next(onDay(plan, action.dayId, (d) => removeExercise(d, action.itemId)))
    case 'move':
      return next(onDay(plan, action.dayId, (d) => moveExercise(d, action.itemId, action.delta)))
    case 'sets':
      return next(onDay(plan, action.dayId, (d) => setWorkingSets(d, action.itemId, action.n)))
    case 'swap':
      return next(onDay(plan, action.dayId, (d) => swapExercise(d, action.itemId, action.exerciseId)))
    case 'addDay': {
      const day = newDay(plan.days, `${plan.id}_dia${seq}`)
      return day ? next({ ...plan, days: [...plan.days, day] }) : state
    }
  }
}

/** A ficha em edição: tudo muda só aqui até o "Salvar". `load` recomeça do que veio da API. */
export function usePlanDraft() {
  const [state, dispatch] = useReducer(reducer, { plan: null, dirty: false, seq: 0 })
  return { ...state, dispatch }
}
