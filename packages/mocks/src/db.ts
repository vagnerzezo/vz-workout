import { delay } from 'msw'
import type { Anamnesis, Charge, DietDay, LoggedSet, Message, NotificationSettings, ProgressPhoto, ShoppingListState, WaterLog, WeightEntry, WorkoutSession } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { initialWater, mondayOf, type FinishedSession } from './fixtures/renato'
import { renatoLogin } from './fixtures/renato-auth'
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
  /** Sessão do aluno (no app real é um cookie httpOnly) */
  loggedIn: boolean
  password: string
  loginAttempts: number
  recovery: { login: string; attempts: number; token: string | null } | null
  /** Quem aceitou o convite (primeiro acesso): a API passa a responder como aluna nova */
  newStudent: { fullName: string; anamnesis: Anamnesis | null } | null
  /** Painel do treinador: itens de atenção já resolvidos e aniversariantes já parabenizados */
  coach: { resolvedAttention: string[]; congratulated: string[]; archived: string[]; unarchived: string[]; resentInvites: string[]; addedTags: Record<string, string[]> }
  nextId: number
}

const SESSION_KEY = 'mock-sessao'

function readSession(): boolean {
  try {
    return globalThis.localStorage?.getItem(SESSION_KEY) !== 'fora'
  } catch {
    return true
  }
}

function writeSession(on: boolean) {
  try {
    if (on) globalThis.localStorage?.removeItem(SESSION_KEY)
    else globalThis.localStorage?.setItem(SESSION_KEY, 'fora')
  } catch {
    // localStorage bloqueado: a sessão fica só na memória
  }
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
  loggedIn: readSession(),
  password: renatoLogin.password,
  loginAttempts: 0,
  recovery: null,
  newStudent: null,
  coach: { resolvedAttention: [], congratulated: [], archived: [], unarchived: [], resentInvites: [], addedTags: {} },
  nextId: 1,
})

export const db: Db = initial()

export function resetDb() {
  writeSession(true)
  Object.assign(db, initial())
}

/** Entrar/sair. Fica guardado no navegador para recarregar a página não deslogar. */
export function setLoggedIn(on: boolean) {
  db.loggedIn = on
  writeSession(on)
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
  if (db.newStudent) return 'novo' // acabou de fazer o primeiro acesso
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
