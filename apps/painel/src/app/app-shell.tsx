import { useState, type CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router'
import { House, Menu } from 'lucide-react'
import { BottomNav, type BottomNavItem } from '@workspace/ui/blocks/bottom-nav'
import { SidebarProvider } from '@workspace/ui/components/sidebar'
import { useCounters } from '../shared/api/coach'
import { MoreDrawer } from '../shared/components/more-drawer'
import { PanelSidebar } from '../shared/components/panel-sidebar'
import { inSection, moreSections, tabSections } from '../shared/nav'

/**
 * Um layout por largura (seção 7.2 do guia): de lg (1024 px) para cima a sidebar;
 * abaixo, a barra inferior com "Mais". A rota é a mesma, só a composição muda.
 */
export function AppShell() {
  const { data: counters } = useCounters()
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const tabs: BottomNavItem[] = [
    { to: '/', label: 'Início', icon: House, end: true },
    ...tabSections.map(({ to, label, icon, badge, highlight }) => ({ to, label, icon, badge: highlight && counters && badge ? badge(counters) : undefined })),
    { label: 'Mais', icon: Menu, onSelect: () => setMoreOpen(true), active: moreOpen || moreSections.some((s) => inSection(pathname, s.to)) },
  ]

  return (
    <SidebarProvider style={{ '--sidebar-width': '248px' } as CSSProperties}>
      <PanelSidebar className="hidden lg:flex" />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
      <div className="fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-[600px] px-4 lg:hidden">
        <BottomNav items={tabs} />
      </div>
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} counters={counters} />
    </SidebarProvider>
  )
}
