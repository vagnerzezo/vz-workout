import { useState } from 'react'
import { toast } from 'sonner'
import { Mic, Paperclip, Send } from 'lucide-react'
import { chatQuickReplies, type CoachConversation } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'
import { useSendMessage } from '../api/queries'

/** Respostas rápidas, clipe (ficha e dieta viram cartão na conversa) e o campo de texto (Enter envia). */
export function Composer({ conversation: c }: { conversation: CoachConversation }) {
  const [draft, setDraft] = useState('')
  const send = useSendMessage(c.id)
  const first = c.title.split(' ')[0]!
  const fail = () => toast.error('Não foi possível enviar. Tente de novo.')
  const submit = () => {
    const text = draft.trim()
    if (!text || send.isPending) return
    send.mutate({ text }, { onSuccess: () => setDraft(''), onError: fail })
  }
  const soon = (what: string) => () => toast(`${what} chega em breve`)

  return (
    <div className="flex flex-col gap-2">
      {c.kind === 'student' && (
        <div role="group" aria-label="Respostas rápidas" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {chatQuickReplies(first).map((t) => (
            <button key={t.label} type="button" onClick={() => setDraft(t.text)} className="h-8 shrink-0 rounded-full border border-input px-3 text-xs font-bold text-foreground-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Anexar ou compartilhar" className="shrink-0 rounded-full border-input" />}>
            <Paperclip aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="min-w-48">
            <DropdownMenuItem onClick={soon('Enviar foto ou vídeo')}>Foto ou vídeo</DropdownMenuItem>
            {c.studentId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => send.mutate({ share: 'plan' }, { onSuccess: () => toast.success('Ficha compartilhada'), onError: fail })}>Compartilhar ficha de treino</DropdownMenuItem>
                <DropdownMenuItem onClick={() => send.mutate({ share: 'diet' }, { onSuccess: () => toast.success('Dieta compartilhada'), onError: fail })}>Compartilhar dieta</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <label className="flex h-11 min-w-0 grow items-center rounded-full border bg-card px-4 focus-within:ring-3 focus-within:ring-ring/50">
          <span className="sr-only">Mensagem</span>
          <input
            type="text"
            enterKeyHint="send"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={c.kind === 'group' ? 'Mensagem para o grupo' : `Escreva para ${first}…`}
            className="min-w-0 grow bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        {draft.trim() ? (
          <Button size="icon" aria-label="Enviar mensagem" disabled={send.isPending} onClick={submit} className="shrink-0 rounded-full">
            <Send aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="outline" size="icon" aria-label="Gravar áudio" onClick={soon('Gravar áudio')} className="shrink-0 rounded-full border-input">
            <Mic aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  )
}
