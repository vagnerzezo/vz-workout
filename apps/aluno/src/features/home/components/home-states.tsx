import { Skeleton } from '@workspace/ui/components/skeleton'

/** Mesmo esqueleto da tela pronta, para nada pular quando os dados chegam. */
export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o início" className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-7 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-9 w-64 rounded-full" />
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-17 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-55 rounded-3xl" />
      <Skeleton className="h-20 rounded-[20px]" />
      <Skeleton className="h-36 rounded-[20px]" />
      <Skeleton className="h-21 rounded-[20px]" />
    </div>
  )
}
