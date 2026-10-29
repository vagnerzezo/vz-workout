import { useState } from 'react'
import { Link } from 'react-router'
import { Check } from 'lucide-react'
import { formatBRL, formatInviteCode, inviteMessage, whatsAppLink, type Coach, type CreatedStudent, type NewStudent, type NewStudentOptions } from '@workspace/core'
import { PixQr } from '@workspace/ui/blocks/pix-qr'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { fullDate } from './new-student-form'

const TRACK = ['Acesso criado', 'Link aberto pelo aluno', 'Senha criada e anamnese respondida', 'App instalado e notificações ativas']

type InviteReadyProps = {
  created: CreatedStudent
  form: NewStudent
  coach: Coach
  options: NewStudentOptions
  onAgain: () => void
  bodyClassName?: string
  footerClassName?: string
}

/** Depois de criar: código, mensagem pronta (WhatsApp ou copiar), QR na tela e o que falta o aluno fazer. */
export function InviteReady({ created, form, coach, options, onAgain, bodyClassName, footerClassName }: InviteReadyProps) {
  const [showQr, setShowQr] = useState(form.channel === 'qr')
  const [copied, setCopied] = useState(false)
  const first = form.fullName.split(/\s+/)[0]!
  const code = formatInviteCode(created.invite.code)
  const plan = options.plans.find((p) => p.id === form.planId)!
  const message = inviteMessage({ firstName: first, coachFirstName: coach.firstName, appName: coach.branding.appName, link: created.invite.link, code })
  const billing = form.paid ? `Plano ${plan.name} ativo até ${fullDate(created.subscriptionEndsOn)}` : `Cobrança de ${formatBRL(plan.price)} enviada junto`
  const sent = form.channel === 'email' ? ` · convite enviado para ${form.email}` : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
    } catch {
      setCopied(false) // sem permissão: o texto continua na tela para copiar à mão
    }
  }

  return (
    <div className="flex min-h-0 grow flex-col">
      <div className={cn('flex flex-col gap-3.5', bodyClassName)}>
        <section aria-label="Acesso criado" className="flex flex-col items-center gap-2.5 rounded-[22px] border bg-card px-4 py-4.5 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden="true" strokeWidth={2.8} className="size-6.5" />
          </span>
          <h2 className="text-[19px] font-extrabold">Acesso criado para {first}</h2>
          <p className="text-[13px] text-muted-foreground">
            {billing} · {form.mode}
            {sent}
          </p>
          <div className="flex w-full flex-col gap-1 rounded-2xl border bg-background p-3.5">
            <span className="text-[11px] font-extrabold tracking-[1px] text-muted-foreground">CÓDIGO DE PRIMEIRO ACESSO</span>
            <span className="font-mono text-[30px] font-extrabold tracking-[6px] text-primary">{code}</span>
            <span className="text-xs break-all text-muted-foreground">
              {created.invite.link.replace(/^https?:\/\//, '')} · vale por 7 dias · uso único
            </span>
          </div>
        </section>

        {showQr && (
          <section aria-label="QR Code para escanear" className="flex flex-col items-center gap-2.5 rounded-[22px] bg-white p-4.5">
            <PixQr payload={created.invite.link} label={`QR Code do link de primeiro acesso de ${first}`} size={220} />
            <span className="text-center text-[13px] font-bold text-[#0B0C0E]">Peça para {first} apontar a câmera do celular</span>
          </section>
        )}

        <section aria-labelledby="mensagem-aluno" className="flex flex-col gap-2 rounded-[18px] border bg-card p-3.5">
          <h2 id="mensagem-aluno" className="text-xs font-extrabold text-muted-foreground">
            Mensagem que vai para {first}
          </h2>
          <p className="rounded-[14px_14px_14px_4px] bg-secondary p-3 text-[13.5px] leading-normal whitespace-pre-line text-foreground-2">{message}</p>
          <div className="grid grid-cols-2 gap-1.5">
            <a href={whatsAppLink(form.phone, message)} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: 'lg', className: 'bg-[#25D366] font-extrabold text-[#0B0C0E] hover:bg-[#25D366]/90' }))}>
              Enviar no WhatsApp
            </a>
            <Button variant="outline" size="lg" onClick={copy} className="font-extrabold">
              {copied ? 'Copiada!' : 'Copiar mensagem'}
            </Button>
          </div>
          <Button variant="outline" size="lg" onClick={() => setShowQr(!showQr)} className="font-extrabold">
            {showQr ? 'Esconder QR Code' : 'Mostrar QR Code na tela'}
          </Button>
        </section>

        <section aria-labelledby="acompanhe" className="flex flex-col gap-2 rounded-2xl border bg-card px-3.5 py-3">
          <h2 id="acompanhe" className="text-xs font-extrabold text-muted-foreground">
            ACOMPANHE O PRIMEIRO ACESSO
          </h2>
          <ol className="flex flex-col gap-2">
            {TRACK.map((label, i) => (
              <li key={label} className="flex items-center gap-2.5 text-[13px]">
                <span aria-hidden="true" className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-primary-foreground', i === 0 ? 'bg-primary' : 'bg-secondary')}>
                  {i === 0 ? '✓' : ''}
                </span>
                <span className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                <span className="sr-only">{i === 0 ? ' (feito)' : ' (aguardando)'}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className={cn('grid grid-cols-2 gap-2', footerClassName)}>
        <Button variant="outline" size="lg" onClick={onAgain} className="h-13 font-extrabold">
          Cadastrar outro
        </Button>
        <Link to={`/alunos/${created.studentId}`} className={cn(buttonVariants({ size: 'lg', className: 'h-13 font-extrabold' }))}>
          Ver perfil
        </Link>
      </div>
    </div>
  )
}
