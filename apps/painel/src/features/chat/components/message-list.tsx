import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { BookOpen, ChevronRight, ClipboardCheck, Image, PencilLine, Play, Trophy, Utensils, Video } from 'lucide-react'
import { audioDuration, chatTimeline, messageTime, type CoachMessage } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

const events = {
  workout: { icon: Trophy, tone: 'bg-warning/16 text-warning' },
  checkIn: { icon: ClipboardCheck, tone: 'bg-info/16 text-info' },
  plan: { icon: PencilLine, tone: 'bg-primary/14 text-primary' },
  diet: { icon: Utensils, tone: 'bg-fat/16 text-fat' },
  exercise: { icon: BookOpen, tone: 'bg-violet/16 text-violet' },
}
const statusText = { sent: 'Enviada', delivered: 'Entregue', read: 'Lida' } as const

/** Ondas do áudio (decorativas), sempre iguais para a mesma mensagem. */
const wave = (seed: string) => Array.from({ length: 22 }, (_, i) => 5 + Math.round(Math.abs(Math.sin(i * 1.7 + seed.length)) * 17))

function Bubble({ m }: { m: CoachMessage }) {
  const mine = m.from === 'coach'
  const b = m.body
  let content
  if (b.type === 'audio')
    content = (
      <span className="flex items-center gap-2.5 px-3 py-2.5">
        {/* Sem arquivo na API simulada: o play fica só como indicação */}
        <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', mine ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground')}>
          <Play className="size-3.5 fill-current" />
        </span>
        <span aria-hidden="true" className="flex h-6 items-center gap-0.5">
          {wave(m.id).map((h, i) => (
            <span key={i} className={cn('w-0.75 rounded-full', mine ? 'bg-black/55' : 'bg-muted-foreground')} style={{ height: h }} />
          ))}
        </span>
        <span className="text-xs font-bold">Áudio {audioDuration(b.durationSec)}</span>
      </span>
    )
  else if (b.type === 'image' || b.type === 'video') {
    const Icon = b.type === 'image' ? Image : Video
    content = (
      <span className="flex h-36 w-52 flex-col items-center justify-center gap-1.5 bg-sunken text-xs text-muted-foreground">
        <Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
        {b.type === 'image' ? 'Foto' : 'Vídeo'}
      </span>
    )
  } else if (b.type === 'text') content = <span className="block px-3.5 py-2.5 whitespace-pre-line">{b.text}</span>
  return (
    <div className={cn('flex max-w-[80%] flex-col gap-0.75', mine ? 'self-end items-end' : 'self-start items-start')}>
      {m.author && <span className="px-1 text-[11.5px] font-extrabold text-violet">{m.author}</span>}
      <div className={cn('overflow-hidden text-sm leading-[1.45]', mine ? 'rounded-[18px_18px_4px_18px] bg-primary text-primary-foreground' : 'rounded-[18px_18px_18px_4px] bg-secondary')}>{content}</div>
      <span className="px-1 text-[11px] text-muted-foreground">
        {messageTime(m.sentAt)}
        {mine && m.status && ` · ${statusText[m.status]}`}
      </span>
    </div>
  )
}

/** Mensagens com o separador de dia; rola para a última quando chega coisa nova. */
export function MessageList({ messages, now, className, endClassName }: { messages: CoachMessage[]; now: Date; className?: string; endClassName?: string }) {
  const end = useRef<HTMLDivElement>(null)
  const last = messages.at(-1)?.id
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' })
  }, [last])
  return (
    <div role="log" aria-live="polite" aria-label="Mensagens" className={cn('flex flex-col gap-2.5 overflow-y-auto', className)}>
      {chatTimeline(messages, now).map((item) => {
        if (item.type === 'day')
          return (
            <span key={item.key} className="self-center rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-muted-foreground">
              {item.label}
            </span>
          )
        const m = item.message
        if (m.body.type === 'event') {
          const { icon: Icon, tone } = events[m.body.event]
          return (
            <Link key={m.id} to={m.body.link} className="flex items-center gap-2.5 self-stretch rounded-[14px] border bg-sunken px-3 py-2.5 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 lg:self-center lg:min-w-[60%]">
              <span aria-hidden="true" className={cn('flex size-8.5 shrink-0 items-center justify-center rounded-[10px]', tone)}>
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <span className="flex min-w-0 grow flex-col gap-px">
                <span className="text-[13px] font-extrabold">{m.body.title}</span>
                <span className="text-xs text-muted-foreground">{m.body.meta}</span>
              </span>
              <span className="text-[11px] text-muted-foreground">{messageTime(m.sentAt)}</span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        }
        return <Bubble key={m.id} m={m} />
      })}
      <div ref={end} className={endClassName} />
    </div>
  )
}
