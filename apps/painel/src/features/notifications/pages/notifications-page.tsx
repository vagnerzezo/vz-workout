import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ChevronLeft, Plus, Send, SlidersHorizontal } from 'lucide-react'
import { formatInt, groupNotifications, notificationTargetLabel, notificationTime, shortDate, type CoachNotifications, type CoachPrefKey, type SentNotification } from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useCancelScheduled, useCoachNotifications, usePrefs, useReadAll, useReadNotification, useToggleAutomation } from '../api/queries'
import { KindIcon } from '../components/kind-icon'

type Tab = 'inbox' | 'automations' | 'history'
const tabs: { tab: Tab; param: string | null; label: string }[] = [
  { tab: 'inbox', param: null, label: 'Recebidas' },
  { tab: 'automations', param: 'automacoes', label: 'Automações' },
  { tab: 'history', param: 'historico', label: 'Histórico' },
]

const prefLabels: Record<CoachPrefKey, [string, string]> = {
  checkIn: ['Check-ins recebidos', 'Quando um aluno envia o check-in'],
  payment: ['Pagamentos e comprovantes', 'Comprovante enviado ou pagamento atrasado'],
  message: ['Mensagens', 'Respostas dos alunos no chat'],
  inactive: ['Aluno sem treinar', '3 dias seguidos sem treino'],
  plan: ['Fichas vencendo', '5 dias antes do fim da ficha'],
  quietHours: ['Não perturbe à noite', 'Sem push entre 22h e 7h'],
}
const audienceText = { student: 'Para o aluno', coach: 'Para você', both: 'Aluno + você' } as const
const statusText = { sent: 'Enviada', scheduled: 'Agendada', canceled: 'Cancelada' } as const
const statusTone = { sent: 'text-primary', scheduled: 'text-info', canceled: 'text-muted-foreground' } as const

const when = (h: SentNotification) => {
  const d = new Date(h.at)
  return `${shortDate(d)} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function Inbox({ data }: { data: CoachNotifications }) {
  const now = new Date()
  const read = useReadNotification()
  const readAll = useReadAll()
  const prefs = usePrefs()
  const [prefsOpen, setPrefsOpen] = useState(false)
  const unread = data.inbox.filter((n) => !n.read).length
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="grow text-[13px] font-bold text-foreground-2">{unread === 0 ? 'Tudo lido' : unread === 1 ? '1 não lida' : `${unread} não lidas`}</span>
        <Button variant="ghost" size="sm" disabled={unread === 0 || readAll.isPending} onClick={() => readAll.mutate()} className="font-bold text-primary">
          Marcar todas como lidas
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="O que eu recebo" onClick={() => setPrefsOpen(true)} className="rounded-full border-input">
          <SlidersHorizontal aria-hidden="true" />
        </Button>
      </div>
      {groupNotifications(data.inbox, now).map((g) => (
        <section key={g.label} aria-labelledby={`grupo-${g.label}`} className="flex flex-col gap-2">
          <h2 id={`grupo-${g.label}`} className="text-[11px] font-extrabold tracking-[0.8px] text-muted-foreground">
            {g.label.toUpperCase()}
          </h2>
          <ul className="flex flex-col gap-2">
            {g.items.map((n) => (
              <li key={n.id} aria-label={`${n.title}${n.read ? '' : ', não lida'}`} className={cn('flex items-start gap-3 rounded-2xl border p-3', n.read ? 'border-[#1a1c21]' : 'bg-card')}>
                <KindIcon kind={n.kind} />
                <span className="flex min-w-0 grow flex-col gap-1">
                  <span className="flex justify-between gap-2">
                    <span className={cn('text-sm', n.read ? 'font-semibold' : 'font-extrabold')}>{n.title}</span>
                    <span className="text-[11.5px] whitespace-nowrap text-muted-foreground">{notificationTime(n.createdAt, now)}</span>
                  </span>
                  <span className="text-[13px] leading-[1.4] text-foreground-2">{n.body}</span>
                  <Link
                    to={n.link}
                    onClick={() => !n.read && read.mutate(n.id)}
                    className={cn(buttonVariants({ variant: n.primary ? 'default' : 'outline', size: 'sm', className: 'mt-1 h-8.5 self-start font-bold' }))}
                  >
                    {n.cta}
                  </Link>
                </span>
                {!n.read && <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Drawer open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DrawerContent className="mx-auto max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="gap-0.5 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="text-[17px] font-extrabold">O que eu recebo</DrawerTitle>
            <DrawerDescription className="text-xs">Push neste celular · a central guarda tudo mesmo desligado</DrawerDescription>
          </DrawerHeader>
          <ul className="flex flex-col px-4 pt-2 pb-5">
            {(Object.keys(prefLabels) as CoachPrefKey[]).map((k) => (
              <li key={k}>
                <label className="flex min-h-14 items-center gap-3 border-b border-[#22252b] py-2">
                  <span className="flex grow flex-col gap-px">
                    <span className="text-sm font-bold">{prefLabels[k][0]}</span>
                    <span className="text-[11.5px] text-muted-foreground">{prefLabels[k][1]}</span>
                  </span>
                  <Switch checked={data.prefs[k]} onCheckedChange={(v) => prefs.mutate({ [k]: v })} />
                </label>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function Automations({ data, desktop }: { data: CoachNotifications; desktop: boolean }) {
  const toggle = useToggleAutomation()
  const on = data.automations.filter((a) => a.enabled).length
  return (
    <div className="flex flex-col gap-3">
      {!desktop && (
        <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3.5">
          <span className="flex items-baseline justify-between text-[13px] text-foreground-2">
            Alunos com push ativo
            <span>
              <strong className="text-lg text-foreground">{data.push.enabled}</strong> de {data.push.students}
            </span>
          </span>
          <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(data.push.enabled / (data.push.students || 1)) * 100}%` }} />
          </span>
          <span className="text-[11.5px] text-muted-foreground">
            {on} de {data.automations.length} automações ligadas · {data.openRate}% de abertura em 30 dias
          </span>
        </div>
      )}
      <ul aria-label="Automações" className={cn('grid gap-2', desktop && 'grid-cols-2 gap-3 xl:grid-cols-3')}>
        {data.automations.map((a) => (
          <li key={a.id} className={cn('flex items-center gap-3 rounded-2xl border bg-card p-3.5', !a.enabled && 'opacity-60')}>
            <span className="flex min-w-0 grow flex-col gap-0.5">
              <span className="text-sm font-extrabold">{a.name}</span>
              <span className="text-xs text-foreground-2">{a.trigger}</span>
              <span className="text-[11.5px] text-muted-foreground">
                {audienceText[a.audience]} · {a.enabled ? (a.stats ?? 'sem envios') : 'desligada'}
              </span>
            </span>
            <Switch aria-label={a.name} checked={a.enabled} onCheckedChange={(v) => toggle.mutate({ id: a.id, enabled: v }, { onSuccess: () => toast.success(v ? `${a.name} ligada` : `${a.name} desligada`) })} />
          </li>
        ))}
      </ul>
      {!desktop && <span className="text-center text-[11.5px] text-muted-foreground">Para editar o texto de uma automação, use o painel no computador.</span>}
    </div>
  )
}

function History({ data, desktop }: { data: CoachNotifications; desktop: boolean }) {
  const cancel = useCancelScheduled()
  const doCancel = (h: SentNotification) => cancel.mutate(h.id, { onSuccess: () => toast.success('Envio agendado cancelado'), onError: () => toast.error('Não foi possível cancelar.') })
  if (desktop)
    return (
      <table aria-label="Histórico de envios" className="w-full border-separate border-spacing-y-1.5 text-[13px]">
        <thead>
          <tr className="text-left text-[11px] tracking-[0.8px] text-muted-foreground">
            {['DATA', 'NOTIFICAÇÃO', 'PÚBLICO', 'ENVIADAS', 'PUSH', 'ABERTURA', 'STATUS', ''].map((h) => (
              <th key={h} className="px-3 pb-1 font-extrabold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.history.map((h) => (
            <tr key={h.id} className="bg-card">
              <td className="rounded-l-xl px-3 py-2.5 whitespace-nowrap text-foreground-2">{when(h)}</td>
              <td className="px-3 py-2.5">
                <span className="block font-bold">{h.title}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{h.body}</span>
              </td>
              <td className="px-3 py-2.5 text-foreground-2">{h.audienceLabel}</td>
              <td className="px-3 py-2.5">{h.sent ?? '—'}</td>
              <td className="px-3 py-2.5">{h.push ?? '—'}</td>
              <td className="px-3 py-2.5">{h.openRate === null ? '—' : `${h.openRate}%`}</td>
              <td className={cn('px-3 py-2.5 font-bold', statusTone[h.status])}>{statusText[h.status]}</td>
              <td className="rounded-r-xl px-3 py-2.5 text-right">
                {h.status === 'scheduled' && (
                  <Button variant="outline" size="sm" onClick={() => doCancel(h)} className="h-8 font-bold">
                    Cancelar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  return (
    <ul aria-label="Histórico de envios" className="flex flex-col gap-2">
      {data.history.map((h) => (
        <li key={h.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-3.5">
          <span className="flex justify-between gap-2 text-xs text-muted-foreground">
            {when(h)} · {h.audienceLabel}
            <span className={cn('font-bold', statusTone[h.status])}>{statusText[h.status]}</span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-extrabold">{h.title}</span>
            <span className="text-[13px] text-foreground-2">{h.body}</span>
            <span className="text-[11.5px] text-muted-foreground">Ao tocar, abre {notificationTargetLabel[h.target].toLowerCase()}</span>
          </span>
          {h.status === 'sent' && (
            <span className="text-xs text-foreground-2">
              {h.sent} enviadas · {h.push} push · {h.openRate}% abriram
            </span>
          )}
          {h.status === 'scheduled' && (
            <Button variant="outline" size="sm" onClick={() => doCancel(h)} className="h-9 self-start font-bold">
              Cancelar envio
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}

/** /notificacoes: avisos recebidos pelo treinador, automações e envios feitos para os alunos. */
export default function NotificationsPage() {
  const desktop = useIsDesktop()
  const query = useCoachNotifications()
  const [params, setParams] = useSearchParams()
  const tab = tabs.find((t) => t.param && t.param === params.get('aba'))?.tab ?? 'inbox'
  const setTab = (t: Tab) =>
    setParams(
      () => {
        const p = tabs.find((x) => x.tab === t)!.param
        return p ? { aba: p } : new URLSearchParams()
      },
      { replace: true },
    )
  const data = query.data
  const scheduled = data?.history.filter((h) => h.status === 'scheduled').length ?? 0
  const autosOn = data?.automations.filter((a) => a.enabled).length ?? 0

  return (
    <main className="flex flex-col gap-3.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-7 lg:pb-10">
      <header className="flex flex-wrap items-center justify-between gap-2.5 lg:gap-3">
        <Link to="/" aria-label="Voltar" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="flex grow flex-col gap-1">
          <h1 className="text-[22px] font-extrabold tracking-[-0.5px] lg:text-[28px]">Notificações</h1>
          <span className="hidden text-[13px] text-muted-foreground lg:block">Avisos e lembretes que chegam no celular dos alunos e na central do app</span>
        </div>
        <Link to="/notificacoes/nova" aria-label="Nova notificação para alunos" className={cn(buttonVariants({ size: desktop ? 'lg' : 'default', className: 'font-extrabold' }))}>
          {desktop ? <Plus aria-hidden="true" strokeWidth={2.6} /> : <Send aria-hidden="true" />}
          {desktop ? 'Nova notificação' : 'Enviar'}
        </Link>
      </header>

      {desktop && data && (
        <section aria-label="Indicadores" className="grid grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 rounded-[18px] border bg-card px-4 py-3.5">
            <span className="text-xs text-muted-foreground">Alunos com push ativo</span>
            <span className="text-[26px] font-extrabold">
              {data.push.enabled} <span className="text-sm font-bold text-muted-foreground">de {data.push.students}</span>
            </span>
            <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${(data.push.enabled / (data.push.students || 1)) * 100}%` }} />
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-[18px] border bg-card px-4 py-3.5">
            <span className="text-xs text-muted-foreground">Enviadas em 30 dias</span>
            <span className="text-[26px] font-extrabold">{formatInt(data.sent30d)}</span>
            <span className="text-xs text-muted-foreground">87% por automações</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[18px] border bg-card px-4 py-3.5">
            <span className="text-xs text-muted-foreground">Taxa de abertura</span>
            <span className="text-[26px] font-extrabold">{data.openRate}%</span>
            <span className="text-xs text-primary">+6 pts no mês</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[18px] border bg-card px-4 py-3.5">
            <span className="text-xs text-muted-foreground">Automações ativas</span>
            <span className="text-[26px] font-extrabold">
              {autosOn} <span className="text-sm font-bold text-muted-foreground">de {data.automations.length}</span>
            </span>
            <span className="text-xs text-muted-foreground">{scheduled === 1 ? '1 envio agendado' : `${scheduled} envios agendados`}</span>
          </div>
        </section>
      )}

      <div role="tablist" aria-label="Seções de notificações" className="grid grid-cols-3 gap-1 rounded-[14px] border bg-background p-1 lg:flex lg:gap-1 lg:rounded-none lg:border-0 lg:border-b lg:border-secondary lg:p-0">
        {tabs.map((t) => {
          const on = tab === t.tab
          return (
            <button
              key={t.tab}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.tab)}
              className={cn(
                'flex h-10 items-center justify-center rounded-[10px] text-[12.5px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                'lg:-mb-px lg:h-11 lg:rounded-none lg:border-b-2 lg:bg-transparent lg:px-3.5 lg:text-sm',
                on ? 'bg-primary text-primary-foreground lg:border-primary lg:text-foreground' : 'text-foreground-2 lg:border-transparent lg:text-muted-foreground',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {query.isError ? (
        <ErrorState title="Não foi possível carregar as notificações" retrying={query.isFetching} onRetry={() => query.refetch()} />
      ) : !data ? (
        <Skeleton aria-label="Carregando as notificações" className="h-96 rounded-[20px]" />
      ) : tab === 'inbox' ? (
        <Inbox data={data} />
      ) : tab === 'automations' ? (
        <Automations data={data} desktop={desktop} />
      ) : (
        <History data={data} desktop={desktop} />
      )}
    </main>
  )
}
