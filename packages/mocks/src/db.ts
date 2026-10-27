import { delay } from 'msw'
import type { Charge, DietDay, LoggedSet, Message, NotificationSettings, ProgressPhoto, ShoppingListState, WaterLog, WeightEntry, WorkoutSession } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { initialWater, mondayOf, type FinishedSession } from './fixtures/renato'
import { renatoCharge } from './fixtures/renato-billing'
import { initialWeights, renatoPhotos } from './fixtures/renato-progress'

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
  /** Fotos de evolução (as dos check-ins enviados entram aqui) */
  photos: ProgressPhoto[]
  /** Check-ins já enviados, por id */
  sentCheckIns: string[]
  notifications: NotificationSettings
  /** Cobrança da renovação (null depois de paga) */
  charge: Charge | null
  /** Ids das notificações ainda não lidas */
  unreadNotifications: string[]
  /** Mensagens que o aluno mandou pelo app */
  sentMessages: Message[]
  /** O aluno já abriu a conversa (some a bolinha do chat na Home) */
  chatOpened: boolean
  nextId: number
}

const initial = (): Db => ({
  water: initialWater(),
  weights: initialWeights(),
  liveSets: {},
  sessions: [],
  dietDays: {},
  shopping: { checkedIds: ['banana', 'ovos', 'arroz_branco'], extras: [] }, // como no canvas: 3 itens já comprados
  photos: renatoPhotos,
  sentCheckIns: [],
  notifications: { workout: true, meals: true, water: false, checkIn: true, chat: true, records: true, quietHours: true }, // como no canvas
  charge: renatoCharge(),
  unreadNotifications: ['n1', 'n2', 'n3'], // como no canvas: 3 não lidas
  sentMessages: [],
  chatOpened: false,
  nextId: 1,
})

export const db: Db = initial()

export function resetDb() {
  Object.assign(db, initial())
}

export const newId = (prefix: string) => `${prefix}_${db.nextId++}`

/**
 * Cenários para ver os estados que o design previu: abra o app com `?cenario=descanso`,
 * `?cenario=novo` (aluno recém-cadastrado), `?cenario=sem-ficha`, `?cenario=pausado` (cobrança vencida) ou `?cenario=erro`.
 */
export type Scenario = 'padrao' | 'descanso' | 'novo' | 'sem-ficha' | 'pausado' | 'erro'

let forced: Scenario | null = null

/** Para testes: força um cenário sem depender da URL. */
export function setScenario(s: Scenario | null) {
  forced = s
}

const known: Scenario[] = ['padrao', 'descanso', 'novo', 'sem-ficha', 'pausado', 'erro']

/**
 * O `?cenario=` da URL fica guardado na aba (sessionStorage): ao navegar pelo app o parâmetro some,
 * mas o cenário continua. `?cenario=padrao` volta ao normal.
 */
export function currentScenario(): Scenario {
  if (forced) return forced
  const param = known.find((s) => s === new URLSearchParams(globalThis.location?.search ?? '').get('cenario'))
  try {
    if (param) globalThis.sessionStorage?.setItem('cenario', param)
    return param ?? known.find((s) => s === globalThis.sessionStorage?.getItem('cenario')) ?? 'padrao'
  } catch {
    return param ?? 'padrao' // sessionStorage bloqueado
  }
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
