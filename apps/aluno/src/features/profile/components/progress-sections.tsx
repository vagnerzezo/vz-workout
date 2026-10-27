import { useId, useState } from 'react'
import type { Measurement, ProgressPhoto, StudentProgress, WeightEntry } from '@workspace/core'
import {
  chartY,
  estimatedOneRepMax,
  formatDecimal,
  formatDeltaKg,
  formatKg,
  linePoints,
  loadGain,
  measurementRows,
  parseIsoDate,
  shortDate,
  weeklyBestLoads,
  weightDomain,
  weightWindow,
} from '@workspace/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { cn } from '@workspace/ui/lib/utils'
import { SurfaceCard } from '../../../shared/components/surface-card'

const short = (iso: string) => shortDate(parseIsoDate(iso))
const cm = (n: number) => formatKg(n) // mesma formatação: 37 → "37", 38.5 → "38,5"

type Chip<T> = { value: T; label: string }

/** Escolha única em forma de chips: rádios nativos, então Tab e setas funcionam sozinhos. */
function ChipGroup<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  className,
}: {
  legend: string
  options: Chip<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  const name = useId()
  return (
    <fieldset className={cn('flex flex-wrap gap-1.5', className)}>
      <legend className="sr-only">{legend}</legend>
      {options.map((o) => {
        const on = o.value === value
        return (
          <label
            key={o.value}
            className={cn(
              'flex h-8 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
              on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2 hover:bg-accent',
            )}
          >
            <input type="radio" name={name} className="sr-only" checked={on} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        )
      })}
    </fieldset>
  )
}

const W = 318
const H = 170

export function WeightChartCard({ weights, goalKg, today }: { weights: WeightEntry[]; goalKg: number | null; today: Date }) {
  const [days, setDays] = useState<30 | 90>(90)
  const series = weightWindow(weights, days, today)
  const last = weights.at(-1)

  return (
    <SurfaceCard role="region" aria-labelledby="peso-titulo" id="peso" className="scroll-mt-4 gap-3.5 rounded-[22px] p-4.5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="peso-titulo" className="text-[15px] font-bold">
          Peso
        </h2>
        <ChipGroup
          legend="Período do peso"
          value={days}
          onChange={setDays}
          options={[
            { value: 30, label: '30 dias' },
            { value: 90, label: '90 dias' },
          ]}
        />
      </div>

      {!last ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Registre seu peso no Perfil para acompanhar a evolução aqui.</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold tracking-[-0.6px]">{formatDecimal(last.kg)} kg</span>
            {series.length > 1 && (
              <span className="text-sm font-extrabold text-primary">
                {formatDeltaKg(Math.round((series.at(-1)!.kg - series[0]!.kg) * 10) / 10)} kg em {days} dias
              </span>
            )}
          </div>
          {series.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma pesagem nos últimos {days} dias.</p>
          ) : (
            <WeightChart series={series} goalKg={goalKg} />
          )}
        </>
      )}
    </SurfaceCard>
  )
}

function WeightChart({ series, goalKg }: { series: WeightEntry[]; goalKg: number | null }) {
  const [min, max] = weightDomain(
    series.map((e) => e.kg),
    goalKg,
  )
  const box = { width: W, height: H, padX: 8, padY: 10, min, max }
  const points = linePoints(
    series.map((e) => e.kg),
    box,
  )
  const first = series[0]!
  const last = series.at(-1)!
  const label =
    series.length === 1
      ? `Peso de ${formatDecimal(last.kg)} kg em ${short(last.date)}`
      : `Peso de ${formatDecimal(first.kg)} a ${formatDecimal(last.kg)} kg entre ${short(first.date)} e ${short(last.date)}`
  const goalY = goalKg !== null ? chartY(goalKg, box) : null

  return (
    <div className="flex flex-col gap-1.5">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={goalKg ? `${label}. Meta de ${formatKg(goalKg)} kg` : label} className="h-auto w-full overflow-visible">
        {goalY !== null && (
          <>
            <line x1={0} x2={W} y1={goalY} y2={goalY} className="stroke-muted-foreground/70" strokeWidth={1} strokeDasharray="4 4" />
            <text x={W} y={goalY - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">
              Meta {formatKg(goalKg!)} kg
            </text>
          </>
        )}
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          className="stroke-primary"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => {
          const isLast = i === points.length - 1
          return <circle key={i} cx={p.x} cy={p.y} r={isLast ? 5 : 3} className={cn('stroke-primary', isLast ? 'fill-primary' : 'fill-card')} strokeWidth={2} />
        })}
      </svg>
      <div aria-hidden="true" className="flex justify-between text-xs text-muted-foreground">
        <span>{short(first.date)}</span>
        <span>{short(last.date)}</span>
      </div>
    </div>
  )
}

const WEEKS = 8

export function LoadProgressCard({ lifts, today }: { lifts: StudentProgress['lifts']; today: Date }) {
  const [selected, setSelected] = useState(lifts[0]?.exerciseId ?? '')
  const lift = lifts.find((l) => l.exerciseId === selected) ?? lifts[0]
  if (!lift) return null

  const weeks = weeklyBestLoads(lift.sets, WEEKS, today)
  const lastSet = weeks.findLast((w) => w.set)?.set ?? null
  const gain = loadGain(weeks)
  const maxKg = Math.max(0, ...weeks.map((w) => w.set?.kg ?? 0))
  const lastDoneIndex = weeks.findLastIndex((w) => w.set)

  return (
    <SurfaceCard role="region" aria-labelledby="carga-titulo" id="carga" className="scroll-mt-4 gap-3.5 rounded-[22px] p-4.5">
      <h2 id="carga-titulo" className="text-[15px] font-bold">
        Progressão de carga
      </h2>
      <ChipGroup
        legend="Exercício"
        value={lift.exerciseId}
        onChange={setSelected}
        options={lifts.map((l) => ({ value: l.exerciseId, label: l.name }))}
        className="[&_label]:h-9 [&_label]:text-[13px] [&_label]:font-bold"
      />

      <dl className="grid grid-cols-3 gap-2">
        <div className="flex flex-col-reverse gap-0.5">
          <dt className="text-xs text-muted-foreground">Melhor série</dt>
          <dd className="text-[17px] font-extrabold">{lastSet ? `${formatKg(lastSet.kg)} kg × ${lastSet.reps}` : '—'}</dd>
        </div>
        <div className="flex flex-col-reverse gap-0.5">
          <dt className="text-xs text-muted-foreground">1RM estimado</dt>
          <dd className="text-[17px] font-extrabold">{lastSet ? `${Math.round(estimatedOneRepMax(lastSet.kg, lastSet.reps))} kg` : '—'}</dd>
        </div>
        <div className="flex flex-col-reverse gap-0.5">
          <dt className="text-xs text-muted-foreground">Em {WEEKS} semanas</dt>
          <dd className="text-[17px] font-extrabold text-primary">{gain === null ? '—' : `${gain >= 0 ? '+' : '−'}${formatKg(Math.abs(gain))} kg`}</dd>
        </div>
      </dl>

      <ol
        aria-label={`Carga da melhor série por semana: ${weeks.map((w) => `${w.label} ${w.set ? `${formatKg(w.set.kg)} kg` : 'sem treino'}`).join(', ')}`}
        className="flex h-37.5 items-end gap-2"
      >
        {weeks.map((w, i) => {
          const highlight = i === lastDoneIndex
          return (
            <li key={w.weekStart} aria-hidden="true" className="flex h-full grow basis-0 flex-col items-center justify-end gap-1.5">
              <span className={cn('text-[11px] font-bold', highlight ? 'text-foreground' : 'text-muted-foreground')}>{w.set ? formatKg(w.set.kg) : '—'}</span>
              <span
                className={cn('w-full rounded-md', highlight ? 'bg-primary' : 'bg-line-strong/70')}
                style={{ height: w.set && maxKg ? `${Math.round((w.set.kg / maxKg) * 100)}px` : '4px' }}
              />
              <span className="text-[11px] text-muted-foreground">{w.label}</span>
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-muted-foreground">Carga da melhor série válida por semana, em kg</p>
    </SurfaceCard>
  )
}

export function MeasurementsCard({ measurements }: { measurements: Measurement[] }) {
  const before = measurements[0]
  const after = measurements.at(-1)
  return (
    <SurfaceCard role="region" aria-labelledby="medidas-titulo" id="medidas" className="scroll-mt-4 gap-3 rounded-[22px] p-4.5">
      <div className="flex items-baseline justify-between">
        <h2 id="medidas-titulo" className="text-[15px] font-bold">
          Medidas
        </h2>
        {before && after && before !== after && (
          <span className="text-xs text-muted-foreground">
            {short(before.date)} → {short(after.date)}, em cm
          </span>
        )}
      </div>
      {!before || !after || before === after ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {before ? 'A comparação aparece depois do próximo check-in.' : 'Suas medidas aparecem aqui depois do primeiro check-in.'}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-[11px] font-extrabold tracking-[0.8px] text-muted-foreground">
              <th scope="col" className="pb-1.5 text-left font-extrabold">
                MEDIDA
              </th>
              <th scope="col" className="w-14 pb-1.5 text-right font-extrabold">
                ANTES
              </th>
              <th scope="col" className="w-14 pb-1.5 text-right font-extrabold">
                AGORA
              </th>
              <th scope="col" className="w-15 pb-1.5 text-right font-extrabold">
                <abbr title="Diferença" className="no-underline">
                  DIF.
                </abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {measurementRows(before, after).map((r) => (
              <tr key={r.key} className="h-8">
                <th scope="row" className="text-left font-normal text-foreground-2">
                  {r.label}
                </th>
                <td className="text-right text-muted-foreground">{cm(r.before)}</td>
                <td className="text-right font-extrabold">{cm(r.after)}</td>
                <td className={cn('text-right font-extrabold', r.diff < 0 ? 'text-info' : 'text-primary')}>
                  {r.diff === 0 ? '0' : `${r.diff > 0 ? '+' : '−'}${cm(Math.abs(r.diff))}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SurfaceCard>
  )
}

const poses = [
  { value: 'front', label: 'Frente' },
  { value: 'side', label: 'Lado' },
  { value: 'back', label: 'Costas' },
] as const

const segment =
  'h-10 rounded-[10px] text-[13px] font-extrabold text-foreground data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground'

export function PhotosCard({ photos }: { photos: ProgressPhoto[] }) {
  const dates = [...new Set(photos.map((p) => p.date))].sort()
  const latest = dates.at(-1)
  const older = dates.slice(0, -1)
  const [compareWith, setCompareWith] = useState(older[0] ?? '')

  return (
    <SurfaceCard role="region" aria-labelledby="fotos-titulo" id="fotos" className="scroll-mt-4 gap-3.5 rounded-[22px] p-4.5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="fotos-titulo" className="text-[15px] font-bold">
          Fotos de evolução
        </h2>
        <span className="text-right text-xs text-muted-foreground">Visível só para você e o treinador</span>
      </div>

      {!latest || older.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {latest ? 'A comparação aparece depois do próximo check-in com fotos.' : 'As fotos dos seus check-ins aparecem aqui.'}
        </p>
      ) : (
        <>
          <Tabs defaultValue="front" className="gap-3.5">
            <TabsList aria-label="Ângulo" className="grid h-auto w-full grid-cols-3 gap-1 rounded-[14px] border bg-sunken p-1 group-data-horizontal/tabs:h-auto">
              {poses.map((p) => (
                <TabsTrigger key={p.value} value={p.value} className={segment}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {poses.map((p) => {
              const find = (date: string) => photos.find((x) => x.date === date && x.pose === p.value)
              return (
                <TabsContent key={p.value} value={p.value} className="grid grid-cols-2 gap-2.5">
                  <PhotoFigure photo={find(compareWith)} date={compareWith} when="Antes" pose={p.label} />
                  <PhotoFigure photo={find(latest)} date={latest} when="Agora" pose={p.label} highlight />
                </TabsContent>
              )
            })}
          </Tabs>
          <div className="flex flex-col gap-2">
            <span aria-hidden="true" className="text-xs font-bold text-muted-foreground">
              Comparar com
            </span>
            <ChipGroup
              legend="Comparar com"
              value={compareWith}
              onChange={setCompareWith}
              options={older.map((d) => ({ value: d, label: short(d) }))}
              className="grid grid-cols-3 gap-2 [&_label]:h-10 [&_label]:rounded-xl [&_label]:text-[13px]"
            />
          </div>
        </>
      )}
    </SurfaceCard>
  )
}

function PhotoFigure({ photo, date, when, pose, highlight }: { photo?: ProgressPhoto; date: string; when: string; pose: string; highlight?: boolean }) {
  const alt = `${when}: ${pose.toLowerCase()}, ${short(date)}`
  return (
    <figure className="flex flex-col gap-2">
      <div
        className={cn(
          'relative flex h-55 items-center justify-center overflow-hidden rounded-2xl bg-secondary',
          highlight ? 'border-2 border-primary' : 'border border-line-strong/60',
        )}
      >
        {photo?.url ? (
          <img src={photo.url} alt={alt} loading="lazy" width={180} height={220} className="size-full object-cover" />
        ) : (
          <svg width="90" height="170" viewBox="0 0 90 170" role="img" aria-label={`${alt} (foto indisponível)`}>
            <circle cx="45" cy="22" r="16" className={highlight ? 'fill-line-strong' : 'fill-line-strong/60'} />
            <path d="M19 52c0-8 6-14 14-14h24c8 0 14 6 14 14v48H59v66H31v-66H19z" className={highlight ? 'fill-line-strong' : 'fill-line-strong/60'} />
          </svg>
        )}
        {photo?.weightKg && (
          <span
            className={cn(
              'absolute top-2 left-2 flex h-6 items-center rounded-full px-2 text-[11px] font-extrabold',
              highlight ? 'bg-primary text-primary-foreground' : 'bg-background/80',
            )}
          >
            {formatDecimal(photo.weightKg)} kg
          </span>
        )}
      </div>
      <figcaption className="text-center text-xs text-muted-foreground">
        {when} · {short(date)}
      </figcaption>
    </figure>
  )
}
