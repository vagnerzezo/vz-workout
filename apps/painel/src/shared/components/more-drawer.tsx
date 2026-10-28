import { Link } from 'react-router'
import type { CoachCounters } from '@workspace/core'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { moreSections } from '../nav'

type MoreDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  counters: CoachCounters | undefined
}

/** "Mais" da barra inferior: as seções que não cabem nela, em grade de 3. */
export function MoreDrawer({ open, onOpenChange, counters }: MoreDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[26px] pb-[calc(28px+env(safe-area-inset-bottom))]">
        <DrawerHeader className="pt-6 group-data-[swipe-axis=y]/drawer-popup:text-left">
          <DrawerTitle className="text-[17px] font-extrabold">Mais</DrawerTitle>
        </DrawerHeader>
        <nav aria-label="Mais seções" className="grid grid-cols-3 gap-2 px-4">
          {moreSections.map(({ to, label, icon: Icon, badge }) => {
            const count = counters && badge ? badge(counters) : 0
            return (
              <Link
                key={to}
                to={to}
                onClick={() => onOpenChange(false)}
                className="relative flex min-h-22 flex-col items-center justify-center gap-2 rounded-2xl bg-secondary p-2 text-center text-xs font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Icon aria-hidden="true" className="size-5.5" strokeWidth={1.9} />
                {label}
                {count > 0 && (
                  <span aria-label={`${count} pendentes`} className="absolute top-2 right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1.25 text-[10.5px] font-extrabold text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}
