import type { ComponentProps } from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { Card } from '@workspace/ui/components/card'

/** Card padrão do app (canvas): cantos de 20px e borda do canvas, no lugar do ring do shadcn. */
export function SurfaceCard({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn('gap-3.5 rounded-[20px] border px-4.5 py-4.5 text-base ring-0', className)}
      {...props}
    />
  )
}

export function SurfaceCardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-[15px] font-bold', className)} {...props} />
}
