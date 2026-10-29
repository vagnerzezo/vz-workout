import { toast } from 'sonner'
import { formatBRL, type BillingRules, type CoachFinance, type ReminderOffset } from '@workspace/core'
import { Stepper } from '@workspace/ui/blocks/stepper'
import { Button } from '@workspace/ui/components/button'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { useSaveRules, useTogglePlan } from '../api/queries'

const reminderLabels: Record<ReminderOffset, string> = { 'd-3': '3 dias antes', d0: 'No dia', 'd+1': '1 dia depois', 'd+5': '5 dias depois' }
const card = 'flex flex-col gap-3 rounded-[20px] border bg-card p-4'

/** Planos à venda (liga/desliga) e as regras de cobrança: lembretes, tolerância e bloqueio. */
export function PlansAndRules({ finance, desktop }: { finance: CoachFinance; desktop: boolean }) {
  const toggle = useTogglePlan()
  const save = useSaveRules()
  const rules = finance.rules
  const update = (patch: Partial<BillingRules>) => save.mutate({ ...rules, ...patch }, { onError: () => toast.error('Não foi possível salvar.') })
  return (
    <div className={cn('flex flex-col gap-4', desktop && 'grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-5')}>
      <section aria-labelledby="planos-venda" className="flex flex-col gap-3">
        <h2 id="planos-venda" className="text-[15px] font-extrabold">
          Planos
        </h2>
        <ul className={cn('grid gap-2', desktop && 'grid-cols-2 gap-3')}>
          {finance.plans.map((p) => (
            <li key={p.id} className={cn(card, !p.active && 'opacity-70')}>
              <div className="flex items-start justify-between gap-2">
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-extrabold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.description}</span>
                </span>
                <Switch aria-label={`Plano ${p.name} à venda`} checked={p.active} onCheckedChange={(v) => toggle.mutate({ id: p.id, active: v })} />
              </div>
              <span className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold">{formatBRL(p.price)}</span>
                <span className="text-xs text-muted-foreground">{p.months === 1 ? '/ mês' : `/ ${p.months} meses`}</span>
              </span>
              {p.months > 1 && <span className="text-xs text-foreground-2">{formatBRL(p.price / p.months)} por mês</span>}
              <span className="text-xs text-muted-foreground">{p.students} alunos</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={() => toast('Novo plano chega em breve')} className="self-start border-dashed font-bold">
          + Novo plano
        </Button>
      </section>
      <section aria-labelledby="regras-cobranca" className={card}>
        <h2 id="regras-cobranca" className="text-[15px] font-extrabold">
          Regras de cobrança
        </h2>
        <div className="flex flex-col gap-2">
          <span className="flex flex-col gap-px">
            <span className="text-[13.5px] font-bold">Lembretes de vencimento</span>
            <span className="text-[11.5px] text-muted-foreground">Enviados pelo app com o Pix copia e cola</span>
          </span>
          <div role="group" aria-label="Quando lembrar" className="flex flex-wrap gap-1.5">
            {(Object.keys(reminderLabels) as ReminderOffset[]).map((r) => {
              const on = rules.reminders.includes(r)
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ reminders: on ? rules.reminders.filter((x) => x !== r) : [...rules.reminders, r] })}
                  className={cn('h-9 rounded-full border px-3 text-[12.5px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')}
                >
                  {reminderLabels[r]}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#22252b] pt-3">
          <span className="flex flex-col gap-px">
            <span className="text-[13.5px] font-bold">Tolerância após o vencimento</span>
            <span className="text-[11.5px] text-muted-foreground">Dias em que o aluno segue com acesso normal</span>
          </span>
          <div className="w-36 shrink-0">
            <Stepper label="Dias de tolerância" value={rules.toleranceDays} min={0} max={15} format={(v) => `${v} dias`} onChange={(v) => update({ toleranceDays: v })} />
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 border-t border-[#22252b] pt-3">
          <span className="flex flex-col gap-px">
            <span className="text-[13.5px] font-bold">Bloquear o app após a tolerância</span>
            <span className="text-[11.5px] text-muted-foreground">O aluno vê só a tela de pagamento até você confirmar</span>
          </span>
          <Switch checked={rules.blockAfterTolerance} onCheckedChange={(v) => update({ blockAfterTolerance: v })} />
        </label>
      </section>
    </div>
  )
}
