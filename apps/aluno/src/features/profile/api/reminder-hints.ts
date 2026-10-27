import type { NotificationSettings } from '@workspace/core'

/** Quando cada lembrete chega. Configurações e a folha "Lembretes" das Notificações usam o mesmo texto. */
export const reminderHints: Record<keyof NotificationSettings, string> = {
  workout: 'Nos dias de treino, às 18:00',
  meals: '15 min antes de cada horário do plano',
  water: 'A cada 2 horas, das 8h às 20h',
  checkIn: 'Quando o treinador pedir ou responder',
  chat: 'Novas mensagens do treinador',
  records: 'Quando você bater uma marca',
  quietHours: 'Nada entre 22h e 7h',
}
