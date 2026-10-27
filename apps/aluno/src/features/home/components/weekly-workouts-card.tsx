import { cn } from '@workspace/ui/lib/utils'
import { SurfaceCard, SurfaceCardTitle } from '../../../shared/components/surface-card'

export function WeeklyWorkoutsCard({ done, goal }: { done: number; goal: number }) {
  return (
    <SurfaceCard role="region" aria-labelledby="treinos-da-semana" className="gap-3 py-4">
      <div className="flex items-baseline justify-between">
        <SurfaceCardTitle id="treinos-da-semana">Treinos da semana</SurfaceCardTitle>
        <p className="text-sm text-muted-foreground">
          <strong className="text-base text-foreground">{done}</strong> de {goal}
        </p>
      </div>
      <div aria-hidden="true" className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${goal}, minmax(0, 1fr))` }}>
        {Array.from({ length: goal }, (_, i) => (
          <span key={i} className={cn('h-2 rounded-full', i < done ? 'bg-primary' : 'bg-border')} />
        ))}
      </div>
    </SurfaceCard>
  )
}
