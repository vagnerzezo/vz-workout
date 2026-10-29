import { useId } from 'react'
import { useSearchParams } from 'react-router'
import { Printer } from 'lucide-react'
import {
  ageOn,
  bmi,
  composition,
  deltaTone,
  fatPercent,
  parseIsoDate,
  protocolFolds,
  shortDate,
  skinfoldSum,
  waistHipRatio,
  type Assessment,
  type Protocol,
  type Skinfolds,
} from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { useStudentAssessments } from '../api/queries'
import { cardClass } from './card'

const protocols: { id: Protocol; param: string; label: string }[] = [
  { id: 'pollock7', param: 'pollock7', label: 'Pollock 7 dobras' },
  { id: 'pollock3', param: 'pollock3', label: 'Pollock 3 dobras' },
  { id: 'bioimpedance', param: 'bioimpedancia', label: 'Bioimpedância' },
]

const foldLabel: Record<keyof Skinfolds, string> = {
  chest: 'Peitoral',
  midaxillary: 'Axilar média',
  triceps: 'Tríceps',
  subscapular: 'Subescapular',
  abdominal: 'Abdominal',
  suprailiac: 'Suprailíaca',
  thigh: 'Coxa',
}

const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const two = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const signed = (n: number, f = num) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f.format(Math.abs(n))}`
const toneClass = { good: 'text-info', bad: 'text-warning', neutral: 'text-muted-foreground' } as const

type Line = { label: string; before: number; after: number; lowerIsBetter: boolean; unit?: string; format?: Intl.NumberFormat }

function CompareTable({ title, unit, lines, dates }: { title: string; unit: string; lines: Line[]; dates: [string, string] }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={cardClass}>
      <div className="flex items-baseline justify-between">
        <h2 id={id} className="text-base font-extrabold">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] tracking-[0.8px] text-muted-foreground">
            <th className="py-1.5 font-extrabold">MEDIDA</th>
            <th className="py-1.5 text-right font-extrabold">{dates[0]}</th>
            <th className="py-1.5 text-right font-extrabold">{dates[1]}</th>
            <th className="py-1.5 text-right font-extrabold">DIF.</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => {
            const f = l.format ?? num
            const d = l.after - l.before
            return (
              <tr key={l.label} className="border-t border-[#22252b]">
                <th scope="row" className="py-2 text-left font-semibold">
                  {l.label}
                </th>
                <td className="py-2 text-right text-foreground-2">{f.format(l.before)}</td>
                <td className="py-2 text-right font-bold">{f.format(l.after)}</td>
                <td className={cn('py-2 text-right font-extrabold', toneClass[deltaTone(d, l.lowerIsBetter)])}>{signed(d, f)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

/** Avaliação física: composição corporal pelo protocolo escolhido, dobras (ou bioimpedância) e perímetros. */
export function AssessmentTab({ studentId }: { studentId: string }) {
  const { data, isError } = useStudentAssessments(studentId)
  const [params, setParams] = useSearchParams()
  if (isError) return <p className="text-sm text-destructive">Não foi possível carregar as avaliações.</p>
  if (!data) return <Skeleton aria-label="Carregando as avaliações" className="h-80 rounded-[20px]" />
  if (data.items.length === 0) {
    return (
      <section className={cn(cardClass, 'items-center py-10 text-center')}>
        <h2 className="text-base font-extrabold">Nenhuma avaliação física</h2>
        <p className="text-sm text-muted-foreground">As avaliações aparecem aqui depois da primeira medição.</p>
      </section>
    )
  }

  const protocol = protocols.find((p) => p.param === params.get('protocolo'))?.id ?? 'pollock7'
  const first: Assessment = data.items[0]!
  const last: Assessment = data.items.at(-1)!
  const dates: [string, string] = [shortDate(parseIsoDate(first.date)), shortDate(parseIsoDate(last.date))]
  const fatOf = (a: Assessment) => fatPercent(protocol, data.sex, ageOn(data.birthDate, parseIsoDate(a.date)), a)
  const fatBefore = fatOf(first)
  const fatAfter = fatOf(last)
  const age = ageOn(data.birthDate, parseIsoDate(last.date))

  const pick = (param: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('protocolo', param)
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const comp: Line[] = [
    { label: 'Peso', before: first.weightKg, after: last.weightKg, lowerIsBetter: true, unit: 'kg' },
    ...(fatBefore !== null && fatAfter !== null
      ? [
          { label: 'Gordura corporal', before: fatBefore, after: fatAfter, lowerIsBetter: true, unit: '%' },
          { label: 'Massa gorda', before: composition(first.weightKg, fatBefore).fatKg, after: composition(last.weightKg, fatAfter).fatKg, lowerIsBetter: true, unit: 'kg' },
          { label: 'Massa magra', before: composition(first.weightKg, fatBefore).leanKg, after: composition(last.weightKg, fatAfter).leanKg, lowerIsBetter: false, unit: 'kg' },
        ]
      : []),
    { label: 'IMC', before: bmi(first.weightKg, first.heightCm), after: bmi(last.weightKg, last.heightCm), lowerIsBetter: true },
    { label: 'Relação cintura-quadril', before: waistHipRatio(first.perimeters.waist, first.perimeters.hips), after: waistHipRatio(last.perimeters.waist, last.perimeters.hips), lowerIsBetter: true, format: two },
  ]

  const skinLines: Line[] | null =
    protocol === 'bioimpedance'
      ? first.bioimpedance && last.bioimpedance
        ? [
            { label: 'Gordura corporal (%)', before: first.bioimpedance.fatPct, after: last.bioimpedance.fatPct, lowerIsBetter: true },
            { label: 'Água corporal (%)', before: first.bioimpedance.waterPct, after: last.bioimpedance.waterPct, lowerIsBetter: false },
            { label: 'Gordura visceral (nível)', before: first.bioimpedance.visceralLevel, after: last.bioimpedance.visceralLevel, lowerIsBetter: true },
            { label: 'Taxa metabólica basal (kcal)', before: first.bioimpedance.bmrKcal, after: last.bioimpedance.bmrKcal, lowerIsBetter: false },
          ]
        : null
      : first.skinfolds && last.skinfolds
        ? [
            ...protocolFolds(protocol, data.sex).map((k) => ({ label: foldLabel[k], before: first.skinfolds![k], after: last.skinfolds![k], lowerIsBetter: true })),
            { label: 'Soma', before: skinfoldSum(first.skinfolds, protocolFolds(protocol, data.sex)), after: skinfoldSum(last.skinfolds, protocolFolds(protocol, data.sex)), lowerIsBetter: true },
          ]
        : null

  const p = last.perimeters
  const q = first.perimeters
  const perimeters: Line[] = [
    { label: 'Cintura', before: q.waist, after: p.waist, lowerIsBetter: true },
    { label: 'Quadril', before: q.hips, after: p.hips, lowerIsBetter: true },
    { label: 'Peito', before: q.chest, after: p.chest, lowerIsBetter: false },
    { label: 'Braço contraído', before: q.arm, after: p.arm, lowerIsBetter: false },
    { label: 'Coxa', before: q.thigh, after: p.thigh, lowerIsBetter: false },
    { label: 'Panturrilha', before: q.calf, after: p.calf, lowerIsBetter: false },
  ]
  const sexWord = data.sex === 'male' ? 'homens' : 'mulheres'
  const formula =
    protocol === 'bioimpedance'
      ? 'Valores registrados manualmente a partir do relatório da balança.'
      : `${protocol === 'pollock7' ? 'Jackson & Pollock 7 dobras' : 'Jackson & Pollock 3 dobras'} para ${sexWord}, idade ${age} · densidade convertida em % de gordura pela equação de Siri.`

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex flex-wrap items-center gap-2.5 print:hidden">
        <div role="radiogroup" aria-label="Protocolo" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {protocols.map((pr) => {
            const on = pr.id === protocol
            return (
              <button
                key={pr.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(pr.param)}
                className={cn(
                  'h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-bold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2',
                )}
              >
                {pr.label}
              </button>
            )
          })}
        </div>
        <div className="hidden grow lg:block" />
        <span className="text-[13px] text-muted-foreground">
          Comparando {dates[0]} → {dates[1]}
        </span>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 font-bold">
          <Printer aria-hidden="true" />
          Gerar PDF
        </Button>
      </div>

      <section aria-label="Composição corporal" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {comp.map((c) => {
          const f = c.format ?? num
          const d = c.after - c.before
          return (
            <div key={c.label} className="flex flex-col gap-1 rounded-2xl border bg-card p-3.5">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <span className="text-lg font-extrabold">
                {f.format(c.after)}
                {c.unit && <span className="ml-0.5 text-[13px] font-bold">{c.unit === '%' ? '%' : ` ${c.unit}`}</span>}
              </span>
              <span className="text-[11.5px] text-muted-foreground">
                antes {f.format(c.before)} · <strong className={toneClass[deltaTone(d, c.lowerIsBetter)]}>{signed(d, f)}{c.unit === '%' ? ' pts' : c.unit ? ` ${c.unit}` : ''}</strong>
              </span>
            </div>
          )
        })}
      </section>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="flex flex-col gap-2">
          {skinLines ? (
            <CompareTable
              title={protocol === 'bioimpedance' ? 'Bioimpedância' : protocol === 'pollock7' ? 'Dobras cutâneas (7)' : 'Dobras cutâneas (3)'}
              unit={protocol === 'bioimpedance' ? 'valores do aparelho' : 'mm'}
              lines={skinLines}
              dates={dates}
            />
          ) : (
            <p className={cn(cardClass, 'text-sm text-muted-foreground')}>Este protocolo não foi medido nessas avaliações.</p>
          )}
          <p className="px-1 text-[11.5px] leading-[1.45] text-muted-foreground">{formula}</p>
        </div>
        <CompareTable title="Perímetros" unit="cm" lines={perimeters} dates={dates} />
      </div>
    </div>
  )
}
