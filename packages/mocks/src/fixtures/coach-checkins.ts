/** Fila de check-ins do canvas (painel e celular). Horas e dias contados a partir de agora.
 * A Ana fica em 52 h (o canvas de check-ins diz 1 dia) para bater com o dashboard: 2 há mais de 48 h. */

export const RATING_DIMS = ['Energia', 'Sono', 'Controle da fome', 'Aderência ao treino', 'Aderência à dieta']

export type CheckInSeed = {
  id: string
  studentId: string
  hoursAgo: number
  weight: [now: number, previous: number] | null // null = o peso vem das pesagens do aluno (o Renato)
  waist: [now: number, previous: number]
  now: number[]
  previous: number[]
  history: number[]
  comment: string
  pain: string | null
}

export const waitingSeeds: CheckInSeed[] = [
  { id: 'ci_renato_9', studentId: 'stu_renato', hoursAgo: 3, weight: null, waist: [94, 95], now: [4, 3, 2, 4, 5], previous: [4, 3, 3, 4, 4], history: [3.4, 3.6, 3.8, 3.6, 3.6, 3.6], pain: 'joelho direito', comment: 'Senti o joelho direito no agachamento hack na última série. Semana corrida no trabalho, mas fiz 3 dos 5 treinos.' },
  { id: 'ci_camila_6', studentId: 'stu_camila', hoursAgo: 5, weight: [61.2, 61.9], waist: [70, 71], now: [3, 2, 3, 4, 3], previous: [4, 3, 3, 4, 4], history: [3.8, 3.9, 3.6, 3.7, 3.6, 3.0], pain: null, comment: 'Dormi mal por causa do trabalho noturno e faltei um treino.' },
  { id: 'ci_pedro_7', studentId: 'stu_pedro', hoursAgo: 8, weight: [77.0, 77.4], waist: [80, 81], now: [4, 4, 3, 5, 3], previous: [4, 4, 3, 5, 4], history: [3.6, 3.8, 3.9, 4.0, 4.0, 3.8], pain: null, comment: 'Fim de semana com aniversário, saí da dieta no sábado.' },
  { id: 'ci_diego_2', studentId: 'stu_diego', hoursAgo: 26, weight: [82.3, 81.6], waist: [84, 84], now: [4, 4, 4, 5, 4], previous: [4, 3, 4, 5, 4], history: [3.6, 3.8, 3.8, 4.0, 4.0, 4.2], pain: null, comment: 'Cargas subindo bem e dormi melhor nesta semana.' },
  { id: 'ci_ana_5', studentId: 'stu_ana', hoursAgo: 52, weight: [64.2, 64.8], waist: [72, 73], now: [4, 4, 4, 4, 4], previous: [3, 4, 4, 4, 4], history: [3.4, 3.6, 3.6, 3.8, 3.8, 4.0], pain: null, comment: 'Tudo certo! Posso trocar o cardio da esteira pela bike?' },
  { id: 'ci_julia_4', studentId: 'stu_julia', hoursAgo: 50, weight: [68.4, 69.1], waist: [74, 75], now: [5, 4, 4, 5, 4], previous: [4, 4, 3, 4, 4], history: [3.2, 3.5, 3.8, 3.9, 3.8, 4.4], pain: null, comment: 'Me senti com muita energia, a troca do jantar ajudou com a fome.' },
]

/** Respostas já enviadas (o Thiago do canvas e mais alunos da carteira), com quantos dias atrás. */
export const answeredReplies: [daysAgo: number, text: string, read: boolean][] = [
  [1, 'Ótima semana, Thiago! Seguimos com a mesma ficha e subimos 2,5 kg no supino.', true],
  [2, 'Bom ter mantido o treino mesmo viajando. Quando voltar, retomamos a ficha completa.', true],
  [3, 'Ajustei o jantar para ter mais proteína. Confere no app e me conta como foi a fome.', false],
  [4, 'Excelente constância! Na próxima fase vamos aumentar o volume de costas.', true],
]

export const lateSeeds: { studentId: string; kind: string; daysLate: number; note: string | null }[] = [
  { studentId: 'stu_marcos', kind: 'Quinzenal', daysLate: 3, note: 'sem treinar há 7 dias' },
  { studentId: 'stu_leticia', kind: 'Quinzenal', daysLate: 2, note: null },
  { studentId: 'stu_bruno', kind: 'Semanal', daysLate: 1, note: 'plano vence hoje' },
]
