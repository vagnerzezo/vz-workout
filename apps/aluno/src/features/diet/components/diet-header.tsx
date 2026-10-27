import { Link } from 'react-router'
import { FileText, ShoppingCart, X } from 'lucide-react'
import type { MealPlan } from '@workspace/core'
import { parseIsoDate, shortDate } from '@workspace/core'
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

const iconButton =
  'flex size-11 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

const author = { nutritionist: 'pela nutri', coach: 'pelo treinador' } as const
const notesTitle = { nutritionist: 'Observações da nutricionista', coach: 'Observações do treinador' } as const

export function DietHeader({ plan }: { plan: MealPlan | null }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[30px] font-extrabold tracking-[-0.6px]">Dieta</h1>
        {plan && (
          <p className="text-[13px] text-muted-foreground">
            Plano atualizado {author[plan.authorRole]} em {shortDate(parseIsoDate(plan.updatedAt))}
          </p>
        )}
      </div>
      {plan && (
        <div className="flex gap-2">
          {plan.notes.length > 0 && (
            <Drawer>
              <DrawerTrigger aria-label={notesTitle[plan.authorRole]} className={iconButton}>
                <FileText aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </DrawerTrigger>
              <DrawerContent className="mx-auto max-w-[430px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
                <DrawerHeader className="flex-row items-center justify-between gap-3 pt-5 text-left">
                  <div className="flex flex-col gap-0.5">
                    <DrawerTitle className="text-lg font-extrabold">{notesTitle[plan.authorRole]}</DrawerTitle>
                    <DrawerDescription>Válidas para todas as fichas da sua dieta.</DrawerDescription>
                  </div>
                  <DrawerClose render={<Button variant="secondary" size="icon" aria-label="Fechar" />}>
                    <X aria-hidden="true" className="size-4.5" />
                  </DrawerClose>
                </DrawerHeader>
                <div className="flex flex-col gap-3 px-4 pt-4 pb-8 text-sm leading-normal text-foreground-2">
                  {plan.notes.map((n) => (
                    <p key={n.title}>
                      <strong className="text-foreground">{n.title}:</strong> {n.text}
                    </p>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          )}
          <Link to="/dieta/lista-de-compras" aria-label="Lista de compras" className={iconButton}>
            <ShoppingCart aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </Link>
        </div>
      )}
    </header>
  )
}
