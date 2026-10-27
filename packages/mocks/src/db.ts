import { delay } from 'msw'
import type { DietDay, LoggedSet, ShoppingListState, WaterLog, WeightEntry, WorkoutSession } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { initialWater, mondayOf, type FinishedSession } from './fixtures/renato'

/** Estado em memória da API simulada. Volta ao início ao recarregar a página. */
type Db = {
  water: WaterLog
  weights: WeightEntry[]
  /** Séries enviadas durante o treino, por sessão e chave da série */
  liveSets: Record<string, Record<string, LoggedSet>>
  sessions: WorkoutSession[]
  /** Dias da dieta que o aluno já mexeu (ficha escolhida, refeições concluídas), por data */
  dietDays: Record<string, DietDay>
  /** Lista de compras: o que já foi comprado e os itens fora do plano */
  shopping: ShoppingListState
  nextId: number
}

const initial = (): Db => ({
  water: initialWater(),
  weights: [{ id: 'kg1', kg: 82.4, date: '2026-10-14' }],
  liveSets: {},
  sessions: [],
  dietDays: {},
  shopping: { checkedIds: ['banana', 'ovos', 'arroz_branco'], extras: [] }, // como no canvas: 3 itens já comprados
  nextId: 1,
})

export const db: Db = initial()

export function resetDb() {
  Object.assign(db, initial())
}

export const newId = (prefix: string) => `${prefix}_${db.nextId++}`

/**
 * Cenários para ver os estados que o design previu: abra o app com `?cenario=descanso`,
 * `?cenario=novo` (aluno recém-cadastrado), `?cenario=sem-ficha` ou `?cenario=erro`.
 */
export type Scenario = 'padrao' | 'descanso' | 'novo' | 'sem-ficha' | 'erro'

let forced: Scenario | null = null

/** Para testes: força um cenário sem depender da URL. */
export function setScenario(s: Scenario | null) {
  forced = s
}

export function currentScenario(): Scenario {
  if (forced) return forced
  const param = new URLSearchParams(globalThis.location?.search ?? '').get('cenario')
  const known: Scenario[] = ['descanso', 'novo', 'sem-ficha', 'erro']
  return known.find((s) => s === param) ?? 'padrao'
}

/** Latência realista: força a tela a desenhar o estado de carregamento. Nos testes, use 0. */
let latencyMs = 300

export function setLatency(ms: number) {
  latencyMs = ms
}

export const latency = () => delay(latencyMs)

/** Treinos concluídos no app nesta semana (além dos que o fixture já marca como feitos). */
export function finishedThisWeek(today: Date): FinishedSession[] {
  const monday = mondayOf(today).getTime()
  return db.sessions
    .filter((s) => new Date(s.finishedAt).getTime() >= monday)
    .map((s) => ({ dayId: s.dayId, date: toIsoDate(new Date(s.finishedAt)) }))
}
