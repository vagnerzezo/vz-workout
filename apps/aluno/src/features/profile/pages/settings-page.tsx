import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight, Share, Smartphone } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { NotificationSettings } from '@workspace/core'
import { parseIsoDate, shortDate, syncedLabel } from '@workspace/core'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { downloadPlanForOffline } from '../../workout/api/offline'
import { useActiveWorkout } from '../../workout/store/active-workout'
import { install, isIos, useInstall } from '../../../shared/pwa/install'
import { useDevicePrefs } from '../../../shared/prefs/device-prefs'
import { useProfile } from '../api/queries'
import { reminderHints } from '../api/reminder-hints'
import { useNotificationSettings, useUpdateNotificationSettings } from '../api/settings'

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

export default function SettingsPage() {
  const profile = useProfile().data

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        <Link to="/perfil" aria-label="Voltar ao perfil" className={iconButton}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
        <h1 className="text-[26px] font-extrabold tracking-[-0.5px]">Configurações</h1>
      </div>

      <InstallCard />

      <Group title="Conta">
        <LinkRow to="/perfil/configuracoes/dados-pessoais" label="Dados pessoais" value={profile?.fullName} />
        <LinkRow to="/perfil/configuracoes/objetivo" label="Objetivo e nível" value={profile && `${profile.goal} · ${profile.level}`} />
        <LinkRow to="/perfil/configuracoes/acesso" label="E-mail e senha" />
        <LinkRow
          to="/perfil/pagamento"
          label="Assinatura e pagamento"
          value={
            profile?.subscription &&
            `${profile.subscription.planLabel.charAt(0).toUpperCase()}${profile.subscription.planLabel.slice(1)} · até ${shortDate(parseIsoDate(profile.subscription.endsAt))}`
          }
        />
      </Group>

      <NotificationsGroup />
      <WorkoutGroup />
      <OfflineGroup />

      <Group title="Privacidade e suporte">
        <LinkRow to="/perfil/configuracoes/meus-dados" label="Meus dados (LGPD)" value="Exportar ou excluir" />
        <LinkRow to="/perfil/configuracoes/ajuda" label="Central de ajuda" />
        <LinkRow to="/perfil/configuracoes/termos" label="Termos e privacidade" />
      </Group>

      {/* TODO(etapa 3): "Sair do aplicativo" junto com o login (/entrar) */}
      <p className="text-center text-xs text-muted-foreground">Versão {__APP_VERSION__}</p>
    </main>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="text-xs font-extrabold tracking-[1.2px] text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="overflow-hidden rounded-[18px] border bg-card">{children}</ul>
    </section>
  )
}

const rowDivider = 'border-t border-border/70 first:border-t-0'

function LinkRow({ to, label, value }: { to: string; label: string; value?: string | null | false }) {
  return (
    <li className={rowDivider}>
      <Link
        to={to}
        className="flex min-h-14 items-center gap-3 px-4 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span className="grow text-[15px] font-semibold">{label}</span>
        {value && <span className="truncate text-[13px] text-muted-foreground">{value}</span>}
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.2} />
      </Link>
    </li>
  )
}

function SwitchRow({ label, hint, checked, onChange, disabled }: { label: string; hint: string; checked: boolean; onChange: (on: boolean) => void; disabled?: boolean }) {
  const hintId = useId()
  return (
    <li className={rowDivider}>
      <label className={cn('flex min-h-15 items-center gap-3 px-4 py-2', disabled ? 'opacity-60' : 'cursor-pointer')}>
        <span className="flex grow flex-col gap-0.5">
          <span className="text-[15px] font-semibold">{label}</span>
          <span id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </span>
        </span>
        <Switch size="lg" checked={checked} onCheckedChange={onChange} disabled={disabled} aria-describedby={hintId} />
      </label>
    </li>
  )
}

function InstallCard() {
  const { prompt, installed } = useInstall()
  const [showIosHelp, setShowIosHelp] = useState(false)
  const ios = isIos()
  if (installed || (!prompt && !ios)) return null // já instalado, ou navegador sem instalação

  return (
    <section aria-labelledby="instalar" className="flex flex-col gap-3 rounded-[20px] border border-primary bg-primary/12 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Smartphone className="size-5.5" strokeWidth={2} />
        </span>
        <div className="flex grow flex-col gap-0.5">
          <h2 id="instalar" className="text-sm font-extrabold">
            Instale na tela inicial
          </h2>
          <p className="text-xs text-foreground-2">Abre mais rápido e recebe notificações</p>
        </div>
        <button
          type="button"
          onClick={() => (prompt ? void install() : setShowIosHelp(!showIosHelp))}
          aria-expanded={prompt ? undefined : showIosHelp}
          className="h-10 shrink-0 rounded-full bg-primary px-3.5 text-[13px] font-extrabold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Instalar
        </button>
      </div>
      {showIosHelp && (
        <p className="text-[13px] leading-normal text-foreground-2">
          No Safari, toque em <Share aria-label="Compartilhar" className="inline size-4 align-[-3px]" /> e depois em{' '}
          <strong className="text-foreground">Adicionar à Tela de Início</strong>.
        </p>
      )}
    </section>
  )
}

const notificationRows: { key: keyof NotificationSettings; label: string; hint: string }[] = [
  { key: 'workout', label: 'Lembrete de treino', hint: reminderHints.workout },
  { key: 'meals', label: 'Lembrete de refeições', hint: reminderHints.meals },
  { key: 'water', label: 'Lembrete de água', hint: reminderHints.water },
  { key: 'checkIn', label: 'Check-in e feedback', hint: reminderHints.checkIn },
  { key: 'chat', label: 'Mensagens do chat', hint: reminderHints.chat },
]

function NotificationsGroup() {
  const settings = useNotificationSettings()
  const update = useUpdateNotificationSettings()
  return (
    <Group title="Notificações">
      {notificationRows.map((r) => (
        <SwitchRow
          key={r.key}
          label={r.label}
          hint={r.hint}
          checked={settings.data?.[r.key] ?? false}
          disabled={!settings.data}
          onChange={(on) => update.mutate({ [r.key]: on }, { onError: () => toast.error('Não foi possível salvar. Tente de novo.') })}
        />
      ))}
    </Group>
  )
}

function WorkoutGroup() {
  const autoRest = useActiveWorkout((s) => s.autoRest)
  const setAutoRest = useActiveWorkout((s) => s.setAutoRest)
  const prefs = useDevicePrefs()
  return (
    <Group title="Durante o treino">
      <SwitchRow label="Timer automático" hint="Inicia o descanso ao concluir a série" checked={autoRest} onChange={setAutoRest} />
      <SwitchRow label="Som e vibração" hint="Avisa quando o descanso terminar" checked={prefs.sound} onChange={(sound) => prefs.set({ sound })} />
      <SwitchRow label="Manter tela ligada" hint="Evita que a tela apague no treino" checked={prefs.keepAwake} onChange={(keepAwake) => prefs.set({ keepAwake })} />
    </Group>
  )
}

function OfflineGroup() {
  const qc = useQueryClient()
  const prefs = useDevicePrefs()
  const [syncing, setSyncing] = useState(false)

  const toggle = (on: boolean) => {
    prefs.set({ offlinePlan: on })
    if (!on) return
    setSyncing(true)
    downloadPlanForOffline(qc)
      .catch(() => toast.error('Não foi possível baixar a ficha agora. Tente com internet.'))
      .finally(() => setSyncing(false))
  }

  const hint = syncing
    ? 'Baixando a ficha…'
    : prefs.offlinePlan && prefs.offlineSyncedAt
      ? `Treine sem internet · sincronizado ${syncedLabel(prefs.offlineSyncedAt, new Date())}`
      : 'Treine sem internet'

  return (
    <Group title="Offline">
      <SwitchRow label="Baixar ficha atual" hint={hint} checked={prefs.offlinePlan} onChange={toggle} />
    </Group>
  )
}
