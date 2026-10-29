import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ChevronLeft, MessageSquare, Moon, Send, StickyNote, UserRound } from 'lucide-react'
import type { CoachConversation, CoachInbox } from '@workspace/core'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useAutoReply, useConversation, useInbox } from '../api/queries'
import { BroadcastDrawer } from '../components/broadcast-drawer'
import { Composer } from '../components/composer'
import { ContextPanel } from '../components/context-panel'
import { ConversationAvatar } from '../components/conversation-avatar'
import { ConversationList } from '../components/conversation-list'
import { MessageList } from '../components/message-list'

const statusLine = (c: CoachConversation) => (c.kind === 'group' ? `Grupo · ${c.group?.memberCount ?? 0} membros` : c.online ? 'Online agora' : 'Aluno')

/** Resposta automática fora do horário (o mesmo interruptor no desktop e no celular). */
function AutoReplySwitch({ inbox, compact }: { inbox: CoachInbox; compact: boolean }) {
  const toggle = useAutoReply()
  const on = inbox.autoReply.enabled
  if (compact)
    return (
      <label className={cn('flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2', on ? 'border-info/40 bg-info/8' : 'bg-card')}>
        <Moon aria-hidden="true" className={cn('size-5 shrink-0', on ? 'text-info' : 'text-muted-foreground')} />
        <span className="flex grow flex-col gap-px">
          <span className="text-[13.5px] font-extrabold">Resposta automática</span>
          <span className="text-[11.5px] text-muted-foreground">{on ? `Ativa fora de ${inbox.autoReply.hours}` : 'Desligada · alunos não recebem aviso'}</span>
        </span>
        <Switch checked={on} onCheckedChange={(v) => toggle.mutate(v)} />
      </label>
    )
  return (
    <label className="flex items-center gap-2.5 text-[13px] font-bold text-foreground-2">
      Resposta automática fora do horário
      <Switch checked={on} onCheckedChange={(v) => toggle.mutate(v)} />
    </label>
  )
}

function ConversationView({ id, desktop }: { id: string; desktop: boolean }) {
  const query = useConversation(id)
  const [ctx, setCtx] = useState(false)
  const now = new Date()
  if (query.isError) return <ErrorState title="Não foi possível abrir a conversa" retrying={query.isFetching} onRetry={() => query.refetch()} />
  const c = query.data
  if (!c) return <Skeleton aria-label="Carregando a conversa" className="h-[60vh] rounded-[20px]" />

  const header = (
    <div className={cn('flex items-center gap-3', !desktop && 'sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur')}>
      {!desktop && (
        <Link to="/chat" aria-label="Voltar para conversas" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
      )}
      <button type="button" disabled={desktop} onClick={() => setCtx(true)} aria-label={desktop ? undefined : `Ver contexto de ${c.title}`} className="flex min-w-0 grow items-center gap-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <ConversationAvatar title={c.title} group={c.kind === 'group'} online={c.online} size="sm" />
        <span className="flex min-w-0 flex-col">
          <h1 className="truncate text-base font-extrabold">{c.title}</h1>
          <span className={cn('text-xs', c.online ? 'text-primary' : 'text-muted-foreground')}>{statusLine(c)}</span>
        </span>
      </button>
      {!desktop && c.studentId && (
        <Link to={`/alunos/${c.studentId}`} aria-label="Abrir perfil do aluno" className={cn(buttonVariants({ variant: 'outline', size: 'icon', className: 'shrink-0 rounded-full border-input' }))}>
          <UserRound aria-hidden="true" />
        </Link>
      )}
    </div>
  )

  return (
    <section aria-label={`Conversa com ${c.title}`} className={cn('flex min-h-0 flex-col gap-3', desktop ? 'h-full' : 'min-h-[calc(100dvh-140px)]')}>
      {header}
      {!desktop && c.notes && (
        <button type="button" onClick={() => setCtx(true)} className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/8 px-3 py-2 text-left text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <StickyNote aria-hidden="true" className="size-4 shrink-0 text-warning" />
          <span className="line-clamp-1 grow">
            <strong>Nota:</strong> {c.notes}
          </span>
          <span className="font-bold text-warning">Ver</span>
        </button>
      )}
      {/* No celular, a última mensagem para acima da caixa de envio e da barra inferior */}
      <MessageList messages={c.messages} now={now} className={cn('grow', desktop ? 'min-h-0 px-1' : '')} endClassName={desktop ? undefined : 'scroll-mb-[230px]'} />
      <div className={cn(!desktop && 'sticky bottom-[calc(96px+env(safe-area-inset-bottom))] rounded-[22px] border bg-background/95 p-2 backdrop-blur')}>
        <Composer key={c.id} conversation={c} />
      </div>
      {!desktop && (
        <Drawer open={ctx} onOpenChange={setCtx}>
          <DrawerContent className="mx-auto max-h-[85dvh] max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
            <DrawerHeader className="pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
              <DrawerTitle className="text-[17px] font-extrabold">{c.kind === 'group' ? 'Sobre o grupo' : 'Contexto do aluno'}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pt-2 pb-5">
              <ContextPanel conversation={c} />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </section>
  )
}

/** /chat e /chat/:conversationId. Desktop: lista, conversa e contexto lado a lado; celular: lista ou conversa. */
export default function ChatPage() {
  const { conversationId = null } = useParams()
  const desktop = useIsDesktop()
  const inbox = useInbox()
  const [broadcast, setBroadcast] = useState(false)
  const now = new Date()
  const data = inbox.data
  const currentId = conversationId ?? (desktop ? (data?.conversations[0]?.id ?? null) : null)
  const current = useConversation(desktop ? currentId : null).data

  if (!desktop && conversationId)
    return (
      <main className="flex flex-col px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[calc(110px+env(safe-area-inset-bottom))]">
        <ConversationView id={conversationId} desktop={false} />
      </main>
    )

  const broadcastButton = (
    <Button onClick={() => setBroadcast(true)} size={desktop ? 'lg' : 'default'} className="font-extrabold">
      <Send aria-hidden="true" />
      {desktop ? 'Nova transmissão' : 'Transmissão'}
    </Button>
  )

  if (!desktop)
    return (
      <main className="flex flex-col gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">
        <header className="flex items-center gap-2.5">
          <h1 className="grow text-2xl font-extrabold tracking-[-0.4px]">Chat</h1>
          {broadcastButton}
        </header>
        {inbox.isError ? (
          <ErrorState title="Não foi possível carregar as conversas" retrying={inbox.isFetching} onRetry={() => inbox.refetch()} />
        ) : !data ? (
          <Skeleton aria-label="Carregando as conversas" className="h-96 rounded-[20px]" />
        ) : (
          <>
            <AutoReplySwitch inbox={data} compact />
            <ConversationList conversations={data.conversations} currentId={null} now={now} />
            <BroadcastDrawer open={broadcast} onOpenChange={setBroadcast} audiences={data.audiences} />
          </>
        )}
      </main>
    )

  return (
    <main className="flex h-dvh flex-col gap-4 px-8 pt-7 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-extrabold tracking-[-0.5px]">Chat</h1>
          <span className="text-[13px] text-muted-foreground">Conversas com alunos, grupos e transmissões</span>
        </div>
        <div className="flex items-center gap-4">
          {data && <AutoReplySwitch inbox={data} compact={false} />}
          {broadcastButton}
        </div>
      </header>
      {data?.autoReply.enabled && (
        <p className="rounded-xl border border-info/40 bg-info/8 px-3.5 py-2 text-[13px] text-foreground-2">
          <strong className="text-info">Ativa:</strong> mensagens recebidas fora de {data.autoReply.hours} recebem “{data.autoReply.text}”
        </p>
      )}
      {inbox.isError ? (
        <ErrorState title="Não foi possível carregar as conversas" retrying={inbox.isFetching} onRetry={() => inbox.refetch()} />
      ) : !data ? (
        <Skeleton aria-label="Carregando as conversas" className="grow rounded-[20px]" />
      ) : (
        <div className="grid min-h-0 grow grid-cols-[320px_minmax(0,1fr)] gap-5 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
          <section aria-label="Lista de conversas" className="flex min-h-0 flex-col">
            <ConversationList conversations={data.conversations} currentId={currentId} now={now} />
          </section>
          <div className="flex min-h-0 flex-col rounded-[22px] border bg-[#111215] p-4">
            {currentId ? (
              <ConversationView key={currentId} id={currentId} desktop />
            ) : (
              <div className="flex grow flex-col items-center justify-center gap-2 text-muted-foreground">
                <MessageSquare aria-hidden="true" className="size-8" />
                Nenhuma conversa ainda.
              </div>
            )}
          </div>
          {current && (
            <aside aria-label="Contexto da conversa" className="hidden min-h-0 overflow-y-auto rounded-[22px] border bg-card p-4 xl:block">
              <ContextPanel conversation={current} />
            </aside>
          )}
        </div>
      )}
      {data && <BroadcastDrawer open={broadcast} onOpenChange={setBroadcast} audiences={data.audiences} />}
    </main>
  )
}
