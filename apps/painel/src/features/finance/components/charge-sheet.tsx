import { useState } from 'react'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { chargeSubtitle, chargeTxid, formatBRL, pixPayload, validatePixKey, whatsAppLink, type CoachCharge, type PixSettings } from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { cn } from '@workspace/ui/lib/utils'
import { useStudent } from '../../student-profile/api/queries'
import { useRemindCharge } from '../api/queries'

/** Pix copia e cola de uma cobrança: o valor e o identificador vão no código. */
export function chargePayload(c: CoachCharge, pix: PixSettings) {
  const key = validatePixKey(pix.keyType, pix.key)
  return { payload: pixPayload({ key: key.normalized, name: pix.receiverName, city: pix.city, amount: c.amount, txid: chargeTxid(c) }), txid: chargeTxid(c) }
}

/** "Cobrar": notificação com o Pix, copiar o código ou mandar pelo WhatsApp. */
export function ChargeSheet({ charge, pix, onClose }: { charge: CoachCharge | null; pix: PixSettings; onClose: () => void }) {
  return (
    <Drawer open={!!charge} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="mx-auto max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">{charge && <ChargeBody key={charge.id} c={charge} pix={pix} />}</DrawerContent>
    </Drawer>
  )
}

function ChargeBody({ c, pix }: { c: CoachCharge; pix: PixSettings }) {
  const remind = useRemindCharge()
  const [copied, setCopied] = useState(false)
  const phone = useStudent(c.studentId).data?.phone ?? null
  const p = chargePayload(c, pix)
  return (
    <>
      <DrawerHeader className="gap-0.5 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
        <DrawerTitle className="text-[17px] font-extrabold">Cobrar {c.studentName.split(' ')[0]}</DrawerTitle>
        <DrawerDescription className="text-xs">
          {formatBRL(c.amount)} · {c.plan} · {chargeSubtitle(c, new Date())}
        </DrawerDescription>
      </DrawerHeader>
      <div className="flex flex-col gap-3 px-4 pt-3 pb-5">
        <button
          type="button"
          disabled={!!c.remindedAt || remind.isPending}
          onClick={() => remind.mutate(c.id, { onSuccess: () => toast.success('Notificação enviada'), onError: () => toast.error('Não foi possível enviar.') })}
          className="flex min-h-15 items-center gap-3 rounded-2xl border bg-card px-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/14 text-primary">
            <Bell aria-hidden="true" className="size-4.5" />
          </span>
          <span className="flex flex-col gap-px">
            <span className="text-sm font-extrabold">{c.remindedAt ? 'Notificação enviada' : 'Enviar notificação no app'}</span>
            <span className="text-[11.5px] text-muted-foreground">Notificação com o QR e o valor da cobrança</span>
          </span>
        </button>
        <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3.5">
          <span className="text-xs font-bold text-muted-foreground">Pix copia e cola · {formatBRL(c.amount)}</span>
          <code className="rounded-lg bg-background p-2.5 text-[11px] leading-[1.45] break-all text-foreground-2">{p.payload}</code>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard?.writeText(p.payload).then(
                  () => setCopied(true),
                  () => setCopied(false),
                )
              }
              className="font-bold"
            >
              {copied ? 'Copiado!' : 'Copiar código'}
            </Button>
            {phone ? (
              <a href={whatsAppLink(phone, `Oi, ${c.studentName.split(' ')[0]}! Segue o Pix da renovação (${formatBRL(c.amount)}):\n\n${p.payload}`)} target="_blank" rel="noreferrer" className={cn(buttonVariants({ className: 'bg-[#25D366] font-bold text-[#0B0C0E] hover:bg-[#25D366]/90' }))}>
                Enviar no WhatsApp
              </a>
            ) : (
              <span />
            )}
          </div>
        </div>
        <span className="text-[11.5px] text-muted-foreground">O código inclui o valor e o identificador {p.txid}, para achar o pagamento no extrato.</span>
      </div>
    </>
  )
}
