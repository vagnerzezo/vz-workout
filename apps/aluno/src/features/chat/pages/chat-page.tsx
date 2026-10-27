import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import { chatTimeline, initials } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { useConversation } from '../api/queries'
import { Composer } from '../components/composer'
import { MessageItem } from '../components/message-item'

/** Conversa com o treinador: tela cheia, com o campo de mensagem fixo embaixo. */
export default function ChatPage() {
  const conversation = useConversation()
  const [now] = useState(() => new Date())
  const end = useRef<HTMLDivElement>(null)
  const data = conversation.data
  const count = data?.messages.length ?? 0
  const coachName = data?.coach.name ?? ''
  const coachFirst = coachName.split(' ')[0] || 'treinador'

  // Abre no fim da conversa e acompanha cada mensagem nova
  useEffect(() => {
    if (count) end.current?.scrollIntoView?.({ block: 'end' })
  }, [count])

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[430px] flex-col">
      <header className="flex items-center gap-2.5 border-b border-border/60 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
        <Link
          to="/"
          aria-label="Voltar para o início"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
        {data && (
          <>
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
              {initials(coachName)}
            </span>
            <div className="flex min-w-0 grow flex-col gap-px">
              <h1 className="text-base font-extrabold">{coachName}</h1>
              <p className="text-xs text-muted-foreground">Seu treinador · {data.coach.responseTime}</p>
            </div>
          </>
        )}
      </header>

      <div role="log" aria-label="Mensagens" className="flex grow flex-col gap-2.5 overflow-y-auto px-4 py-3.5">
        {conversation.isError ? (
          <ErrorState title="Não foi possível carregar a conversa" onRetry={() => conversation.refetch()} retrying={conversation.isFetching} />
        ) : !data ? (
          <div aria-busy="true" aria-label="Carregando a conversa" className="flex flex-col gap-2.5">
            <Skeleton className="h-12 w-3/4 self-end rounded-2xl" />
            <Skeleton className="h-16 w-2/3 rounded-2xl" />
            <Skeleton className="h-12 w-3/5 self-end rounded-2xl" />
          </div>
        ) : count === 0 ? (
          <div className="m-auto flex flex-col items-center gap-3 text-center">
            <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <MessageCircle className="size-6" />
            </span>
            <p className="max-w-64 text-sm text-muted-foreground">Mande sua primeira mensagem para o {coachFirst}: dúvidas, dores, fotos da refeição.</p>
          </div>
        ) : (
          chatTimeline(data.messages, now).map((item) =>
            item.type === 'day' ? (
              <p key={item.key} className="my-1 flex h-6 items-center self-center rounded-full bg-card px-3 text-[11px] font-extrabold text-muted-foreground">
                {item.label}
              </p>
            ) : (
              <MessageItem key={item.message.id} message={item.message} />
            ),
          )
        )}
        <div ref={end} />
      </div>

      {data && <Composer coachFirst={coachFirst} />}
    </main>
  )
}
