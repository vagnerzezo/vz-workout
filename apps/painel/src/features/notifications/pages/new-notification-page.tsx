import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, ChevronLeft, Search, X } from 'lucide-react'
import {
  fillNotification,
  insertVariable,
  NOTIFICATION_VARIABLES,
  notificationReach,
  NotificationTarget,
  notificationTargetLabel,
  quietHoursAdjust,
  shortDate,
  toIsoDate,
  type NewNotification,
} from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { useCoach } from '../../../shared/api/coach'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { SelectBox } from '../../students/components/select-box'
import { useNotificationAudience, useSendNotification, useTestNotification } from '../api/queries'

const TITLE_MAX = 50
const BODY_MAX = 150
const field = 'w-full rounded-[14px] border bg-card px-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
const chip = (on: boolean) => cn('h-9 shrink-0 rounded-full border px-3 text-[12.5px] font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')
const hhmm = (d: Date) => format(d, 'HH:mm')

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `sec-${title}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <h2 id={id} className="text-[15px] font-extrabold">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** /notificacoes/nova (com `?alunos=a,b` vindo da lista de alunos). */
export default function NewNotificationPage() {
  const desktop = useIsDesktop()
  const [params] = useSearchParams()
  const preselected = params.get('alunos')?.split(',').filter(Boolean) ?? []
  const audienceQuery = useNotificationAudience()
  const coach = useCoach()
  const send = useSendNotification()
  const test = useTestNotification()
  const now = new Date()

  const [audience, setAudience] = useState<NewNotification['audience']>(preselected.length ? 'students' : 'all')
  const [tags, setTags] = useState<string[]>(['Online'])
  const [studentIds, setStudentIds] = useState<string[]>(preselected)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [focus, setFocus] = useState<'title' | 'body'>('body')
  const [target, setTarget] = useState<NotificationTarget>('workout')
  const [when, setWhen] = useState<'now' | 'schedule'>('now')
  const [date, setDate] = useState(toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)))
  const [time, setTime] = useState('07:30')
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')
  const [done, setDone] = useState<{ sent: number; push: number; at: string; status: 'sent' | 'scheduled' } | null>(null)

  const shell = (children: ReactNode) => <main className="flex flex-col gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(130px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-7 lg:pb-10">{children}</main>
  const header = (
    <header className="flex items-center gap-2.5">
      <Link to="/notificacoes" aria-label="Voltar para notificações" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Link>
      <h1 className="grow text-xl font-extrabold lg:text-[26px]">Nova notificação</h1>
    </header>
  )
  if (audienceQuery.isError) return shell(<>{header}<ErrorState title="Não foi possível carregar os alunos" retrying={audienceQuery.isFetching} onRetry={() => audienceQuery.refetch()} /></>)
  const data = audienceQuery.data
  if (!data) return shell(<>{header}<Skeleton aria-label="Carregando" className="h-96 rounded-[20px]" /></>)

  if (done) {
    const at = new Date(done.at)
    return shell(
      <>
        {header}
        <section aria-label="Notificação enviada" className="mx-auto mt-6 flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border bg-card px-5 py-8 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden="true" strokeWidth={2.8} className="size-7.5" />
          </span>
          <h2 className="text-xl font-extrabold">{done.status === 'scheduled' ? 'Notificação agendada' : 'Notificação enviada'}</h2>
          <p className="text-sm leading-normal text-muted-foreground">
            {done.status === 'scheduled'
              ? `Sai em ${shortDate(at)} às ${hhmm(at)} para ${done.sent} alunos. Você pode cancelar em Enviadas.`
              : `${done.push} alunos recebem no celular agora e ${done.sent - done.push} verão na central do app.`}
          </p>
          <Link to="/notificacoes?aba=historico" className={cn(buttonVariants({ variant: 'outline', size: 'lg', className: 'mt-1 font-extrabold' }))}>
            Ver enviadas
          </Link>
        </section>
      </>,
    )
  }

  const draft = { audience, tags, studentIds }
  const reach = notificationReach(data.students, draft)
  const scheduledAt = when === 'schedule' && date && time ? new Date(`${date}T${time}:00`) : null
  const adjusted = scheduledAt ? quietHoursAdjust(scheduledAt) : null
  const valid = title.trim().length > 0 && body.trim().length > 0 && title.length <= TITLE_MAX && body.length <= BODY_MAX && reach.total > 0 && (when === 'now' || !!scheduledAt)
  const pvAt = adjusted?.at ?? now
  const appInitials = (coach.data?.branding.appName ?? 'App')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const fill = (t: string) => fillNotification(t, data.sample)
  const names = new Map(data.students.map((s) => [s.id, s.name]))
  const fold = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()

  const submit = () =>
    send.mutate(
      { audience, tags, studentIds, title: title.trim(), body: body.trim(), target, scheduledAt: scheduledAt ? scheduledAt.toISOString() : null },
      { onSuccess: setDone, onError: () => toast.error('Não foi possível enviar. Tente de novo.') },
    )

  const preview = (
    <section aria-label="Pré-visualização" className="flex flex-col items-center gap-3.5 rounded-[22px] bg-[#1e2430] px-3 pt-4.5 pb-5">
      <div className="flex flex-col items-center text-white">
        <span className="text-xs font-semibold opacity-80">{format(pvAt, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
        <span className="text-[44px] leading-none font-bold">{hhmm(pvAt)}</span>
      </div>
      <div className="flex w-full gap-2.5 rounded-[18px] bg-[rgba(40,42,48,0.9)] p-3">
        <span aria-hidden="true" className="flex size-8.5 shrink-0 items-center justify-center rounded-[9px] bg-primary text-xs font-extrabold text-primary-foreground">
          {appInitials}
        </span>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <div className="flex justify-between gap-1.5">
            <span className="text-[13px] font-extrabold text-white">{fill(title) || 'Título da notificação'}</span>
            <span className="text-[11px] whitespace-nowrap text-[#b8bcc4]">{when === 'schedule' ? 'agendada' : 'agora'}</span>
          </div>
          <span className="text-[13px] leading-[1.4] text-[#e2e5e9]">{fill(body) || 'Texto da notificação'}</span>
        </div>
      </div>
      <span className="text-center text-[11px] text-[#b8bcc4]">
        Exemplo com os dados de {data.sample.name} · ao tocar abre {notificationTargetLabel[target].toLowerCase()}
      </span>
    </section>
  )

  const form = (
    <div className="flex flex-col gap-5">
      <Section title="Para quem">
        <div role="radiogroup" aria-label="Público" className="grid grid-cols-3 gap-1.5">
          {(
            [
              ['all', desktop ? 'Todos os ativos' : 'Todos'],
              ['tags', 'Por tag'],
              ['students', desktop ? 'Alunos específicos' : 'Alunos'],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={audience === v} onClick={() => setAudience(v)} className={cn(chip(audience === v), 'h-11 rounded-xl text-[12.5px] font-extrabold')}>
              {label}
            </button>
          ))}
        </div>
        {audience === 'tags' && (
          <div role="group" aria-label="Tags" className="flex flex-wrap gap-1.5">
            {data.tags.map((t) => (
              <button key={t} type="button" aria-pressed={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} className={chip(tags.includes(t))}>
                {t} · {data.students.filter((s) => s.tags.includes(t)).length}
              </button>
            ))}
          </div>
        )}
        {audience === 'students' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {studentIds.map((id) => (
              <span key={id} className="flex h-9 items-center gap-1 rounded-full bg-secondary pr-1 pl-3 text-[12.5px] font-bold">
                {names.get(id) ?? id}
                <button type="button" aria-label={`Remover ${names.get(id) ?? id}`} onClick={() => setStudentIds(studentIds.filter((x) => x !== id))} className="flex size-7.5 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </span>
            ))}
            <button type="button" onClick={() => setPicking(true)} className="h-9 rounded-full border border-dashed border-line-strong px-3 text-[12.5px] font-bold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              + {desktop ? 'Adicionar aluno' : 'Aluno'}
            </button>
          </div>
        )}
        <div className="flex flex-col gap-1.5 rounded-xl border bg-card px-3 py-2.5">
          <span role="img" aria-label={`${reach.push} de ${reach.total} alunos recebem push no celular`} className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            <span className="block bg-primary" style={{ width: `${reach.total ? (reach.push / reach.total) * 100 : 0}%` }} />
            <span className="block grow bg-warning" />
          </span>
          <span role="status" className="text-[12.5px] text-foreground-2">
            <strong className="text-foreground">{reach.total}</strong> alunos · <strong className="text-primary">{reach.push}</strong> no celular · <strong className="text-warning">{reach.noPush}</strong> só na central
          </span>
        </div>
      </Section>

      <Section title="Mensagem">
        <label className="flex flex-col gap-1.5">
          <span className="flex justify-between text-xs">
            <span className="font-bold text-foreground-2">Título</span>
            <span className={title.length > TITLE_MAX ? 'text-destructive' : 'text-muted-foreground'}>
              {title.length}/{TITLE_MAX}
            </span>
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onFocus={() => setFocus('title')} placeholder="Ex.: Bora treinar, {nome}!" aria-invalid={title.length > TITLE_MAX} className={cn(field, 'h-12')} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="flex justify-between text-xs">
            <span className="font-bold text-foreground-2">Texto</span>
            <span className={body.length > BODY_MAX ? 'text-destructive' : 'text-muted-foreground'}>
              {body.length}/{BODY_MAX}
            </span>
          </span>
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} onFocus={() => setFocus('body')} placeholder="O que o aluno vai ler" aria-invalid={body.length > BODY_MAX} className={cn(field, 'resize-none py-3 leading-[1.45]')} />
        </label>
        <div role="group" aria-label={`Inserir variável no ${focus === 'title' ? 'título' : 'texto'}`} className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">No {focus === 'title' ? 'título' : 'texto'}:</span>
          {NOTIFICATION_VARIABLES.map((v) => (
            <button key={v} type="button" onClick={() => (focus === 'title' ? setTitle(insertVariable(title, v)) : setBody(insertVariable(body, v)))} className={chip(false)}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-foreground-2">Ao tocar, abrir</span>
          <div role="radiogroup" aria-label="Destino ao tocar" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {NotificationTarget.options.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={target === t} onClick={() => setTarget(t)} className={chip(target === t)}>
                {notificationTargetLabel[t]}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Quando">
        <div role="radiogroup" aria-label="Quando enviar" className="grid grid-cols-2 gap-1.5">
          {(
            [
              ['now', 'Enviar agora'],
              ['schedule', 'Agendar'],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={when === v} onClick={() => setWhen(v)} className={cn(chip(when === v), 'h-11 rounded-xl text-[13px] font-extrabold')}>
              {label}
            </button>
          ))}
        </div>
        {when === 'schedule' && (
          <>
            <div className="grid grid-cols-[1.3fr_1fr] gap-2">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-foreground-2">
                Data
                <input type="date" value={date} min={toIsoDate(now)} onChange={(e) => setDate(e.target.value)} className={cn(field, 'h-12 [color-scheme:dark]')} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-foreground-2">
                Hora
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={cn(field, 'h-12 [color-scheme:dark]')} />
              </label>
            </div>
            <span className={cn('text-[11.5px]', adjusted?.moved ? 'text-warning' : 'text-muted-foreground')}>
              {adjusted?.moved ? 'Entre 22h e 7h o envio fica para as 7h, para não acordar ninguém.' : 'Horário de Brasília. Cada aluno recebe no fuso do celular dele.'}
            </span>
          </>
        )}
      </Section>
    </div>
  )

  const actions = (
    <>
      <Button variant="outline" size="lg" disabled={test.isPending || test.isSuccess} onClick={() => test.mutate(undefined, { onSuccess: () => toast.success('Teste enviado para o seu celular') })} className="font-extrabold">
        {test.isSuccess ? 'Teste enviado' : desktop ? 'Enviar teste para mim' : 'Testar em mim'}
      </Button>
      <Button size="lg" disabled={!valid || send.isPending} onClick={submit} className="grow font-extrabold">
        {send.isPending ? 'Enviando…' : `${when === 'schedule' ? 'Agendar para' : 'Enviar para'} ${reach.total} alunos`}
      </Button>
    </>
  )

  const picker = (
    <Drawer open={picking} onOpenChange={setPicking}>
      <DrawerContent className="mx-auto max-h-[85dvh] max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
          <DrawerTitle className="text-[17px] font-extrabold">Escolher alunos</DrawerTitle>
        </DrawerHeader>
        <div className="flex min-h-0 flex-col gap-3 px-4 pt-2">
          <label className="flex h-10.5 shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 focus-within:ring-3 focus-within:ring-ring/50">
            <Search aria-hidden="true" className="size-4 text-muted-foreground" />
            <input type="search" aria-label="Buscar aluno" placeholder="Buscar aluno" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 grow bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
          </label>
          <ul aria-label="Alunos" className="flex min-h-0 flex-col overflow-y-auto">
            {data.students
              .filter((s) => !query.trim() || fold(s.name).includes(fold(query.trim())))
              .map((s) => (
                <li key={s.id}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2">
                    <SelectBox label={s.name} checked={studentIds.includes(s.id)} onChange={(v) => setStudentIds(v ? [...studentIds, s.id] : studentIds.filter((x) => x !== s.id))} />
                    <span className="grow text-sm font-bold">{s.name}</span>
                    {!s.push && <span className="text-[11px] text-warning">sem push</span>}
                  </label>
                </li>
              ))}
          </ul>
        </div>
        <DrawerFooter className="pt-3">
          <Button size="lg" onClick={() => setPicking(false)} className="font-extrabold">
            Pronto · {studentIds.length} {studentIds.length === 1 ? 'aluno' : 'alunos'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )

  if (desktop)
    return shell(
      <>
        {header}
        <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6">
          <section aria-label="Criar notificação" className="flex flex-col gap-5 rounded-[22px] border bg-[#111215] p-5">
            {form}
            <div className="flex gap-2.5 border-t border-[#22252b] pt-4">{actions}</div>
          </section>
          <aside aria-label="Pré-visualização e alcance" className="flex flex-col gap-4">
            {preview}
            <section className="flex flex-col gap-2 rounded-[20px] border bg-card p-4">
              <h2 className="text-[15px] font-extrabold">{data.students.filter((s) => !s.push).length} alunos sem push ativo</h2>
              <p className="text-[13px] leading-normal text-muted-foreground">No iPhone, o push só funciona com o app instalado na tela inicial e a permissão aceita. Esses alunos verão o aviso na central de notificações quando abrirem o app.</p>
              <Button variant="outline" onClick={() => toast('O guia de instalação chega em breve')} className="self-start font-bold">
                Enviar guia de instalação
              </Button>
            </section>
          </aside>
        </div>
        {picker}
      </>,
    )

  return shell(
    <>
      {header}
      {preview}
      {form}
      <div className="sticky bottom-[calc(100px+env(safe-area-inset-bottom))] z-10 flex gap-2 rounded-full border bg-background/95 p-1.5 backdrop-blur">{actions}</div>
      {picker}
    </>,
  )
}
