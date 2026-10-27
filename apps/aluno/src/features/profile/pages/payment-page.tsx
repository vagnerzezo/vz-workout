import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Check, ChevronLeft, Copy, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Billing, Charge } from '@workspace/core'
import { dueLabel, formatBRL, parseIsoDate, pixPayload, relativeDay, shortDate, toIsoDate } from '@workspace/core'
import { PixQr } from '@workspace/ui/blocks/pix-qr'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useBilling, useSendProof } from '../api/billing'

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

const longDate = (iso: string) => {
  const d = parseIsoDate(iso)
  return `${shortDate(d)}/${d.getFullYear()}`
}

export default function PaymentPage() {
  const billing = useBilling()
  const [today] = useState(() => new Date())
  const data = billing.data

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4.5 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        <Link to="/perfil/configuracoes" aria-label="Voltar para configurações" className={iconButton}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
        <h1 className="text-2xl font-extrabold">Pagamento</h1>
      </div>

      {billing.isError ? (
        <ErrorState title="Não foi possível carregar o pagamento" onRetry={() => billing.refetch()} retrying={billing.isFetching} />
      ) : !data ? (
        <div aria-busy="true" aria-label="Carregando o pagamento" className="flex flex-col gap-4.5">
          <Skeleton className="h-28 rounded-[20px]" />
          <Skeleton className="h-80 rounded-[20px]" />
        </div>
      ) : (
        <>
          {data.charge ? <ChargeFlow charge={data.charge} coachName={data.coachName} today={today} /> : <UpToDate />}
          <History history={data.history} />
        </>
      )}
    </main>
  )
}

const statusChip: Record<Charge['status'], { text?: string; className: string }> = {
  open: { className: 'bg-warning/16 text-warning' },
  in_review: { text: 'Em análise', className: 'bg-info/16 text-info' },
  rejected: { text: 'Comprovante recusado', className: 'bg-destructive/16 text-destructive' },
  paid: { text: 'Pago', className: 'bg-primary/14 text-primary' },
}

function ChargeFlow({ charge, coachName, today }: { charge: Charge; coachName: string; today: Date }) {
  const [replacing, setReplacing] = useState(false)
  const showPay = charge.status === 'open' || charge.status === 'rejected' || replacing
  const chip = statusChip[charge.status]

  return (
    <>
      <section
        aria-labelledby="plano"
        className={cn('flex flex-col gap-2.5 rounded-[20px] border bg-card px-4.5 py-4', charge.status === 'open' && 'border-warning/45')}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="plano" className="text-xs font-extrabold tracking-[1.2px] text-muted-foreground">
            RENOVAÇÃO DO PLANO
          </h2>
          <span className={cn('flex h-6.5 items-center rounded-full px-2.5 text-xs font-extrabold', chip.className)}>
            {chip.text ?? dueLabel(charge.dueDate, today)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-extrabold">{charge.planLabel}</span>
          <span className="text-[26px] font-extrabold tracking-[-0.5px]">{formatBRL(charge.amount)}</span>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Vence em {shortDate(parseIsoDate(charge.dueDate))} · renova até {longDate(charge.renewsUntil)} · {coachName}
        </p>
        {charge.status === 'rejected' && charge.rejectionReason && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-foreground-2">
            <strong className="text-foreground">Motivo:</strong> {charge.rejectionReason}
          </p>
        )}
      </section>

      {showPay ? (
        <>
          <PixSection charge={charge} />
          <ProofSection charge={charge} onSent={() => setReplacing(false)} />
        </>
      ) : (
        <StatusSection charge={charge} coachName={coachName} today={today} onReplace={() => setReplacing(true)} />
      )}
    </>
  )
}

function PixSection({ charge }: { charge: Charge }) {
  const [copied, setCopied] = useState(false)
  const { pix } = charge
  const payload = useMemo(
    () => pixPayload({ key: pix.key, name: pix.receiver, city: pix.city, amount: charge.amount, txid: pix.txid }),
    [pix, charge.amount],
  )

  const copy = () =>
    navigator.clipboard
      .writeText(payload)
      .then(() => setCopied(true))
      .catch(() => toast.error('Não foi possível copiar. Toque e segure o código para copiar.'))

  return (
    <section aria-labelledby="pix" className="flex flex-col gap-3">
      <h2 id="pix" className="text-[17px] font-extrabold">
        1. Pague com Pix
      </h2>
      <div className="flex flex-col items-center gap-1.5 rounded-[20px] bg-white p-4">
        <PixQr payload={payload} label={`QR Code Pix para pagar ${formatBRL(charge.amount)}`} />
        <span className="text-xs text-[#5A606A]">Abra o app do banco e escaneie</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-foreground-2">Ou use o Pix copia e cola</span>
        <output aria-label="Código Pix copia e cola" className="max-h-13 overflow-hidden rounded-xl border bg-card px-3 py-2.5 font-mono text-[11px] leading-normal break-all text-muted-foreground select-all">
          {payload}
        </output>
        <button
          type="button"
          onClick={copy}
          className={cn(
            'flex h-12.5 items-center justify-center gap-2 rounded-full text-[15px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            copied ? 'bg-primary/14 text-primary' : 'bg-primary text-primary-foreground',
          )}
        >
          {copied ? <Check aria-hidden="true" className="size-4.5" strokeWidth={2.4} /> : <Copy aria-hidden="true" className="size-4.5" strokeWidth={2} />}
          {copied ? 'Código copiado' : 'Copiar código Pix'}
        </button>
      </div>
      <dl className="rounded-[14px] border bg-card px-3.5 py-1 text-[13px]">
        {[
          [pix.keyLabel, pix.keyDisplay],
          ['Recebedor', pix.receiver],
          ['Identificador', pix.txid],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2.5 border-t border-border/70 py-2 first:border-t-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ProofSection({ charge, onSent }: { charge: Charge; onSent: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const send = useSendProof()
  const preview = useMemo(
    () => (file?.type.startsWith('image/') && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null),
    [file],
  )

  const submit = () => {
    if (!file) return
    send.mutate(
      { chargeId: charge.id, file },
      {
        onSuccess: () => {
          toast.success('Comprovante enviado')
          onSent()
        },
        onError: () => toast.error('Não foi possível enviar. Confira se é uma imagem ou PDF de até 10 MB.'),
      },
    )
  }

  return (
    <section aria-labelledby="comprovante" className="flex flex-col gap-3">
      <h2 id="comprovante" className="text-[17px] font-extrabold">
        2. Envie o comprovante
      </h2>
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-[18px] border border-dashed bg-card p-4.5 text-center has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
          file ? 'border-primary' : 'border-line-strong',
        )}
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          aria-label={file ? 'Trocar arquivo do comprovante' : 'Escolher o comprovante'}
          onChange={(e) => {
            const picked = e.target.files?.[0]
            if (picked) setFile(picked)
            e.target.value = ''
          }}
        />
        {preview ? (
          <img src={preview} alt="Comprovante escolhido" className="h-45 w-35 rounded-[10px] bg-secondary object-cover" />
        ) : (
          <Upload aria-hidden="true" className="size-7 text-foreground-2" strokeWidth={1.8} />
        )}
        <span className="text-sm font-extrabold">{file ? file.name : 'Toque para escolher o comprovante'}</span>
        <span className="text-xs text-muted-foreground">Print ou PDF do comprovante do banco</span>
      </label>
      <Button size="xl" disabled={!file || send.isPending} onClick={submit} className="h-13.5 rounded-full text-base font-extrabold disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100">
        {send.isPending ? 'Enviando…' : 'Enviar comprovante'}
      </Button>
    </section>
  )
}

function StatusSection({ charge, coachName, today, onReplace }: { charge: Charge; coachName: string; today: Date; onReplace: () => void }) {
  const coachFirst = coachName.split(' ')[0]
  const sentAt = charge.proof ? new Date(charge.proof.sentAt) : null
  const steps = [
    { title: 'Comprovante enviado', meta: `${charge.proof?.fileName ?? 'comprovante'} · ${sentAt ? relativeDay(toIsoDate(sentAt), today) : ''}`, state: 'done' },
    { title: `Em análise pelo ${coachFirst}`, meta: 'Normalmente em até 1 dia útil', state: 'doing' },
    { title: 'Pagamento confirmado', meta: `Seu plano é renovado até ${longDate(charge.renewsUntil)} e você recebe uma notificação`, state: 'todo' },
  ] as const

  return (
    <section aria-labelledby="status" className="flex flex-col gap-1 rounded-[20px] border bg-card p-4.5">
      <h2 id="status" className="mb-2 text-[17px] font-extrabold">
        Acompanhe seu pagamento
      </h2>
      <ol>
        {steps.map((s, i) => (
          <li key={s.title} aria-current={s.state === 'doing' ? 'step' : undefined} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3">
            <span aria-hidden="true" className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full border-2',
                  s.state === 'done' ? 'border-primary bg-primary text-primary-foreground' : s.state === 'doing' ? 'border-primary' : 'border-line-strong',
                )}
              >
                {s.state === 'done' && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className={cn('min-h-4.5 w-0.5 grow', i === steps.length - 1 ? 'bg-transparent' : s.state === 'done' ? 'bg-primary' : 'bg-border')} />
            </span>
            <div className="flex flex-col gap-0.5 pb-3.5">
              <span className={cn('text-sm font-extrabold', s.state === 'todo' && 'text-muted-foreground')}>{s.title}</span>
              <span className="text-xs text-muted-foreground">{s.meta}</span>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onReplace}
        className="h-10 self-start rounded-full border border-line-strong px-3.5 text-[13px] font-bold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Trocar comprovante
      </button>
    </section>
  )
}

function UpToDate() {
  return (
    <section aria-label="Seu plano" className="flex items-center gap-3 rounded-[20px] border bg-card px-4.5 py-4">
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-primary/14 text-primary">
        <Check className="size-5" strokeWidth={2.6} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-extrabold">Pagamento em dia</span>
        <span className="text-[13px] text-muted-foreground">Quando a próxima renovação chegar, ela aparece aqui.</span>
      </div>
    </section>
  )
}

function History({ history }: { history: Billing['history'] }) {
  return (
    <section aria-labelledby="historico" className="flex flex-col gap-2.5">
      <h2 id="historico" className="text-[17px] font-extrabold">
        Histórico
      </h2>
      {history.length === 0 ? (
        <p className="rounded-[18px] border bg-card px-3.5 py-4 text-center text-sm text-muted-foreground">Nenhum pagamento ainda.</p>
      ) : (
        <ul className="overflow-hidden rounded-[18px] border bg-card">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-3 border-t border-border/70 px-3.5 py-3 first:border-t-0">
              <div className="flex grow flex-col gap-0.5">
                <span className="text-sm font-extrabold">{h.planLabel}</span>
                <span className="text-xs text-muted-foreground">Pago em {shortDate(parseIsoDate(h.paidAt))} · Pix</span>
              </div>
              <span className="text-sm font-extrabold">{formatBRL(h.amount)}</span>
              <span className="flex h-5.5 items-center rounded-full bg-primary/14 px-2 text-[11px] font-extrabold text-primary">Pago</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
