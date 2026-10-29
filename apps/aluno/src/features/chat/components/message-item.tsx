import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { BookOpen, ChevronRight, ClipboardCheck, Pause, PencilLine, Play, Trophy, Utensils } from 'lucide-react'
import type { Message } from '@workspace/core'
import { audioDuration, messageTime } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { PENDING } from '../api/queries'

const events = {
  workout: { icon: Trophy, tone: 'bg-warning/16 text-warning' },
  checkIn: { icon: ClipboardCheck, tone: 'bg-info/16 text-info' },
  plan: { icon: PencilLine, tone: 'bg-primary/14 text-primary' },
  diet: { icon: Utensils, tone: 'bg-fat/16 text-fat' },
  exercise: { icon: BookOpen, tone: 'bg-violet/16 text-violet' },
}

const statusText = (m: Message) => (m.id.startsWith(PENDING) ? 'Enviando…' : m.status === 'read' ? 'Lida' : 'Enviada')

export function MessageItem({ message: m }: { message: Message }) {
  const { body } = m

  if (body.type === 'event') {
    const { icon: Icon, tone } = events[body.event]
    return (
      <Link
        to={body.link}
        className="flex items-center gap-2.5 self-stretch rounded-[14px] border bg-sunken px-3 py-2.5 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span aria-hidden="true" className={cn('flex size-8.5 shrink-0 items-center justify-center rounded-[10px]', tone)}>
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 grow flex-col gap-px">
          <span className="text-[13px] font-extrabold">{body.title}</span>
          <span className="text-xs text-muted-foreground">{body.meta}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.2} />
      </Link>
    )
  }

  const mine = m.from === 'student'
  return (
    <div className={cn('flex flex-col gap-0.75', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[80%] overflow-hidden text-sm leading-[1.45]',
          mine ? 'rounded-[16px_16px_4px_16px] bg-primary text-primary-foreground' : 'rounded-[16px_16px_16px_4px] bg-secondary',
          body.type === 'text' || body.type === 'audio' ? 'px-3.25 py-2.5' : 'p-1',
        )}
      >
        <span className="sr-only">{mine ? 'Você: ' : 'Treinador: '}</span>
        {body.type === 'text' && <p className="whitespace-pre-wrap">{body.text}</p>}
        {body.type === 'audio' && <AudioMessage url={body.url} durationSec={body.durationSec} mine={mine} />}
        {body.type === 'image' &&
          (body.url ? (
            <img src={body.url} alt="Foto enviada" loading="lazy" className="max-h-72 rounded-xl object-cover" />
          ) : (
            <span className="block px-2 py-1.5">Foto</span>
          ))}
        {body.type === 'video' &&
          (body.url ? (
            <video src={body.url} controls preload="metadata" className="max-h-72 rounded-xl" aria-label="Vídeo enviado" />
          ) : (
            <span className="block px-2 py-1.5">Vídeo</span>
          ))}
      </div>
      <span className="px-1 text-[11px] text-muted-foreground">
        <time dateTime={m.sentAt}>{messageTime(m.sentAt)}</time>
        {mine && ` · ${statusText(m)}`}
      </span>
    </div>
  )
}

/** Barras fixas (não é a forma real do som): só para o áudio parecer áudio. */
const wave = Array.from({ length: 20 }, (_, i) => 5 + Math.round(Math.abs(Math.sin(i * 1.9 + 1)) * 17))

function AudioMessage({ url, durationSec, mine }: { url: string | null; durationSec: number; mine: boolean }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const length = audioDuration(durationSec)

  const toggle = () => {
    const el = audio.current
    if (!el) return
    if (el.paused) void el.play().catch(() => setPlaying(false))
    else el.pause()
  }

  return (
    <div className="flex min-w-47.5 items-center gap-2">
      {url && <audio ref={audio} src={url} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={url ? `${playing ? 'Pausar' : 'Ouvir'} áudio de ${length}` : `Áudio de ${length} (indisponível)`}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60',
          mine ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground',
        )}
      >
        {playing ? <Pause aria-hidden="true" className="size-3" fill="currentColor" /> : <Play aria-hidden="true" className="size-3" fill="currentColor" />}
      </button>
      <span aria-hidden="true" className="flex h-6 grow items-center gap-0.5">
        {wave.map((h, i) => (
          <span key={i} className={cn('w-0.75 rounded-full', mine ? 'bg-primary-foreground/55' : 'bg-muted-foreground')} style={{ height: h }} />
        ))}
      </span>
      <span className="text-xs font-bold">{length}</span>
    </div>
  )
}
