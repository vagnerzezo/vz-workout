import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { PendingCheckIn, PhotoPose } from '@workspace/core'
import { checkInProgress, formatDecimal, joinList, parseIsoDate, shortDate } from '@workspace/core'
import { Stepper } from '@workspace/ui/blocks/stepper'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Textarea } from '@workspace/ui/components/textarea'
import { ErrorState } from '../../../shared/components/error-state'
import { usePendingCheckIn, useSendCheckIn } from '../api/queries'
import { PhotoSlot, RatingField, YesNoField } from '../components/check-in-fields'
import { useCheckInDraft } from '../store/check-in-draft'

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

const shell = 'mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-5 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))]'

export default function CheckInPage() {
  const pending = usePendingCheckIn()

  if (pending.isError) {
    return (
      <main className={shell}>
        <BackLink />
        <ErrorState title="Não foi possível carregar o check-in" onRetry={() => pending.refetch()} retrying={pending.isFetching} />
      </main>
    )
  }
  if (pending.data === undefined) {
    return (
      <main className={shell}>
        <BackLink />
        <div aria-busy="true" aria-label="Carregando o check-in" className="flex flex-col gap-5">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-60 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </main>
    )
  }
  if (pending.data === null) return <NothingPending />
  return <CheckInForm checkIn={pending.data} />
}

function BackLink() {
  return (
    <Link to="/perfil" aria-label="Voltar ao perfil" className={iconButton}>
      <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
    </Link>
  )
}

function CheckInForm({ checkIn }: { checkIn: PendingCheckIn }) {
  const navigate = useNavigate()
  const draft = useCheckInDraft()
  const send = useSendCheckIn()
  const [photos, setPhotos] = useState<Partial<Record<PhotoPose, File>>>({})
  const [showMissing, setShowMissing] = useState(false)
  const { open } = draft

  useEffect(() => open(checkIn.id, checkIn.lastWeightKg), [open, checkIn.id, checkIn.lastWeightKg])

  const progress = checkInProgress(checkIn, {
    photos: checkIn.poses.filter((p) => photos[p]),
    weightKg: draft.weightKg,
    ratings: draft.ratings,
    pain: draft.pain,
    painWhere: draft.painWhere,
  })
  const coachFirstName = checkIn.coachName.split(' ')[0]!

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (progress.missing.length > 0) return setShowMissing(true)
    send.mutate(
      {
        id: checkIn.id,
        photos,
        answers: {
          weightKg: draft.weightKg!,
          ratings: draft.ratings,
          pain: draft.pain!,
          painWhere: draft.pain ? draft.painWhere.trim() : null,
          notes: draft.notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          draft.reset()
          toast.success(`Check-in enviado ao ${coachFirstName}`)
          navigate('/perfil', { replace: true })
        },
        onError: () => toast.error('Não foi possível enviar agora. Suas respostas continuam aqui; tente de novo.'),
      },
    )
  }

  return (
    <main className={shell}>
      <div className="flex items-center gap-3">
        <BackLink />
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] font-extrabold">{checkIn.label}</h1>
          <p className="text-[13px] text-muted-foreground">Prazo {shortDate(parseIsoDate(checkIn.dueDate))} · leva uns 3 minutos</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">Preenchido</span>
          <span className="font-extrabold">
            {progress.filled} de {progress.total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Itens preenchidos"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.filled}
          className="h-2 overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-2 rounded-full bg-primary" style={{ width: `${(progress.filled / progress.total) * 100}%` }} />
        </div>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <section aria-labelledby="ci-fotos" className="flex flex-col gap-3">
          <h2 id="ci-fotos" className="text-[17px] font-extrabold">
            1. Fotos
          </h2>
          <ul className="list-disc rounded-2xl border bg-card py-3 pr-3.5 pl-8 text-[13px] leading-[1.6] text-foreground-2">
            <li>Mesma luz e mesmo horário das fotos anteriores</li>
            <li>Celular na altura do peito, a uns 2 metros</li>
            <li>Roupa justa ou de banho, postura relaxada</li>
          </ul>
          <div className="grid grid-cols-3 gap-2">
            {checkIn.poses.map((pose) => (
              <PhotoSlot key={pose} pose={pose} file={photos[pose]} onChange={(file) => setPhotos((p) => ({ ...p, [pose]: file }))} />
            ))}
          </div>
        </section>

        <section aria-labelledby="ci-peso" className="flex flex-col gap-3">
          <h2 id="ci-peso" className="text-[17px] font-extrabold">
            2. Peso de hoje
          </h2>
          <div className="flex flex-col items-center gap-2 rounded-[18px] border bg-card p-3">
            <Stepper
              value={draft.weightKg ?? 70}
              onChange={draft.setWeight}
              label="peso em quilos"
              min={20}
              max={400}
              step={0.1}
              format={(v) => `${formatDecimal(v)} kg`}
            />
            <span className="text-xs text-muted-foreground">em jejum, ao acordar</span>
          </div>
        </section>

        <section aria-labelledby="ci-semanas" className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-0.5">
            <h2 id="ci-semanas" className="text-[17px] font-extrabold">
              3. Últimas duas semanas
            </h2>
            <p className="text-[13px] text-muted-foreground">1 = muito ruim · 5 = excelente</p>
          </div>
          {checkIn.questions.map((q) => (
            <RatingField key={q.id} label={q.label} value={draft.ratings[q.id]} onChange={(v) => draft.rate(q.id, v)} />
          ))}
        </section>

        <section aria-labelledby="ci-dor" className="flex flex-col gap-2.5">
          <h2 id="ci-dor" className="text-[17px] font-extrabold">
            4. Sentiu dor ou desconforto?
          </h2>
          <YesNoField legend="Sentiu dor ou desconforto?" value={draft.pain} onChange={draft.setPain} />
          {draft.pain && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ci-onde" className="text-[13px] text-foreground-2">
                Onde e em qual exercício?
              </label>
              <Input
                id="ci-onde"
                maxLength={200}
                placeholder="Ex.: joelho direito no agachamento hack"
                value={draft.painWhere}
                onChange={(e) => draft.setPainWhere(e.target.value)}
                className="h-12 rounded-[14px] px-3.5"
              />
            </div>
          )}
        </section>

        <div className="flex flex-col gap-2">
          <label htmlFor="ci-obs" className="text-[17px] font-extrabold">
            5. Algo mais para o treinador?
          </label>
          <Textarea
            id="ci-obs"
            rows={3}
            maxLength={1000}
            placeholder="Conquistas, dificuldades, rotina da semana…"
            value={draft.notes}
            onChange={(e) => draft.setNotes(e.target.value)}
            className="rounded-2xl px-3.5 py-3"
          />
        </div>

        {showMissing && progress.missing.length > 0 && (
          <p role="alert" className="rounded-2xl border border-warning/40 bg-warning/10 px-3.5 py-3 text-sm text-foreground-2">
            Falta preencher: {joinList(progress.missing)}.
          </p>
        )}

        <Button type="submit" size="xl" disabled={send.isPending} className="h-14 rounded-full text-base font-extrabold">
          {send.isPending ? 'Enviando…' : 'Enviar check-in'}
        </Button>
      </form>
    </main>
  )
}

function NothingPending() {
  return (
    <main className={shell}>
      <BackLink />
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ClipboardCheck aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-extrabold">Nenhum check-in pendente</h1>
          <p className="text-sm text-muted-foreground">Quando o treinador pedir o próximo, ele aparece no seu perfil.</p>
        </div>
        <Link to="/perfil/progresso#medidas" className="text-sm font-extrabold text-primary underline-offset-4 hover:underline">
          Ver seu progresso
        </Link>
      </div>
    </main>
  )
}
