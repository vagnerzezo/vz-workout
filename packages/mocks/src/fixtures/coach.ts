import type { ActivityEvent, AttentionItem, Coach, CoachCounters, CoachDashboard } from '@workspace/core'
import { toIsoDate } from '@workspace/core'
import { mondayOf, coachName, coachFirstName, renatoMe } from './renato'

/** Onde o aluno faz o primeiro acesso (o link do convite aponta para o app publicado). */
export const studentAppUrl = 'https://vzworkout.vercel.app'

/** O treinador do painel: o mesmo personal que os alunos veem no app. */
export const kaueCoach: Coach = {
  id: 'coach_kaue',
  firstName: coachFirstName,
  fullName: coachName,
  branding: renatoMe.branding,
  plan: { name: 'Pro', studentLimit: 80 },
  activeStudents: 52,
}

export const kaueCounters: CoachCounters = {
  students: 52,
  pendingCheckIns: 6,
  unreadChats: 4,
  pendingProofs: 4,
  unreadNotifications: 4,
}

const daysFrom = (today: Date, n: number) => {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  d.setDate(d.getDate() + n)
  return d
}
const hoursAgo = (now: Date, h: number) => new Date(now.getTime() - h * 3_600_000).toISOString()

/** "Precisa da sua atenção" do canvas, com as datas contadas a partir de hoje. */
function attention(now: Date): AttentionItem[] {
  const lastWorkout = (daysAgo: number) => toIsoDate(daysFrom(now, -daysAgo))
  return [
    { id: 'att_renato', studentId: renatoMe.id, studentName: renatoMe.fullName, type: 'checkIn', reason: 'Relatou dor no joelho direito no agachamento hack', at: hoursAgo(now, 3), action: 'viewCheckIn', targetId: 'ci_renato_9' },
    { id: 'att_julia', studentId: 'stu_julia', studentName: 'Júlia Castro', type: 'checkIn', reason: 'Enviou o check-in quinzenal e aguarda sua resposta', at: hoursAgo(now, 48), action: 'reply', targetId: 'ci_julia_4' },
    { id: 'att_marcos', studentId: 'stu_marcos', studentName: 'Marcos Lima', type: 'inactivity', reason: 'Sem treinar há 7 dias · adesão de 7 dias caiu de 85% para 40%', at: lastWorkout(7), action: 'message', targetId: 'conv_marcos' },
    { id: 'att_bruno', studentId: 'stu_bruno', studentName: 'Bruno Teixeira', type: 'due', reason: 'Plano trimestral vence hoje', at: toIsoDate(now), action: 'charge', targetId: null },
    { id: 'att_ana', studentId: 'stu_ana', studentName: 'Ana Paula Reis', type: 'due', reason: 'Ficha de treino vence amanhã', at: toIsoDate(daysFrom(now, 1)), action: 'renewPlan', targetId: null },
    { id: 'att_leticia', studentId: 'stu_leticia', studentName: 'Letícia Moura', type: 'inactivity', reason: 'Sem treinar há 6 dias · adesão de 30 dias em 62%', at: lastWorkout(6), action: 'message', targetId: 'conv_leticia' },
    { id: 'att_diego', studentId: 'stu_diego', studentName: 'Diego Santos', type: 'checkIn', reason: 'Enviou o check-in quinzenal e aguarda sua resposta', at: hoursAgo(now, 24), action: 'reply', targetId: 'ci_diego_2' },
  ]
}

function activity(now: Date): ActivityEvent[] {
  const minAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()
  return [
    { id: 'ev1', kind: 'record', studentName: renatoMe.fullName, text: 'concluiu Treino C — Legs com 2 recordes pessoais', at: minAgo(12) },
    { id: 'ev2', kind: 'proof', studentName: 'Pedro Nunes', text: 'enviou comprovante de R$ 230,00', at: minAgo(60) },
    { id: 'ev3', kind: 'checkIn', studentName: 'Júlia Castro', text: 'enviou o check-in quinzenal com 3 fotos', at: minAgo(120) },
    { id: 'ev4', kind: 'weight', studentName: 'Ana Paula Reis', text: 'registrou peso: 64,2 kg (−0,6 kg)', at: minAgo(180) },
    { id: 'ev5', kind: 'workout', studentName: 'Pedro Nunes', text: 'concluiu Treino A — Push em 52 min', at: minAgo(240) },
    { id: 'ev6', kind: 'dietSwap', studentName: 'Camila Rocha', text: 'trocou o pão francês por tapioca no café da manhã', at: minAgo(300) },
  ]
}

const ADHERENCE = [86, 84, 88, 83, 85, 82, 85, 81] // as 8 últimas semanas, a atual por último

export function kaueDashboard(now: Date): CoachDashboard {
  const monday = mondayOf(now)
  return {
    activeStudents: { count: 52, newThisMonth: 3 },
    adherence: ADHERENCE.map((pct, i) => ({ weekStart: toIsoDate(daysFrom(monday, (i - ADHERENCE.length + 1) * 7)), pct })),
    adherenceGoal: 80,
    pendingCheckIns: { count: 6, over48h: 2 },
    dueIn7Days: { count: 4, dueTomorrow: 1 },
    trainedToday: 18,
    plansExpiring: 3,
    withoutPlan: 13,
    overdueStudents: 0,
    pendingProofs: 4,
    attention: attention(now),
    activity: activity(now),
    birthdays: [
      { studentId: 'stu_camila', name: 'Camila Rocha', age: 28, congratulated: false },
      { studentId: 'stu_thiago', name: 'Thiago Alves', age: 35, congratulated: false },
    ],
    ranking: [
      { studentId: renatoMe.id, name: renatoMe.fullName, workouts: 12 },
      { studentId: 'stu_julia', name: 'Júlia Castro', workouts: 11 },
      { studentId: 'stu_pedro', name: 'Pedro Nunes', workouts: 11 },
      { studentId: 'stu_camila', name: 'Camila Rocha', workouts: 10 },
      { studentId: 'stu_ana', name: 'Ana Paula Reis', workouts: 9 },
    ],
  }
}
