import { useState } from 'react'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'
import { proofChecks, REJECTION_REASONS, shortDate, suggestedRejection, parseIsoDate, type CoachCharge, type CoachFinance } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { useConfirmCharge, useRejectCharge } from '../api/queries'

const mark = { ok: ['✓', 'bg-primary'], warning: ['!', 'bg-warning'], danger: ['×', 'bg-destructive'] } as const
const first = (c: CoachCharge) => c.studentName.split(' ')[0]!

/** O resultado de uma decisão (confirmado ou recusado). */
export function decisionText(c: CoachCharge) {
  if (c.status === 'paid') return `Confirmado. Plano renovado até ${shortDate(parseIsoDate(c.renewsUntil))} e recibo enviado.`
  if (c.status === 'rejected') return `Recusado: ${c.rejectionReason?.toLowerCase()}. ${first(c)} foi avisado no app.`
  return null
}

/** Imagem do comprovante, o que a conferência leu e (se ainda não decidido) confirmar ou recusar. */
export function ProofReview({ charge: c, finance, onDecided, compact = false, stickyActions = false }: { charge: CoachCharge; finance: CoachFinance; onDecided?: (c: CoachCharge, status: 'paid' | 'rejected') => void; compact?: boolean; stickyActions?: boolean }) {
  const confirm = useConfirmCharge()
  const reject = useRejectCharge()
  const [rejecting, setRejecting] = useState(false)
  const checks = proofChecks(c, finance.pix, finance.rules.toleranceDays)
  const suggested = suggestedRejection(checks)
  const decided = decisionText(c)
  const busy = confirm.isPending || reject.isPending
  const fail = () => toast.error('Não foi possível salvar. Tente de novo.')

  return (
    <div className="flex flex-col gap-3">
      {/* Sem arquivo na API simulada: o nome do arquivo ocupa o lugar da imagem */}
      <div className={cn('flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-card p-4 text-center text-[13px] text-muted-foreground', compact ? 'h-48' : 'h-72')}>
        <FileText aria-hidden="true" className="size-10" strokeWidth={1.5} />
        Imagem enviada pelo aluno
        <span className="font-bold text-foreground-2">{c.proof?.fileName}</span>
      </div>
      <section aria-label="Conferência" className="flex flex-col rounded-2xl border bg-card px-3.5 py-3">
        <div className="flex items-baseline justify-between pb-1.5">
          <span className="text-[11px] font-extrabold tracking-[1.2px] text-muted-foreground">LIDO DO COMPROVANTE</span>
          <span className="text-[11px] text-muted-foreground">confira na imagem</span>
        </div>
        <ul>
          {checks.map((k) => (
            <li key={k.label} className="flex items-start gap-2.5 border-t border-[#22252b] py-2">
              <span aria-hidden="true" className={cn('flex size-5.5 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-primary-foreground', mark[k.tone][1])}>
                {mark[k.tone][0]}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13.5px] font-bold">{k.label}</span>
                <span className="text-xs text-muted-foreground">{k.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {decided ? (
        <p role="status" className={cn('rounded-2xl border px-3.5 py-3 text-[13.5px] leading-[1.45]', c.status === 'paid' ? 'border-primary bg-primary/10' : 'border-destructive/50 bg-destructive/10')}>
          {decided}
        </p>
      ) : rejecting ? (
        <section aria-label="Motivo da recusa" className="flex flex-col gap-2 rounded-2xl border bg-card p-3.5">
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-extrabold">Recusar comprovante</span>
            <span className="text-xs text-muted-foreground">{first(c)} recebe o motivo no app e pode enviar outro</span>
          </span>
          {REJECTION_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              disabled={busy}
              onClick={() => reject.mutate({ id: c.id, reason: r }, { onSuccess: () => onDecided?.(c, 'rejected'), onError: fail })}
              className="flex min-h-12 items-center justify-between gap-2.5 rounded-xl border bg-secondary px-3.5 text-left text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {r}
              {r === suggested && <span className="text-[11.5px] font-extrabold text-warning">sugerido</span>}
            </button>
          ))}
          <Button variant="ghost" onClick={() => setRejecting(false)} className="font-bold">
            Voltar
          </Button>
        </section>
      ) : (
        <div className={cn('flex gap-2', stickyActions && 'sticky bottom-[calc(100px+env(safe-area-inset-bottom))] z-10 rounded-full border bg-background/95 p-1.5 backdrop-blur')}>
          <Button variant="outline" size="lg" disabled={busy} onClick={() => setRejecting(true)} className="border-destructive font-extrabold text-destructive hover:text-destructive">
            Recusar
          </Button>
          <Button size="lg" disabled={busy} onClick={() => confirm.mutate(c.id, { onSuccess: () => onDecided?.(c, 'paid'), onError: fail })} className="grow font-extrabold">
            Confirmar e renovar
          </Button>
        </div>
      )}
    </div>
  )
}
