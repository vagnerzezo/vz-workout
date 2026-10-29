import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ACTIVITY_FACTORS, CalorieMode, calorieModes, formatDecimal, formatInt, templateTargets, type DietTemplate } from '@workspace/core'
import { Stepper } from '@workspace/ui/blocks/stepper'
import { cn } from '@workspace/ui/lib/utils'
import { MacroBar } from '../../diets/components/diet-card'

export type TargetsPatch = Partial<Pick<DietTemplate, 'activityFactor' | 'calorieMode' | 'manualKcal' | 'proteinPerKg' | 'fatPerKg'>>
type TargetsProps = { template: DietTemplate; onPatch: (p: TargetsPatch) => void }

const radio = (on: boolean) =>
  cn('flex shrink-0 flex-col items-start gap-0.5 rounded-xl border px-2.5 py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/12 text-primary' : 'border-input text-foreground-2')
const comma = (n: number) => String(n).replace('.', ',')

function Reference({ template: t }: { template: DietTemplate }) {
  const r = t.reference
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
      <div className="flex gap-1">
        <dt>Peso</dt>
        <dd className="font-extrabold text-foreground">{formatDecimal(r.weightKg)} kg</dd>
      </div>
      <div className="flex gap-1">
        <dt>Altura</dt>
        <dd className="font-extrabold text-foreground">{r.heightCm} cm</dd>
      </div>
      <div className="flex gap-1">
        <dt>Idade</dt>
        <dd className="font-extrabold text-foreground">{r.age}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Sexo</dt>
        <dd className="font-extrabold text-foreground">{r.sex === 'male' ? 'masculino' : 'feminino'}</dd>
      </div>
    </dl>
  )
}

function Factors({ template: t, onPatch }: TargetsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-foreground-2">Nível de atividade</span>
      <div role="radiogroup" aria-label="Fator de atividade" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {ACTIVITY_FACTORS.map((f) => (
          <button key={f.value} type="button" role="radio" aria-checked={t.activityFactor === f.value} onClick={() => onPatch({ activityFactor: f.value })} className={radio(t.activityFactor === f.value)}>
            <span className="text-xs font-extrabold">{f.label}</span>
            <span className="text-[11px] text-muted-foreground">×{comma(f.value)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Goal({ template: t, onPatch }: TargetsProps) {
  const { targets } = templateTargets(t)
  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label="Objetivo calórico" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {CalorieMode.options.map((m) => {
          const on = t.calorieMode === m
          const label = m === 'manual' && t.manualKcal ? `Manual: ${formatInt(t.manualKcal)}` : calorieModes[m].label
          return (
            <button key={m} type="button" role="radio" aria-checked={on} onClick={() => onPatch(m === 'manual' ? { calorieMode: m, manualKcal: t.manualKcal ?? targets.kcal } : { calorieMode: m })} className={cn(radio(on), 'h-9 justify-center text-xs font-extrabold')}>
              {label}
            </button>
          )
        })}
      </div>
      {t.calorieMode === 'manual' && (
        <label className="flex items-center gap-2 text-xs font-bold text-foreground-2">
          Meta manual
          <input
            type="number"
            inputMode="numeric"
            min={800}
            max={6000}
            step={10}
            value={t.manualKcal ?? ''}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (v > 0) onPatch({ manualKcal: v })
            }}
            className="h-9 w-24 rounded-lg border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          kcal
        </label>
      )}
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-extrabold tracking-[-0.5px]">{formatInt(targets.kcal)}</span>
        <span className="text-xs text-muted-foreground">kcal por dia · {calorieModes[t.calorieMode].note}</span>
      </div>
    </div>
  )
}

function MacroControls({ template: t, onPatch }: TargetsProps) {
  const { targets } = templateTargets(t)
  const row = (label: string, value: number, grams: number, min: number, max: number, key: 'proteinPerKg' | 'fatPerKg', color: string) => (
    <div className="grid grid-cols-[84px_minmax(0,1fr)_56px] items-center gap-2">
      <span className={cn('text-[13px] font-bold', color)}>{label}</span>
      <Stepper label={`${label} em gramas por quilo`} value={value} min={min} max={max} step={0.1} format={(v) => `${comma(Math.round(v * 10) / 10)} g/kg`} onChange={(v) => onPatch({ [key]: Math.round(v * 10) / 10 })} />
      <span className="text-right text-sm font-extrabold">{grams} g</span>
    </div>
  )
  return (
    <div className="flex flex-col gap-2">
      {row('Proteína', t.proteinPerKg, targets.protein, 1.2, 3, 'proteinPerKg', 'text-protein')}
      {row('Gordura', t.fatPerKg, targets.fat, 0.5, 1.5, 'fatPerKg', 'text-fat')}
      <div className="grid grid-cols-[84px_minmax(0,1fr)_56px] items-center gap-2">
        <span className="text-[13px] font-bold text-carb">Carboidrato</span>
        <span className="text-xs text-muted-foreground">restante da meta</span>
        <span className="text-right text-sm font-extrabold">{targets.carbs} g</span>
      </div>
      <MacroBar macros={targets} />
    </div>
  )
}

const card = 'flex flex-col gap-3 rounded-[20px] border bg-card p-4'

/** Desktop: gasto energético, meta calórica e macros lado a lado (como no canvas). */
export function TargetsDesktop(props: TargetsProps) {
  const { bmr, total } = templateTargets(props.template)
  return (
    <section aria-label="Cálculo das metas" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className={card}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-extrabold">Gasto energético</h2>
          <span className="text-xs text-muted-foreground">Mifflin-St Jeor</span>
        </div>
        <Reference template={props.template} />
        <Factors {...props} />
        <dl className="grid grid-cols-2 gap-2">
          <div className="flex flex-col rounded-xl bg-secondary px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">Taxa metabólica basal</dt>
            <dd className="text-base font-extrabold">{formatInt(Math.round(bmr))} kcal</dd>
          </div>
          <div className="flex flex-col rounded-xl bg-secondary px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">Gasto total estimado</dt>
            <dd className="text-base font-extrabold">{formatInt(Math.round(total))} kcal</dd>
          </div>
        </dl>
      </div>
      <div className={card}>
        <h2 className="text-[15px] font-extrabold">Meta calórica</h2>
        <Goal {...props} />
      </div>
      <div className={card}>
        <h2 className="text-[15px] font-extrabold">Macronutrientes</h2>
        <MacroControls {...props} />
      </div>
    </section>
  )
}

/** Celular: "Metas e cálculo" recolhido, com o resumo das metas. */
export function TargetsMobile(props: TargetsProps) {
  const [open, setOpen] = useState(false)
  const { bmr, total, targets } = templateTargets(props.template)
  return (
    <section aria-label="Metas da dieta" className="rounded-[18px] border bg-card">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="flex grow flex-col">
          <span className="text-sm font-extrabold">Metas e cálculo</span>
          <span className="text-xs text-muted-foreground">
            {formatInt(targets.kcal)} kcal · P {targets.protein} · C {targets.carbs} · G {targets.fat}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className={cn('size-4.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="flex flex-col gap-4 border-t border-[#22252b] p-3.5">
          <Reference template={props.template} />
          <dl className="grid grid-cols-2 gap-2">
            <div className="flex flex-col rounded-xl bg-secondary px-3 py-2">
              <dt className="text-[11px] text-muted-foreground">Basal (Mifflin-St Jeor)</dt>
              <dd className="text-base font-extrabold">{formatInt(Math.round(bmr))} kcal</dd>
            </div>
            <div className="flex flex-col rounded-xl bg-secondary px-3 py-2">
              <dt className="text-[11px] text-muted-foreground">Gasto total</dt>
              <dd className="text-base font-extrabold">{formatInt(Math.round(total))} kcal</dd>
            </div>
          </dl>
          <Factors {...props} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-foreground-2">Meta calórica</span>
            <Goal {...props} />
          </div>
          <MacroControls {...props} />
        </div>
      )}
    </section>
  )
}
