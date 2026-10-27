import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@workspace/ui/components/drawer'
import { Input } from '@workspace/ui/components/input'
import { useAddShoppingExtra } from '../api/shopping'

/** "Adicionar item fora do plano": nome e, se quiser, a quantidade em texto livre. */
export function AddExtraDrawer() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const add = useAddShoppingExtra()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    add.mutate(
      { name: name.trim(), quantity: quantity.trim() },
      {
        onSuccess: () => {
          setName('')
          setQuantity('')
          setOpen(false)
        },
        onError: () => toast.error('Não foi possível adicionar o item. Tente de novo.'),
      },
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-sm font-bold text-foreground-2 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.4} />
        Adicionar item fora do plano
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-[430px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="flex-row items-center justify-between gap-3 pt-5 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
          <div className="flex flex-col gap-0.5">
            <DrawerTitle className="text-lg font-extrabold">Item fora do plano</DrawerTitle>
            <DrawerDescription>Entra na lista, mas não conta na dieta.</DrawerDescription>
          </div>
          <DrawerClose render={<Button variant="secondary" size="icon" aria-label="Fechar" />}>
            <X aria-hidden="true" className="size-4.5" />
          </DrawerClose>
        </DrawerHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 pt-4 pb-8">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="extra-nome" className="text-sm font-bold">
              Item
            </label>
            <Input
              id="extra-nome"
              required
              maxLength={60}
              autoComplete="off"
              placeholder="Ex.: Café em pó"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl px-3.5"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="extra-qtd" className="text-sm font-bold">
              Quantidade <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="extra-qtd"
              maxLength={30}
              autoComplete="off"
              placeholder="Ex.: 1 pacote"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12 rounded-xl px-3.5"
            />
          </div>
          <Button type="submit" size="lg" disabled={add.isPending} className="h-12 rounded-full text-[15px] font-extrabold">
            {add.isPending ? 'Adicionando…' : 'Adicionar à lista'}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
