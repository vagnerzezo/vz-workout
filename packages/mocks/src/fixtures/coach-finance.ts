import type { BillingRules, PixSettings } from '@workspace/core'

/**
 * Cobranças de outubro do canvas (o "hoje" do canvas é 22/10; aqui contamos a partir de hoje).
 * dueIn/paidIn: dias a partir de hoje (negativo = no passado). Gustavo e Rafael do canvas viram alunos da carteira.
 */
export type ChargeSeed = {
  id: string
  studentId: string
  plan: 'Mensal' | 'Trimestral' | 'Semestral'
  amount: number
  dueIn: number
  status: 'review' | 'paid' | 'late' | 'upcoming'
  paidIn?: number
  proof?: { file: string; sentIn: [days: number, h: number, m: number]; amount: number; paidIn: number; key: string }
}

const KEY = '12.345.678/0001-90'

export const chargeSeeds: ChargeSeed[] = [
  { id: 'chg_julia', studentId: 'stu_julia', plan: 'Mensal', amount: 230, dueIn: -2, status: 'review', proof: { file: 'comprovante_20-10.jpg', sentIn: [-2, 9, 14], amount: 230, paidIn: -2, key: KEY } },
  { id: 'chg_ana', studentId: 'stu_ana', plan: 'Trimestral', amount: 600, dueIn: 1, status: 'review', proof: { file: 'pix_ana_paula.png', sentIn: [-1, 18, 40], amount: 600, paidIn: -1, key: KEY } },
  { id: 'chg_camila', studentId: 'stu_camila', plan: 'Mensal', amount: 230, dueIn: -2, status: 'review', proof: { file: 'IMG_4821.jpg', sentIn: [-1, 12, 2], amount: 200, paidIn: -1, key: KEY } },
  { id: 'chg_pedro', studentId: 'stu_pedro', plan: 'Mensal', amount: 230, dueIn: 0, status: 'review', proof: { file: 'comprovante_pedro.pdf', sentIn: [0, 7, 55], amount: 230, paidIn: 0, key: '(51) 98877-1234' } },
  { id: 'chg_bruno', studentId: 'stu_bruno', plan: 'Trimestral', amount: 600, dueIn: 0, status: 'upcoming' },
  { id: 'chg_fernanda', studentId: 'stu_fernanda', plan: 'Mensal', amount: 230, dueIn: 6, status: 'upcoming' },
  { id: 'chg_sofia', studentId: 'stu_sofia', plan: 'Trimestral', amount: 600, dueIn: 8, status: 'upcoming' },
  { id: 'chg_leticia', studentId: 'stu_leticia', plan: 'Mensal', amount: 230, dueIn: -7, status: 'late' },
  { id: 'chg_marcos', studentId: 'stu_marcos', plan: 'Mensal', amount: 230, dueIn: -10, status: 'late' },
  { id: 'chg_diego', studentId: 'stu_diego', plan: 'Semestral', amount: 1080, dueIn: -12, status: 'paid', paidIn: -13 },
  { id: 'chg_a1', studentId: 'stu_a1', plan: 'Mensal', amount: 230, dueIn: -10, status: 'paid', paidIn: -10 },
  { id: 'chg_thiago', studentId: 'stu_thiago', plan: 'Trimestral', amount: 600, dueIn: -17, status: 'paid', paidIn: -17 },
  { id: 'chg_a2', studentId: 'stu_a2', plan: 'Mensal', amount: 230, dueIn: -19, status: 'paid', paidIn: -19 },
]

export const PLAN_STUDENTS: Record<string, number> = { mensal: 28, tri: 16, sem: 6, treino: 2 }
export const PLAN_DESCRIPTIONS: Record<string, string> = {
  mensal: 'Treino + dieta + chat',
  tri: 'Treino + dieta + chat · 13% de desconto',
  sem: 'Treino + dieta + chat · 22% de desconto',
  treino: 'Só a ficha de treino e o chat',
}

export const initialPix: PixSettings = {
  keyType: 'cnpj',
  key: KEY,
  receiverName: 'Kaue Oliveira',
  city: 'Novo Hamburgo',
  qrMode: 'auto',
  requireProof: true,
  instructions: 'Pague pelo QR Code ou pelo Pix copia e cola e envie o comprovante aqui no app. A confirmação acontece em até 1 dia útil.',
}

export const initialRules: BillingRules = { reminders: ['d-3', 'd0', 'd+1'], toleranceDays: 3, blockAfterTolerance: true }
