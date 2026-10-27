import { startOfISOWeek } from 'date-fns'
import type { AppNotification } from '@workspace/core'
import { coachFirstName } from './renato'

/** Dia relativo a hoje, numa hora fixa (como no canvas: "Hoje 19:00", "Ontem 20:52"). */
const day = (now: Date, daysAgo: number, h: number, m: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, h, m).toISOString()

/** Caixa do Renato, montada a cada pedido para os horários acompanharem o dia de hoje. */
export function renatoNotifications(now: Date): Omit<AppNotification, 'read'>[] {
  const monday = startOfISOWeek(now)
  const list: Omit<AppNotification, 'read'>[] = [
    { id: 'n1', kind: 'workout', title: 'Bora treinar, Renato!', body: 'Hoje é dia de Treino C — Legs. Leg press no lugar do hack.', link: '/treinos', createdAt: day(now, 0, 19, 0) },
    { id: 'n4', kind: 'meal', title: 'Almoço às 12:30', body: 'Arroz, feijão, frango grelhado e salada.', link: '/dieta/refeicoes/almoco', createdAt: day(now, 0, 12, 15) },
    { id: 'n2', kind: 'message', title: `${coachFirstName} respondeu seu check-in`, body: '"Vou trocar o hack pelo leg press nas próximas 2 semanas…"', link: '/chat', createdAt: day(now, 0, 8, 12) },
    { id: 'n3', kind: 'plan', title: 'Sua ficha foi atualizada', body: 'Treino C — Legs: agachamento hack → leg press 45°', link: '/treinos', createdAt: day(now, 0, 8, 11) },
    { id: 'n5', kind: 'record', title: 'Novo recorde no supino inclinado', body: '32 kg × 8. Mais 2,5 kg que o seu melhor.', link: '/treinos/historico', createdAt: day(now, 1, 20, 52) },
    { id: 'n6', kind: 'checkIn', title: 'Seu check-in está liberado', body: 'Leva uns 3 minutos: fotos, peso e como foi a quinzena.', link: '/perfil/check-in', createdAt: day(now, 1, 8, 0) },
    { id: 'n7', kind: 'billing', title: 'Seu plano vence em breve', body: 'Trimestral · renove até 15/12 para não pausar.', link: '/perfil/pagamento', createdAt: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 9, 0).toISOString() },
  ]
  // Nada no futuro: de manhã cedo, "Hoje 19:00" ainda não aconteceu
  return list.filter((n) => n.createdAt <= now.toISOString())
}
