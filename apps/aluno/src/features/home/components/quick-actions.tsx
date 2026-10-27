import { Flame } from 'lucide-react'
import { LogWeightDrawer } from '../../../shared/components/log-weight-drawer'

export function QuickActions({ streakDays, lastWeightKg }: { streakDays: number; lastWeightKg: number | null }) {
  return (
    <div className="flex items-center gap-2">
      {streakDays > 0 && (
        <p className="flex h-9 items-center gap-1.5 rounded-full border bg-card px-3.5 text-[13px] font-semibold">
          <Flame aria-hidden="true" className="size-4 text-primary" strokeWidth={2} />
          {streakDays === 1 ? '1 dia seguido' : `${streakDays} dias seguidos`}
        </p>
      )}
      <LogWeightDrawer lastWeightKg={lastWeightKg} />
    </div>
  )
}
