import { Droplet } from 'lucide-react'
import { toast } from 'sonner'
import { formatLiters } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { useAddWater, useIsSavingWater, useUndoWater, useWaterToday, WATER_ERRORS } from '../../../shared/api/water'
import { SurfaceCard } from '../../../shared/components/surface-card'

const MAX_DAY_ML = 10_000

/** Água da tela de dieta: mesmos dados da Home, com o atalho de +1 L. */
export function DietWaterCard() {
  const { data: water } = useWaterToday()
  const addWater = useAddWater()
  const undoWater = useUndoWater()
  const saving = useIsSavingWater()
  if (!water) return <Skeleton className="h-40 rounded-[20px]" />

  const lastEntry = water.entries.at(-1)
  const pct = Math.min(Math.round((water.consumedMl / water.goalMl) * 100), 100)
  const add = (ml: number) => addWater.mutate(ml, { onError: () => toast.error(WATER_ERRORS.add) })

  return (
    <SurfaceCard role="region" aria-labelledby="agua-dieta" className="gap-3.5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-[14px] bg-info/14 text-info">
          <Droplet className="size-5.5" strokeWidth={2} />
        </span>
        <div className="flex grow flex-col">
          <h2 id="agua-dieta" className="text-[15px] font-bold">
            Água
          </h2>
          <p aria-live="polite" className="text-[13px] text-muted-foreground">
            <strong className="text-base text-foreground">{formatLiters(water.consumedMl)}</strong> de {formatLiters(water.goalMl)}
          </p>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Água ingerida"
        aria-valuemin={0}
        aria-valuemax={water.goalMl}
        aria-valuenow={water.consumedMl}
        aria-valuetext={`${formatLiters(water.consumedMl)} de ${formatLiters(water.goalMl)}`}
        className="h-2.5 overflow-hidden rounded-full bg-border"
      >
        <div className="h-2.5 rounded-full bg-info motion-safe:transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_52px] gap-2">
        {[250, 500, 1000].map((ml) => (
          <Button
            key={ml}
            variant="secondary"
            className="border-border text-sm font-bold"
            disabled={water.consumedMl + ml > MAX_DAY_ML}
            onClick={() => add(ml)}
          >
            {ml === 1000 ? '+1 L' : `+${ml} ml`}
          </Button>
        ))}
        <Button
          variant="outline"
          className="border-border px-0 text-lg font-bold text-muted-foreground"
          disabled={!lastEntry || saving}
          aria-label={lastEntry ? `Desfazer último registro de ${lastEntry.ml} ml` : 'Desfazer último registro de água'}
          onClick={() => lastEntry && undoWater.mutate(lastEntry.id, { onError: () => toast.error(WATER_ERRORS.undo) })}
        >
          −
        </Button>
      </div>
    </SurfaceCard>
  )
}
