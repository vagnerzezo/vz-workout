import { useState } from 'react'
import { Link } from 'react-router'
import { Bell, ChevronLeft, ClipboardCheck, CreditCard, Dumbbell, MessageCircle, PencilLine, SlidersHorizontal, Trophy, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import type { AppNotification, NotificationKind, NotificationSettings } from '@workspace/core'
import { groupNotifications, notificationTime } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@workspace/ui/components/drawer'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { usePushNotifications, type PushState } from '../../../shared/pwa/push'
import { useProfile } from '../../profile/api/queries'
import { reminderHints } from '../../profile/api/reminder-hints'
import { useNotificationSettings, useUpdateNotificationSettings } from '../../profile/api/settings'
import { useMarkRead, useNotifications } from '../api/queries'

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

const kinds: Record<NotificationKind, { icon: typeof Bell; tone: string }> = {
  workout: { icon: Dumbbell, tone: 'bg-primary/14 text-primary' },
  plan: { icon: PencilLine, tone: 'bg-primary/14 text-primary' },
  meal: { icon: Utensils, tone: 'bg-violet/16 text-violet' },
  message: { icon: MessageCircle, tone: 'bg-info/16 text-info' },
  checkIn: { icon: ClipboardCheck, tone: 'bg-info/16 text-info' },
  record: { icon: Trophy, tone: 'bg-warning/16 text-warning' },
  billing: { icon: CreditCard, tone: 'bg-destructive/16 text-destructive' },
}

export default function NotificationsPage() {
  const notifications = useNotifications()
  const markRead = useMarkRead()
  const [now] = useState(() => new Date())
  const items = notifications.data ?? []
  const unread = items.filter((n) => !n.read).length

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2.5">
        <Link to="/" aria-label="Voltar para o início" className={iconButton}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
        <h1 className="grow text-2xl font-extrabold tracking-[-0.4px]">Notificações</h1>
        <RemindersDrawer />
      </header>

      <PushToggle />

      {notifications.isError ? (
        <ErrorState title="Não foi possível carregar as notificações" onRetry={() => notifications.refetch()} retrying={notifications.isFetching} />
      ) : !notifications.data ? (
        <div aria-busy="true" aria-label="Carregando as notificações" className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-19 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Bell className="size-6" />
          </span>
          <h2 className="text-lg font-extrabold">Nada por aqui ainda</h2>
          <p className="text-sm text-muted-foreground">Lembretes, respostas do treinador e recordes aparecem aqui.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">{unread === 0 ? 'Tudo lido' : unread === 1 ? '1 não lida' : `${unread} não lidas`}</span>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => markRead.mutate(null)}
              className="h-9 rounded-full border border-input px-3 text-[12.5px] font-bold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:text-muted-foreground disabled:hover:bg-transparent"
            >
              Marcar como lidas
            </button>
          </div>
          {groupNotifications(items, now).map((g) => (
            <section key={g.label} aria-label={g.label} className="flex flex-col gap-1.5">
              <h2 className="mt-1 mb-0.5 text-xs font-extrabold tracking-[1px] text-muted-foreground uppercase">{g.label}</h2>
              <ul className="flex flex-col gap-1.5">
                {g.items.map((n) => (
                  <NotificationItem key={n.id} n={n} time={notificationTime(n.createdAt, now)} onOpen={() => !n.read && markRead.mutate(n.id)} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  )
}

function NotificationItem({ n, time, onOpen }: { n: AppNotification; time: string; onOpen: () => void }) {
  const { icon: Icon, tone } = kinds[n.kind]
  return (
    <li>
      <Link
        to={n.link}
        onClick={onOpen}
        className={cn(
          'relative flex items-start gap-3 rounded-2xl border py-3 pr-3 pl-3.5 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50',
          n.read ? 'border-border/50' : 'bg-card',
        )}
      >
        {!n.read && <span aria-hidden="true" className="absolute top-4 left-1.25 size-1.5 rounded-full bg-primary" />}
        <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="size-4.5" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.75">
          <span className="flex justify-between gap-2">
            <span className={cn('text-sm leading-[1.35]', n.read ? 'font-semibold' : 'font-extrabold')}>
              {!n.read && <span className="sr-only">Não lida: </span>}
              {n.title}
            </span>
            <span className="text-[11.5px] whitespace-nowrap text-muted-foreground">{time}</span>
          </span>
          <span className="text-[13px] leading-[1.4] text-muted-foreground">{n.body}</span>
        </span>
      </Link>
    </li>
  )
}

const pushTexts: Record<PushState, (device: string) => { title: string; sub: string }> = {
  on: (device) => ({ title: 'Avisos neste celular: ligados', sub: device }),
  off: () => ({ title: 'Avisos neste celular: desligados', sub: 'Você ainda vê tudo aqui, mas sem alerta na tela' }),
  denied: () => ({ title: 'Avisos bloqueados', sub: 'Libere as notificações nas configurações do navegador' }),
  'needs-install': () => ({ title: 'Avisos neste celular: desligados', sub: 'No iPhone, instale o app na tela inicial para receber avisos' }),
  unsupported: () => ({ title: 'Avisos indisponíveis', sub: 'Este navegador não mostra notificações' }),
}

function PushToggle() {
  const { state, toggle, device, installed } = usePushNotifications()
  const { title, sub } = pushTexts[state](installed ? `${device} · app instalado na tela inicial` : device)
  const canToggle = state === 'on' || state === 'off'
  return (
    <label
      className={cn(
        'flex min-h-15 items-center gap-3 rounded-2xl border px-3.5 py-2',
        state === 'on' ? 'bg-card' : 'border-warning/45 bg-warning/8',
        canToggle && 'cursor-pointer',
      )}
    >
      <span className="flex grow flex-col gap-0.5">
        <span className="text-sm font-extrabold">{title}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </span>
      <Switch size="lg" checked={state === 'on'} disabled={!canToggle} onCheckedChange={() => void toggle()} aria-label="Avisos neste celular" />
    </label>
  )
}

const reminders: { key: keyof NotificationSettings; label: string }[] = [
  { key: 'workout', label: 'Dia de treino' },
  { key: 'meals', label: 'Refeições' },
  { key: 'water', label: 'Água' },
  { key: 'checkIn', label: 'Check-in' },
  { key: 'records', label: 'Recordes' },
  { key: 'quietHours', label: 'Horário silencioso' },
]

function RemindersDrawer() {
  const settings = useNotificationSettings()
  const update = useUpdateNotificationSettings()
  const coachFirst = useProfile().data?.coach.name.split(' ')[0]
  return (
    <Drawer>
      <DrawerTrigger aria-label="Escolher lembretes" className={iconButton}>
        <SlidersHorizontal aria-hidden="true" className="size-4.75" strokeWidth={2} />
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-[430px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="flex-row items-center justify-between gap-3 pt-4 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
          <div className="flex flex-col gap-0.5">
            <DrawerTitle className="text-[17px] font-extrabold">Lembretes</DrawerTitle>
            <DrawerDescription className="sr-only">Escolha quais avisos você recebe.</DrawerDescription>
          </div>
          <DrawerClose render={<Button size="sm" className="h-10 rounded-full px-3.5 font-extrabold" />}>Pronto</DrawerClose>
        </DrawerHeader>
        <ul className="flex flex-col px-5 pb-7">
          {reminders.map((r) => (
            <li key={r.key} className="border-t border-border/70">
              <label className="flex min-h-14.5 cursor-pointer items-center gap-3 py-1.5">
                <span className="flex grow flex-col gap-px">
                  <span className="text-[14.5px] font-bold">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{reminderHints[r.key]}</span>
                </span>
                <Switch
                  size="lg"
                  checked={settings.data?.[r.key] ?? false}
                  disabled={!settings.data}
                  onCheckedChange={(on) => update.mutate({ [r.key]: on }, { onError: () => toast.error('Não foi possível salvar. Tente de novo.') })}
                />
              </label>
            </li>
          ))}
          <li className="pt-1.5 text-xs text-muted-foreground">{coachFirst ? `Mensagens do ${coachFirst}` : 'Mensagens do treinador'} sempre chegam, mesmo no horário silencioso.</li>
        </ul>
      </DrawerContent>
    </Drawer>
  )
}

