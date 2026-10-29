import { useState } from 'react'
import { Check } from 'lucide-react'
import { BroadcastAudience, type CoachInbox } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { cn } from '@workspace/ui/lib/utils'
import { useBroadcast } from '../api/queries'

const labels: Record<BroadcastAudience, string> = { active: 'Alunos ativos', online: 'Só online', presencial: 'Só presencial', expiring: 'Plano vencendo' }

/** "Nova transmissão": a mesma mensagem no chat individual de cada aluno do público escolhido. */
export function BroadcastDrawer({ open, onOpenChange, audiences }: { open: boolean; onOpenChange: (o: boolean) => void; audiences: CoachInbox['audiences'] }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">{open && <BroadcastForm audiences={audiences} onClose={() => onOpenChange(false)} />}</DrawerContent>
    </Drawer>
  )
}

function BroadcastForm({ audiences, onClose }: { audiences: CoachInbox['audiences']; onClose: () => void }) {
  const [audience, setAudience] = useState<BroadcastAudience>('active')
  const [text, setText] = useState('')
  const [sent, setSent] = useState<number | null>(null)
  const send = useBroadcast()
  const n = audiences[audience]
  if (sent !== null)
    return (
      <div className="flex flex-col items-center gap-2.5 px-4 pt-8 pb-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check aria-hidden="true" strokeWidth={2.8} className="size-6.5" />
        </span>
        <DrawerTitle className="text-[17px] font-extrabold">Transmissão enviada a {sent} alunos</DrawerTitle>
        <DrawerDescription className="text-[13px]">Enviada com notificação push. Respostas chegam nas conversas individuais.</DrawerDescription>
        <Button variant="outline" size="lg" onClick={onClose} className="mt-1 px-6 font-extrabold">
          Fechar
        </Button>
      </div>
    )
  return (
    <>
      <DrawerHeader className="gap-0.5 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
        <DrawerTitle className="text-[17px] font-extrabold">Nova transmissão</DrawerTitle>
        <DrawerDescription className="text-xs">Cada aluno recebe no chat individual e responde só para você</DrawerDescription>
      </DrawerHeader>
      <div className="flex flex-col gap-3 px-4 pt-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-muted-foreground">Para quem</span>
          <div role="radiogroup" aria-label="Público" className="flex flex-wrap gap-1.5">
            {BroadcastAudience.options.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={audience === a}
                onClick={() => setAudience(a)}
                className={cn('h-9.5 rounded-full border px-3 text-[12.5px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', audience === a ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')}
              >
                {labels[a]} · {audiences[a]}
              </button>
            ))}
          </div>
        </div>
        <textarea
          aria-label="Mensagem da transmissão"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex.: Feriado na segunda, a academia abre das 8h às 14h."
          className="rounded-[14px] border bg-secondary p-3 text-sm leading-normal outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <span className="text-[11.5px] text-muted-foreground">Use {'{nome}'} para personalizar: “Oi, {'{nome}'}!” vira “Oi, Renato!”</span>
        {send.isError && (
          <p role="alert" className="text-[13px] text-destructive">
            Não foi possível enviar. Tente de novo.
          </p>
        )}
      </div>
      <DrawerFooter className="pt-3">
        <Button size="lg" disabled={!text.trim() || n === 0 || send.isPending} onClick={() => send.mutate({ audience, text: text.trim() }, { onSuccess: (r) => setSent(r.sent) })} className="h-12.5 text-[15px] font-extrabold">
          {send.isPending ? 'Enviando…' : `Enviar para ${n} alunos`}
        </Button>
      </DrawerFooter>
    </>
  )
}
