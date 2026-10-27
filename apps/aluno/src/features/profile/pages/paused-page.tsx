import { useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { ChevronRight, Lock, MessageCircle, TrendingUp, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Charge } from '@workspace/core'
import { formatBRL, initials, parseIsoDate, shortDate } from '@workspace/core'
import { PixQr } from '@workspace/ui/blocks/pix-qr'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { isUnauthorized, useMe } from '../../../shared/api/me'
import { useBilling, useSendProof } from '../api/billing'
import { CopyPixButton, useChargePayload } from '../components/pix-parts'

/** Cobrança vencida: o app só libera pagar, falar com o treinador e ver o progresso. */
export default function PausedPage() {
  const me = useMe()
  const billing = useBilling()

  if (isUnauthorized(me.error)) return <Navigate to="/entrar" replace />
  if (me.data?.access === 'active') return <Navigate to="/" replace />

  const appName = me.data?.branding.appName ?? ''
  const coachName = billing.data?.coachName ?? ''
  const coachFirst = coachName.split(' ')[0] ?? ''
  const charge = billing.data?.charge

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4.5 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground">
          {initials(appName)}
        </span>
        <span className="grow text-[15px] font-extrabold">{appName}</span>
        <Link
          to="/chat"
          aria-label={coachFirst ? `Falar com o ${coachFirst}` : 'Falar com o treinador'}
          className="flex size-11 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </Link>
      </header>

      {billing.isError ? (
        <ErrorState title="Não foi possível carregar a cobrança" onRetry={() => billing.refetch()} retrying={billing.isFetching} />
      ) : !billing.data ? (
        <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-4.5">
          <Skeleton className="h-36 rounded-[22px]" />
          <Skeleton className="h-96 rounded-[22px]" />
        </div>
      ) : (
        <>
          {charge?.status === 'in_review' ? <ProofSent charge={charge} coachFirst={coachFirst} /> : <PausedIntro charge={charge ?? null} />}
          {charge && charge.status !== 'paid' && <PayCard charge={charge} coachName={coachName} />}
          {charge && (charge.status === 'open' || charge.status === 'rejected') && <SendProof charge={charge} />}
        </>
      )}

      <section aria-labelledby="liberado" className="flex flex-col gap-2.5 rounded-[18px] border bg-card p-3.5">
        <h2 id="liberado" className="text-xs font-extrabold tracking-[1px] text-muted-foreground">
          CONTINUA LIBERADO
        </h2>
        <ul className="flex flex-col">
          <FreeLink to="/chat" icon={<MessageCircle className="size-4" strokeWidth={2} />} tone="bg-primary/14 text-primary">
            Conversar com o {coachFirst || 'treinador'}
          </FreeLink>
          <FreeLink to="/perfil/progresso" icon={<TrendingUp className="size-4" strokeWidth={2} />} tone="bg-info/16 text-info">
            Seu progresso e histórico
          </FreeLink>
        </ul>
        <p className="text-xs leading-[1.45] text-muted-foreground">Seus dados não são apagados. Treinos, dieta e check-ins ficam pausados até o pagamento.</p>
      </section>
    </main>
  )
}

function PausedIntro({ charge }: { charge: Charge | null }) {
  return (
    <section aria-labelledby="pausado" className="flex flex-col items-center gap-2.5 pt-2 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-warning/14 text-warning">
        <Lock className="size-7" strokeWidth={2} />
      </span>
      <h1 id="pausado" className="text-2xl font-extrabold tracking-[-0.3px]">
        Seu acesso está pausado
      </h1>
      <p className="max-w-80 text-[14.5px] leading-normal text-muted-foreground">
        {charge
          ? `O plano ${charge.planLabel.toLowerCase()} venceu em ${shortDate(parseIsoDate(charge.dueDate))}. Assim que o pagamento cair, seus treinos voltam na hora.`
          : 'Fale com o seu treinador para liberar o acesso de novo.'}
      </p>
    </section>
  )
}

function ProofSent({ charge, coachFirst }: { charge: Charge; coachFirst: string }) {
  return (
    <section aria-labelledby="enviado" className="flex flex-col gap-2 rounded-[22px] border border-info/45 bg-info/8 p-4.5">
      <h1 id="enviado" className="text-lg font-extrabold">
        Comprovante enviado
      </h1>
      <p className="text-sm leading-normal text-foreground-2">
        O {coachFirst} confere e libera seu acesso. Costuma levar menos de 2 horas em dias úteis. Você recebe um aviso quando liberar.
      </p>
      {charge.proof && <span className="text-xs text-muted-foreground">{charge.proof.fileName} · enviado</span>}
    </section>
  )
}

function PayCard({ charge, coachName }: { charge: Charge; coachName: string }) {
  const payload = useChargePayload(charge)
  return (
    <section aria-label="Pagamento" className="flex flex-col gap-3.5 rounded-[22px] border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-foreground-2">Plano {charge.planLabel}</span>
        <span className="text-2xl font-extrabold">{formatBRL(charge.amount)}</span>
      </div>
      <div className="self-center rounded-2xl bg-white p-3">
        <PixQr payload={payload} size={184} label={`QR Code Pix de ${formatBRL(charge.amount)} para ${coachName}`} />
      </div>
      <p className="text-center text-[12.5px] text-muted-foreground">Abra o app do seu banco › Pix › Ler QR Code. Pagando por este código, o valor já vem certo.</p>
      <div className="flex flex-col gap-1.5 rounded-[14px] bg-secondary px-3 py-2.5">
        <span className="text-xs font-extrabold text-muted-foreground">PIX COPIA E COLA</span>
        <output aria-label="Código Pix copia e cola" className="line-clamp-2 font-mono text-[10.5px] leading-[1.45] break-all text-foreground-2 select-all">
          {payload}
        </output>
      </div>
      <CopyPixButton payload={payload} />
      <p className="text-center text-xs text-muted-foreground">
        Recebedor: {charge.pix.receiver} · {charge.pix.keyLabel.replace('Chave ', '')} {charge.pix.keyDisplay}
      </p>
    </section>
  )
}

function SendProof({ charge }: { charge: Charge }) {
  const send = useSendProof()
  const [name, setName] = useState<string | null>(null)
  return (
    <label className="relative flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-dashed border-line-strong text-sm font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        disabled={send.isPending}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          setName(file.name)
          send.mutate(
            { chargeId: charge.id, file },
            { onError: () => toast.error('Não foi possível enviar. Confira se é uma imagem ou PDF de até 10 MB.') },
          )
        }}
      />
      <Upload aria-hidden="true" className="size-4.5" strokeWidth={2} />
      {send.isPending ? `Enviando ${name}…` : 'Já paguei · enviar comprovante'}
    </label>
  )
}

function FreeLink({ to, icon, tone, children }: { to: string; icon: ReactNode; tone: string; children: ReactNode }) {
  return (
    <li>
      <Link to={to} className="flex min-h-11 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span aria-hidden="true" className={`flex size-8.5 items-center justify-center rounded-[10px] ${tone}`}>
          {icon}
        </span>
        <span className="grow text-sm font-bold">{children}</span>
        <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={2.2} />
      </Link>
    </li>
  )
}
