import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Bell, Brush, ChevronRight, ClipboardCheck, Clock, Download, Dumbbell, Fingerprint, Lock, MonitorSmartphone, User, Users, Wallet, type LucideIcon } from 'lucide-react'
import { initials, isValidCref, restLabel, Weekday, type CoachSettings } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { UnsavedChangesDialog } from '../../../shared/components/unsaved-changes-dialog'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useCoachSettings, useSaveSettings } from '../api/queries'
import { AccountSection, PlanUsage, Sessions } from '../components/account'
import { BrandFields, BrandPreview } from '../components/brand-editor'
import { CheckInFields, DefaultsFields, frequencyLabel, HoursFields, InviteLink, PermissionsTable, ProfileFields, settingsInvalid, soon, TeamList } from '../components/fields'

type Section = 'perfil' | 'marca' | 'equipe' | 'checkin' | 'atendimento' | 'conta'
const sections: { id: Section; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'perfil', label: 'Perfil profissional', hint: 'Nome, CREF e apresentação', icon: User },
  { id: 'marca', label: 'Marca do app', hint: 'Nome, logo e cor', icon: Brush },
  { id: 'equipe', label: 'Equipe e permissões', hint: 'Nutricionista e assistentes', icon: Users },
  { id: 'checkin', label: 'Check-in', hint: 'Perguntas e frequência', icon: ClipboardCheck },
  { id: 'atendimento', label: 'Atendimento e padrões', hint: 'Horários e regras', icon: Clock },
  { id: 'conta', label: 'Conta e segurança', hint: 'Plano, acesso e LGPD', icon: Lock },
]

/** Prévia do logo escolhido (o arquivo só sobe na fase da API). */
export function useLogoPreview() {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])
  return [url, (f: File | null) => setUrl(f ? URL.createObjectURL(f) : null)] as const
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const saveError = (e: Error) => toast.error(e.message.includes('CREF') ? 'CREF inválido. Use o formato 000000-G/UF.' : 'Não foi possível salvar as configurações.')

function DesktopSettings({ initial }: { initial: CoachSettings }) {
  const [params, setParams] = useSearchParams()
  const save = useSaveSettings()
  const [saved, setSaved] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [logo, setLogo] = useLogoPreview()
  const raw = params.get('secao')
  const section = sections.find((s) => s.id === raw)?.id ?? 'perfil'
  const dirty = !same(draft, saved)
  const invalid = settingsInvalid(draft)
  const set = <K extends keyof CoachSettings>(k: K) => (v: CoachSettings[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const submit = () =>
    save.mutate(draft, {
      onSuccess: (s) => {
        setSaved(s)
        setDraft(s)
        toast.success('Configurações salvas')
      },
      onError: saveError,
    })

  const current = sections.find((s) => s.id === section)!
  const body = {
    perfil: <ProfileFields value={draft.profile} onChange={set('profile')} desktop />,
    marca: (
      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-normal text-muted-foreground">Seus alunos instalam o app com o seu nome, logo e cor. Essas informações geram o ícone da tela inicial e a tela de abertura.</p>
          <BrandFields value={draft.branding} onChange={set('branding')} logo={logo} onLogo={(f) => (setLogo(f), set('branding')({ ...draft.branding, logoName: f.name }))} desktop />
        </div>
        <BrandPreview b={draft.branding} logo={logo} />
      </div>
    ),
    equipe: (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold">Membros da equipe</h3>
            <Button size="sm" variant="outline" onClick={() => soon('O convite de equipe')} className="font-bold">
              Convidar membro
            </Button>
          </div>
          <TeamList team={draft.team} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-[15px] font-extrabold">Permissões por função</h3>
          <p className="text-xs text-muted-foreground">Clique numa célula para alternar entre Editar, Ver e Sem acesso</p>
          <PermissionsTable value={draft.permissions} onChange={set('permissions')} />
        </div>
      </div>
    ),
    checkin: <CheckInFields value={draft.checkIn} onChange={set('checkIn')} desktop />,
    atendimento: (
      <div className="flex flex-col gap-6">
        <HoursFields value={draft.hours} onChange={set('hours')} />
        <div className="flex flex-col gap-2 border-t pt-5">
          <h3 className="text-[15px] font-extrabold">Padrões para novos alunos</h3>
          <DefaultsFields value={draft.defaults} onChange={set('defaults')} />
        </div>
      </div>
    ),
    conta: <AccountSection value={draft} sessions={initial.security.sessions} onTwoFactor={(on) => set('security')({ ...draft.security, twoFactor: on })} />,
  }[section]

  return (
    <main className="flex flex-col gap-5 px-8 pt-7 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-extrabold tracking-[-0.5px]">Configurações</h1>
          <p className="text-sm text-muted-foreground">Seu perfil, a marca do app, a equipe e as regras padrão</p>
        </div>
        <div className="flex items-center gap-3">
          <span role="status" className={cn('text-[13px] font-bold', dirty ? 'text-warning' : 'text-muted-foreground')}>
            {dirty ? 'Alterações não salvas' : 'Tudo salvo'}
          </span>
          <Button size="lg" disabled={!dirty || invalid || save.isPending} onClick={submit} className="font-extrabold">
            Salvar alterações
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-5">
        <nav aria-label="Seções das configurações" className="flex flex-col gap-1">
          {sections.map((s) => {
            const on = s.id === section
            const Icon = s.icon
            return (
              <button
                key={s.id}
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => setParams(s.id === 'perfil' ? {} : { secao: s.id }, { replace: true, preventScrollReset: true })}
                className={cn('flex items-center gap-3 rounded-2xl border-l-3 px-3 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/12' : 'border-transparent hover:bg-secondary/60')}
              >
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', on ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground-2')}>
                  <Icon aria-hidden="true" className="size-4.5" />
                </span>
                <span className="flex flex-col gap-px">
                  <span className="text-sm font-extrabold">{s.label}</span>
                  <span className="text-[11.5px] text-muted-foreground">{s.hint}</span>
                </span>
              </button>
            )
          })}
        </nav>
        <section aria-labelledby="secao-titulo" className="rounded-[22px] border bg-[#111215] p-6">
          <h2 id="secao-titulo" className="mb-5 text-lg font-extrabold">
            {current.label}
          </h2>
          {body}
        </section>
      </div>
      <UnsavedChangesDialog dirty={dirty} what="das configurações" />
    </main>
  )
}

type Sheet = 'perfil' | 'equipe' | 'checkin' | 'atendimento' | 'padroes' | 'sessoes'
const sheetTitle: Record<Sheet, string> = { perfil: 'Perfil profissional', equipe: 'Equipe', checkin: 'Check-in', atendimento: 'Horário de atendimento', padroes: 'Padrões de treino', sessoes: 'Sessões ativas' }

type Row = { label: string; value: string; icon: LucideIcon; tone: string } & ({ open: () => void } | { to: string } | { checked: boolean; onToggle: (on: boolean) => void })

const hour = (t: string) => {
  const [h = '0', m = '00'] = t.split(':')
  return `${Number(h)}h${m === '00' ? '' : m}`
}

function hoursSummary(h: CoachSettings['hours']) {
  const on = Weekday.options.filter((d) => h.days[d].on)
  const weekday = h.days.mon
  return on.length ? `${on.length} dias por semana · ${hour(weekday.from)} às ${hour(weekday.to)}` : 'Sem atendimento'
}

function MobileSettings({ data }: { data: CoachSettings }) {
  const save = useSaveSettings()
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [draft, setDraft] = useState(data)
  const open = (s: Sheet) => () => (setDraft(data), setSheet(s))
  const crefOk = isValidCref(data.profile.cref)
  const pending = data.team.filter((m) => m.pending).length
  const quick = (patch: Partial<CoachSettings>, msg: string) => save.mutate({ ...data, ...patch }, { onSuccess: () => toast.success(msg), onError: saveError })
  const done = () => {
    if (sheet === 'equipe' || sheet === 'sessoes' || same(draft, data)) return setSheet(null)
    save.mutate(draft, {
      onSuccess: () => {
        setSheet(null)
        toast.success('Configurações salvas')
      },
      onError: saveError,
    })
  }
  const set = <K extends keyof CoachSettings>(k: K) => (v: CoachSettings[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: 'Seu negócio',
      rows: [
        { label: 'Perfil profissional', value: crefOk ? 'Nome, CREF e apresentação' : 'CREF com formato inválido', icon: User, tone: crefOk ? 'bg-primary/14 text-primary' : 'bg-destructive/16 text-destructive', open: open('perfil') },
        { label: 'Marca do app', value: data.branding.appName, icon: Brush, tone: 'bg-violet/16 text-violet', to: '/configuracoes/marca' },
        { label: 'Equipe', value: `${data.team.length} pessoas${pending ? ` · ${pending} convite pendente` : ''}`, icon: Users, tone: 'bg-info/16 text-info', open: open('equipe') },
      ],
    },
    {
      title: 'Rotina de atendimento',
      rows: [
        { label: 'Check-in', value: `${frequencyLabel[data.checkIn.frequency]} · ${data.checkIn.questions.length} perguntas`, icon: ClipboardCheck, tone: 'bg-info/16 text-info', open: open('checkin') },
        { label: 'Horário de atendimento', value: hoursSummary(data.hours), icon: Clock, tone: 'bg-warning/16 text-warning', open: open('atendimento') },
        { label: 'Padrões de treino', value: `Quilos · descanso de ${restLabel(data.defaults.restSeconds)}`, icon: Dumbbell, tone: 'bg-primary/14 text-primary', open: open('padroes') },
        { label: 'Pagamentos e Pix', value: 'Chave, planos e regras de cobrança', icon: Wallet, tone: 'bg-warning/16 text-warning', to: '/financeiro?aba=pix' },
      ],
    },
    {
      title: 'Este celular',
      rows: [
        { label: 'Notificações', value: 'Check-ins, pagamentos, mensagens', icon: Bell, tone: 'bg-destructive/16 text-destructive', to: '/notificacoes' },
        { label: 'Entrar com biometria', value: data.security.biometrics ? 'Face ID ou digital ao abrir o app' : 'Pedir senha sempre', icon: Fingerprint, tone: 'bg-primary/14 text-primary', checked: data.security.biometrics, onToggle: (on) => quick({ security: { ...data.security, biometrics: on } }, on ? 'Biometria ligada' : 'Biometria desligada') },
      ],
    },
    {
      title: 'Segurança e privacidade',
      rows: [
        { label: 'Verificação em duas etapas', value: data.security.twoFactor ? 'Código por app autenticador' : 'Desligada · recomendamos ligar', icon: Lock, tone: data.security.twoFactor ? 'bg-primary/14 text-primary' : 'bg-destructive/16 text-destructive', checked: data.security.twoFactor, onToggle: (on) => quick({ security: { ...data.security, twoFactor: on } }, on ? 'Verificação em duas etapas ligada' : 'Verificação em duas etapas desligada') },
        { label: 'Sessões ativas', value: data.security.sessions.length === 1 ? '1 dispositivo' : `${data.security.sessions.length} dispositivos`, icon: MonitorSmartphone, tone: 'bg-secondary text-foreground-2', open: open('sessoes') },
        { label: 'Exportar meus dados (LGPD)', value: 'Arquivo enviado por e-mail em até 24 h', icon: Download, tone: 'bg-secondary text-foreground-2', open: () => toast.success('Exportação solicitada. O arquivo chega por e-mail em até 24 h') },
      ],
    },
  ]

  const rowInner = (r: Row) => {
    const Icon = r.icon
    return (
      <>
        <span aria-hidden="true" className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', r.tone)}>
          <Icon className="size-4.5" />
        </span>
        <span className="flex min-w-0 grow flex-col gap-px">
          <span className="text-sm font-bold">{r.label}</span>
          <span className="truncate text-xs text-muted-foreground">{r.value}</span>
        </span>
      </>
    )
  }
  const rowCls = 'flex min-h-15 w-full items-center gap-3 px-3.5 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset'

  const sheetBody = sheet && {
    perfil: <ProfileFields value={draft.profile} onChange={set('profile')} desktop={false} />,
    equipe: (
      <div className="flex flex-col gap-3">
        <TeamList team={data.team} />
        <Button size="lg" variant="outline" onClick={() => soon('O convite de equipe')} className="font-extrabold">
          Convidar membro
        </Button>
        <p className="text-xs leading-normal text-muted-foreground">Fichas de dieta só podem ser editadas por nutricionista com CRN (Lei 8.234/91). A tabela de permissões por área fica no painel do computador.</p>
      </div>
    ),
    checkin: <CheckInFields value={draft.checkIn} onChange={set('checkIn')} desktop={false} />,
    atendimento: <HoursFields value={draft.hours} onChange={set('hours')} />,
    padroes: <DefaultsFields value={draft.defaults} onChange={set('defaults')} />,
    sessoes: <Sessions sessions={data.security.sessions} />,
  }[sheet]

  return (
    <main className="flex flex-col gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">
      <h1 className="text-[22px] font-extrabold tracking-[-0.5px]">Configurações</h1>
      <section aria-label="Seu perfil" className="flex flex-col gap-3 rounded-2xl border bg-card p-3.5">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
            {initials(data.profile.name)}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-extrabold">{data.profile.name}</span>
            <span className={cn('text-xs', crefOk ? 'text-foreground-2' : 'text-destructive')}>{crefOk ? `CREF ${data.profile.cref}` : 'CREF inválido'}</span>
            <span className="text-xs text-muted-foreground">
              {data.branding.appName} · Plano {data.plan.name}
            </span>
          </span>
        </div>
        <span className="text-[11.5px] font-bold text-muted-foreground">Link de convite para novos alunos</span>
        <InviteLink link={data.profile.inviteLink} />
      </section>
      {groups.map((g, i) => (
        <section key={g.title} aria-labelledby={`grupo-${i}`} className="flex flex-col gap-1.5">
          <h2 id={`grupo-${i}`} className="px-1 text-[11px] font-extrabold tracking-wide text-muted-foreground">
            {g.title.toUpperCase()}
          </h2>
          <ul className="overflow-hidden rounded-2xl border bg-card">
            {g.rows.map((r) => (
              <li key={r.label} className="border-b border-[#22252b] last:border-b-0">
                {'to' in r ? (
                  <Link to={r.to} className={rowCls}>
                    {rowInner(r)}
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ) : 'open' in r ? (
                  <button type="button" onClick={r.open} className={rowCls}>
                    {rowInner(r)}
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ) : (
                  <label className={rowCls}>
                    {rowInner(r)}
                    <Switch checked={r.checked} disabled={save.isPending} onCheckedChange={r.onToggle} />
                  </label>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <PlanUsage plan={data.plan} />
      <Button size="lg" variant="outline" onClick={() => soon('Sair da conta')} className="font-extrabold text-destructive">
        Sair desta conta
      </Button>

      <Drawer open={!!sheet} onOpenChange={(o) => !o && setSheet(null)}>
        <DrawerContent className="mx-auto max-h-[90dvh] max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="flex-row items-center justify-between gap-2 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="text-[17px] font-extrabold">{sheet && sheetTitle[sheet]}</DrawerTitle>
            <DrawerDescription className="sr-only">Altere e toque em Pronto para salvar</DrawerDescription>
            <Button size="sm" onClick={done} disabled={save.isPending || settingsInvalid(draft)} className="font-extrabold">
              Pronto
            </Button>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pt-1 pb-5">{sheetBody}</div>
        </DrawerContent>
      </Drawer>
    </main>
  )
}

/** /configuracoes: no desktop, seções com um "Salvar alterações"; no celular, lista com folhas que salvam no "Pronto". */
export default function SettingsRoute() {
  const desktop = useIsDesktop()
  const query = useCoachSettings()
  const shell = (children: React.ReactNode) => <main className="flex flex-col gap-3.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:px-8 lg:pt-7">{children}</main>
  if (query.isError) return shell(<ErrorState title="Não foi possível carregar as configurações" retrying={query.isFetching} onRetry={() => query.refetch()} />)
  if (!query.data) return shell(<Skeleton aria-label="Carregando as configurações" className="h-[70vh] rounded-[20px]" />)
  return desktop ? <DesktopSettings initial={query.data} /> : <MobileSettings data={query.data} />
}
