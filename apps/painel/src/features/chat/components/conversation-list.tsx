import { useState } from 'react'
import { Link } from 'react-router'
import { Search } from 'lucide-react'
import { chatDayLabel, conversationPreview, filterConversations, messageTime, type CoachConversationSummary, type ConversationFilter } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { ConversationAvatar } from './conversation-avatar'

const filters: { id: ConversationFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'groups', label: 'Grupos' },
]

/** "08:32" hoje, "ontem" ou "17/10". */
const when = (iso: string, now: Date) => {
  const day = chatDayLabel(iso, now)
  return day === 'Hoje' ? messageTime(iso) : day === 'Ontem' ? 'ontem' : day
}

export function ConversationList({ conversations, currentId, now }: { conversations: CoachConversationSummary[]; currentId: string | null; now: Date }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ConversationFilter>('all')
  const shown = filterConversations(conversations, query, filter)
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <label className="flex h-11.5 shrink-0 items-center gap-2.5 rounded-full border bg-card px-4 focus-within:ring-3 focus-within:ring-ring/50">
        <Search aria-hidden="true" className="size-4.5 text-muted-foreground" />
        <input type="search" aria-label="Buscar conversa" placeholder="Buscar aluno ou grupo" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 grow bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </label>
      <div role="tablist" aria-label="Filtro de conversas" className="flex shrink-0 gap-1.5">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn('h-9 rounded-full border px-3.5 text-[12.5px] font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', filter === f.id ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul aria-label="Conversas" className="-mx-2 flex min-h-0 flex-col overflow-y-auto">
        {shown.map((c) => {
          const on = c.id === currentId
          return (
            <li key={c.id}>
              <Link
                to={`/chat/${c.id}`}
                aria-current={on ? 'true' : undefined}
                aria-label={`${c.title}${c.unread ? `, ${c.unread} ${c.unread === 1 ? 'não lida' : 'não lidas'}` : ''}`}
                className={cn('flex min-h-18 items-center gap-3 rounded-2xl p-2 outline-none hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50', on && 'bg-primary/12')}
              >
                <ConversationAvatar title={c.title} group={c.kind === 'group'} online={c.online} />
                <span className="flex min-w-0 grow flex-col gap-0.75 border-b border-[#1a1c21] py-1">
                  <span className="flex justify-between gap-2">
                    <span className="truncate text-[15px] font-extrabold">{c.title}</span>
                    {c.last && <span className={cn('text-[11.5px] font-bold whitespace-nowrap', c.unread ? 'text-primary' : 'text-muted-foreground')}>{when(c.last.sentAt, now)}</span>}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn('truncate text-[13px]', c.unread ? 'font-bold text-foreground' : 'text-muted-foreground')}>{conversationPreview(c.last)}</span>
                    {c.unread > 0 && <span className="flex h-5.5 min-w-5.5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11.5px] font-extrabold text-primary-foreground">{c.unread}</span>}
                    {c.awaitingReply && <span className="flex h-5 shrink-0 items-center rounded-full bg-warning/16 px-1.75 text-[10.5px] font-extrabold text-warning">sem resposta</span>}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
        {shown.length === 0 && <li className="m-2 rounded-2xl border border-dashed border-line-strong p-5 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</li>}
      </ul>
    </div>
  )
}
