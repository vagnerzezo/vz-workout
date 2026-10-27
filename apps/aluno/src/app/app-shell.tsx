import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { Dumbbell, House, User, Utensils } from 'lucide-react'
import { BottomNav, type BottomNavItem } from '@workspace/ui/blocks/bottom-nav'
import { useMe } from '../shared/api/me'
import { applyBrand } from '../shared/branding/apply-brand'

const navItems: BottomNavItem[] = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/treinos', label: 'Treino', icon: Dumbbell },
  { to: '/dieta', label: 'Dieta', icon: Utensils },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export function AppShell() {
  const { data: me } = useMe()

  useEffect(() => {
    if (me) applyBrand(me.branding.brandColor)
  }, [me])

  return (
    <div className="relative mx-auto min-h-svh w-full max-w-[430px]">
      <Outlet />
      <div className="fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-[430px] px-5">
        <BottomNav items={navItems} />
      </div>
    </div>
  )
}
