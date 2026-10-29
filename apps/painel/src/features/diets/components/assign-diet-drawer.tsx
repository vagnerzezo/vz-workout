import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { defaultPlanStart, dietCandidates, formatDecimal, formatInt, parseIsoDate, shortDate, type CoachDiets, type DietTemplateSummary } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { SelectBox } from '../../students/components/select-box'
import { useAssignDiet } from '../api/queries'

type AssignDietDrawerProps = {
  template: DietTemplateSummary | null
  data: Pick<CoachDiets, 'candidates' | 'nutritionist'>
  now: Date
  onClose: () => void
}

const plural = (n: number) => (n === 1 ? '1 aluno' : `${n} alunos`)
const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** "Atribuir dieta": com o ajuste ligado, cada aluno vê as calorias e a proteína no peso dele. */
export function AssignDietDrawer({ template, data, now, onClose }: AssignDietDrawerProps) {
  return (
    <Drawer open={template !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="mx-auto max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
        {template && <AssignForm key={template.id} template={template} data={data} now={now} onClose={onClose} />}
      </DrawerContent>
    </Drawer>
  )
}

function AssignForm({ template, data, now, onClose }: Omit<AssignDietDrawerProps, 'template'> & { template: DietTemplateSummary }) {
  const assign = useAssignDiet()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [scale, setScale] = useState(true)
  const [startsOn, setStartsOn] = useState(defaultPlanStart(now))
  const [done, setDone] = useState<number | null>(null)

  const q = fold(query.trim())
  const shown = dietCandidates(data.candidates, now).filter((c) => !q || fold(c.name).includes(q) || picked.includes(c.id))
  const n = picked.length
  const toneClass = { warning: 'text-warning', danger: 'text-destructive', muted: 'text-muted-foreground' } as const
  const k = (weight: number | null) => (scale && weight ? weight / template.refWeightKg : 1)
  const start = shortDate(parseIsoDate(startsOn))

  if (done !== null) {
    return (
      <div className="flex flex-col items-center gap-2.5 px-4 pt-8 pb-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check aria-hidden="true" strokeWidth={2.8} className="size-6.5" />
        </span>
        <DrawerTitle className="text-[17px] font-extrabold">Dieta atribuída a {plural(done)}</DrawerTitle>
        <DrawerDescription className="text-[13px]">{scale ? `Porções ajustadas ao peso de cada um · início em ${start}` : `Mesmas porções do modelo · início em ${start}`}</DrawerDescription>
        <Button variant="outline" size="lg" onClick={onClose} className="mt-1 px-6 font-extrabold">
          Fechar
        </Button>
      </div>
    )
  }

  return (
    <>
      <DrawerHeader className="gap-0.5 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
        <DrawerTitle className="text-[17px] font-extrabold">Atribuir dieta</DrawerTitle>
        <DrawerDescription className="text-xs">
          {template.name} · modelo para {formatDecimal(template.refWeightKg)} kg
        </DrawerDescription>
      </DrawerHeader>
      <div className="flex min-h-0 flex-col gap-3 px-4 pt-3">
        <label className="flex min-h-15 shrink-0 items-center gap-3 rounded-[14px] border bg-[#1a1c21] px-3 py-2">
          <span className="flex grow flex-col gap-0.5">
            <span className="text-sm font-extrabold">Ajustar ao peso de cada aluno</span>
            <span className="text-[11.5px] text-muted-foreground">Mantém os g/kg do modelo e recalcula as porções</span>
          </span>
          <Switch checked={scale} onCheckedChange={setScale} />
        </label>
        <label className="flex h-10.5 shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 focus-within:ring-3 focus-within:ring-ring/50">
          <Search aria-hidden="true" className="size-4 text-muted-foreground" />
          <input type="search" aria-label="Buscar aluno" placeholder="Buscar aluno" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 grow bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
        </label>
        <ul aria-label="Alunos" className="-mx-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-1">
          {shown.map((c) => {
            const on = picked.includes(c.id)
            return (
              <li key={c.id}>
                <label className={cn('flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1.5', on && 'bg-primary/14')}>
                  <SelectBox label={c.name} checked={on} onChange={(v) => setPicked((p) => (v ? [...p, c.id] : p.filter((id) => id !== c.id)))} />
                  <span className="flex min-w-0 grow flex-col gap-px">
                    <span className="text-sm font-bold">{c.name}</span>
                    <span className={cn('text-[11.5px]', toneClass[c.tone])}>{c.meta}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-px">
                    <span className="text-[13px] font-extrabold">{formatInt(Math.round(template.targets.kcal * k(c.weightKg)))} kcal</span>
                    <span className="text-[11px] text-muted-foreground">
                      {c.weightKg ? `${formatDecimal(c.weightKg)} kg · ` : ''}P {Math.round(template.targets.protein * k(c.weightKg))} g
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
          {shown.length === 0 && <li className="px-2.5 py-4 text-[13px] text-muted-foreground">Nenhum aluno encontrado.</li>}
        </ul>
        <label className="flex shrink-0 items-center justify-between gap-2.5 text-[13px] font-bold text-foreground-2">
          Começa em
          <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className="h-10.5 rounded-xl border bg-background px-2.5 text-[13px] text-foreground [color-scheme:dark] outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
        </label>
        <p className="shrink-0 text-[11.5px] text-muted-foreground">
          Prescrição assinada por {data.nutritionist.name}, nutricionista · {data.nutritionist.credential}. Cada aluno recebe uma cópia editável.
        </p>
        {assign.isError && (
          <p role="alert" className="text-[13px] text-destructive">
            Não foi possível atribuir. Tente de novo.
          </p>
        )}
      </div>
      <DrawerFooter className="pt-3">
        <Button
          size="lg"
          disabled={n === 0 || !startsOn || assign.isPending}
          onClick={() => assign.mutate({ templateId: template.id, studentIds: picked, startsOn, scaleToWeight: scale }, { onSuccess: () => setDone(n) })}
          className="h-12.5 text-[15px] font-extrabold"
        >
          {assign.isPending ? 'Atribuindo…' : n ? `Atribuir a ${plural(n)}` : 'Selecione os alunos'}
        </Button>
      </DrawerFooter>
    </>
  )
}
