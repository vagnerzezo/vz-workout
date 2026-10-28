import { NavLink, useLocation } from 'react-router'
import { initials } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from '@workspace/ui/components/sidebar'
import { useCoach, useCounters } from '../api/coach'
import { inSection, sections } from '../nav'

/** Menu lateral do layout desktop (lg+), como na sidebar do canvas. */
export function PanelSidebar({ className }: { className?: string }) {
  const { data: coach } = useCoach()
  const { data: counters } = useCounters()
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="none" className={cn('sticky top-0 h-svh gap-4.5 border-r border-sidebar-border px-3.5 py-5', className)}>
      <SidebarHeader className="flex-row items-center gap-2.5 px-2 py-1">
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-primary text-[15px] font-extrabold text-primary-foreground">
          {coach ? initials(coach.branding.appName) : ''}
        </span>
        <div className="flex flex-col">
          <span className="text-[15px] font-extrabold text-foreground">{coach?.branding.appName ?? 'Painel'}</span>
          <span className="text-xs text-muted-foreground">Painel do treinador</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Seções">
          <SidebarMenu className="gap-0.5">
            {sections.map(({ to, label, icon: Icon, badge, highlight }) => {
              const active = inSection(pathname, to)
              const count = counters && badge ? badge(counters) : 0
              return (
                <SidebarMenuItem key={to}>
                  <NavLink
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-11 items-center gap-3 rounded-xl px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      active ? 'bg-primary/14 font-extrabold text-primary' : 'font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4.5" strokeWidth={1.9} />
                    <span className="grow">{label}</span>
                    {count > 0 && (
                      <span
                        aria-label={`${count} ${highlight ? 'pendentes' : 'no total'}`}
                        className={cn(
                          'flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold',
                          highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      {coach && (
        <SidebarFooter className="flex-row items-center gap-2.5 rounded-2xl border bg-card p-3">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full border border-input bg-secondary text-[13px] font-extrabold text-foreground">
            {initials(coach.fullName)}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-foreground">{coach.fullName}</span>
            <span className="text-xs text-muted-foreground">
              Plano {coach.plan.name} · {coach.activeStudents} de {coach.plan.studentLimit} alunos
            </span>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
