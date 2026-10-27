import { useState, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatDecimal } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@workspace/ui/components/drawer'
import { Stepper } from '@workspace/ui/blocks/stepper'
import { useLogWeight } from '../api/weights'

const DEFAULT_KG = 70

type LogWeightDrawerProps = {
  lastWeightKg: number | null
  trigger?: ReactElement // botão que abre; o padrão é o "Registrar peso" da Home
  triggerLabel?: string
}

export function LogWeightDrawer({ lastWeightKg, trigger, triggerLabel = 'Registrar peso' }: LogWeightDrawerProps) {
  const [open, setOpen] = useState(false)
  const [kg, setKg] = useState(lastWeightKg ?? DEFAULT_KG)
  const logWeight = useLogWeight()

  const onOpenChange = (next: boolean) => {
    if (next) setKg(lastWeightKg ?? DEFAULT_KG) // começa sempre do último peso salvo
    setOpen(next)
  }

  const save = () =>
    logWeight.mutate(kg, {
      onSuccess: () => {
        toast.success(`Peso registrado: ${formatDecimal(kg)} kg`)
        setOpen(false)
      },
      onError: () => toast.error('Não foi possível salvar o peso. Tente de novo.'),
    })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger
        render={
          trigger ?? <Button variant="outline" size="sm" className="h-9 border-primary px-3.5 font-bold text-primary hover:bg-primary/10" />
        }
      >
        <Plus aria-hidden="true" strokeWidth={2.4} />
        {triggerLabel}
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-[430px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="gap-1 pt-6">
          <DrawerTitle className="text-lg font-extrabold">Registrar peso</DrawerTitle>
          <DrawerDescription>
            {lastWeightKg ? `Último registro: ${formatDecimal(lastWeightKg)} kg` : 'Pese-se de manhã, em jejum, para comparar melhor.'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-6">
          <Stepper value={kg} onChange={setKg} label="peso em quilos" min={20} max={400} step={0.1} format={(v) => `${formatDecimal(v)} kg`} />
        </div>
        <DrawerFooter className="pb-6">
          <Button size="xl" onClick={save} disabled={logWeight.isPending}>
            {logWeight.isPending ? 'Salvando…' : 'Salvar peso'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
