import { lazy, Suspense, useState } from 'react'
import { Flame, Plus } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

// A gaveta (Base UI) pesa ~28 KB: só baixa quando a pessoa vai registrar o peso
const loadDrawer = () => import('../../../shared/components/log-weight-drawer')
const LogWeightDrawer = lazy(() => loadDrawer().then((m) => ({ default: m.LogWeightDrawer })))

function LogWeight({ lastWeightKg }: { lastWeightKg: number | null }) {
  const [wanted, setWanted] = useState(false)
  const placeholder = (
    <Button variant="outline" size="sm" onPointerEnter={loadDrawer} onFocus={loadDrawer} onClick={() => setWanted(true)} className="h-9 border-primary px-3.5 font-bold text-primary hover:bg-primary/10">
      <Plus aria-hidden="true" strokeWidth={2.4} />
      Registrar peso
    </Button>
  )
  if (!wanted) return placeholder
  return (
    <Suspense fallback={placeholder}>
      <LogWeightDrawer lastWeightKg={lastWeightKg} defaultOpen />
    </Suspense>
  )
}

export function QuickActions({ streakDays, lastWeightKg }: { streakDays: number; lastWeightKg: number | null }) {
  return (
    <div className="flex items-center gap-2">
      {streakDays > 0 && (
        <p className="flex h-9 items-center gap-1.5 rounded-full border bg-card px-3.5 text-[13px] font-semibold">
          <Flame aria-hidden="true" className="size-4 text-primary" strokeWidth={2} />
          {streakDays === 1 ? '1 dia seguido' : `${streakDays} dias seguidos`}
        </p>
      )}
      <LogWeight lastWeightKg={lastWeightKg} />
    </div>
  )
}
