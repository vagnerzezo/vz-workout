import { z } from 'zod'

export const NotificationKind = z.enum(['workout', 'meal', 'message', 'plan', 'record', 'checkIn', 'billing'])
export type NotificationKind = z.infer<typeof NotificationKind>

/** Item da caixa de notificações; `link` é a tela do app que ele abre. */
export const AppNotification = z.object({
  id: z.string(),
  kind: NotificationKind,
  title: z.string(),
  body: z.string(),
  link: z.string().startsWith('/'),
  createdAt: z.iso.datetime(),
  read: z.boolean(),
})
export type AppNotification = z.infer<typeof AppNotification>
