import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatKg, muscleLabel, phaseLabel, volumeAlerts, volumeTone, VOLUME_MUSCLES, type Muscle, type Phase } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { cardClass } from '../../student-profile/components/card'

const SCALE = 28 // a barra cheia; a faixa de referência (10 a 20) fica entre 35,7% e 71,4%
const barColor = { ok: 'bg-primary', warning: 'bg-warning', danger: 'bg-destructive' } as const
const textColor = { ok: 'text-primary', warning: 'text-warning', danger: 'text-destructive', info: 'text-info' } as const
const dotColor = { ok: 'bg-primary', warning: 'bg-warning', danger: 'bg-destructive', info: 'bg-info' } as const

type VolumeProps = { volume: Map<Muscle, number>; phase: Phase }

const musclesOf = (volume: Map<Muscle, number>): Muscle[] => [...VOLUME_MUSCLES, ...((volume.get('core') ?? 0) > 0 ? (['core'] as const) : [])]

function Bars({ volume }: { volume: Map<Muscle, number> }) {
  return (
    <ul aria-label="Séries por músculo" className="flex flex-col gap-2">
      {musclesOf(volume).map((m) => {
        const n = volume.get(m) ?? 0
        const tone = volumeTone(n)
        return (
          <li key={m} className="grid grid-cols-[96px_minmax(0,1fr)_34px] items-center gap-2">
            <span className="text-xs text-foreground-2">{muscleLabel[m]}</span>
            <span aria-hidden="true" className="relative h-3 overflow-hidden rounded-md bg-secondary">
              <span className="absolute inset-y-0 left-[35.7%] w-[35.7%] border-x border-dashed border-[#5a606a] bg-white/7" />
              <span className={cn('relative block h-3 rounded-md', barColor[tone])} style={{ width: `${Math.min((n / SCALE) * 100, 100).toFixed(1)}%` }} />
            </span>
            <span className={cn('text-right text-[13px] font-extrabold', textColor[tone])}>{formatKg(n)}</span>
          </li>
        )
      })}
    </ul>
  )
}

function Alerts({ volume, phase }: VolumeProps) {
  const alerts = volumeAlerts(volume, musclesOf(volume), phase.id)
  return (
    <section aria-labelledby="alertas-ficha" className={cn(cardClass, 'gap-2.5')}>
      <h2 id="alertas-ficha" className="text-[15px] font-extrabold">
        Alertas
      </h2>
      {alerts.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Todos os músculos dentro da faixa de referência.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {alerts.map((a) => (
            <li key={a.muscle ?? 'fase'} className="flex items-start gap-2.5 text-[13px] leading-[1.4]">
              <span aria-hidden="true" className={cn('mt-1.5 size-2 shrink-0 rounded-full', dotColor[a.tone])} />
              <span className="text-foreground-2">
                <strong className="text-foreground">{a.muscle ? muscleLabel[a.muscle] : 'Deload:'}</strong> {a.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Desktop: coluna da direita com as barras e os alertas. */
export function VolumeAside({ volume, phase }: VolumeProps) {
  return (
    <aside aria-label="Volume semanal" className="flex flex-col gap-4">
      <section aria-labelledby="volume-semanal" className={cn(cardClass, 'gap-3')}>
        <div className="flex flex-col gap-0.5">
          <h2 id="volume-semanal" className="text-[15px] font-extrabold">
            Volume semanal por músculo
          </h2>
          <span className="text-xs text-muted-foreground">Séries válidas na fase {phaseLabel[phase.id]} · principal 1, secundário 0,5</span>
        </div>
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span aria-hidden="true" className="h-2 w-4.5 rounded-xs border border-dashed border-[#5a606a] bg-white/8" />
          faixa de referência: 10 a 20 séries
        </span>
        <Bars volume={volume} />
      </section>
      <Alerts volume={volume} phase={phase} />
    </aside>
  )
}

/** Celular: fechado mostra o resumo ("2 abaixo, 1 acima"); aberto, as barras. */
export function VolumeCollapsible({ volume, phase }: VolumeProps) {
  const [open, setOpen] = useState(false)
  const counts = musclesOf(volume).map((m) => volume.get(m) ?? 0)
  const low = counts.filter((n) => n < 10).length
  const high = counts.filter((n) => n > 20).length
  const summary = phase.id === 'deload' ? 'Deload: volume reduzido de propósito' : low + high === 0 ? 'Todos na faixa de 10 a 20' : [low && `${low} abaixo`, high && `${high} acima`].filter(Boolean).join(' · ') + ' da faixa'
  return (
    <section aria-label="Volume semanal" className="rounded-[18px] border bg-card">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-full', low + high === 0 || phase.id === 'deload' ? 'bg-primary' : 'bg-warning')} />
        <span className="flex grow flex-col">
          <span className="text-sm font-extrabold">Volume semanal por músculo</span>
          <span className="text-xs text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown aria-hidden="true" className={cn('size-4.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-[#22252b] p-3.5">
          <Bars volume={volume} />
          <span className="text-[11px] text-muted-foreground">Faixa clara = 10 a 20 séries válidas por semana · principal 1, secundário 0,5</span>
        </div>
      )}
    </section>
  )
}
