import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { Charge } from '@workspace/core'
import { pixPayload } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

/** "Pix copia e cola" da cobrança, com o valor e o identificador já preenchidos. */
export function useChargePayload(charge: Charge) {
  const { pix, amount } = charge
  return useMemo(() => pixPayload({ key: pix.key, name: pix.receiver, city: pix.city, amount, txid: pix.txid }), [pix, amount])
}

export function CopyPixButton({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard
      .writeText(payload)
      .then(() => setCopied(true))
      .catch(() => toast.error('Não foi possível copiar. Toque e segure o código para copiar.'))

  return (
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
  )
}
