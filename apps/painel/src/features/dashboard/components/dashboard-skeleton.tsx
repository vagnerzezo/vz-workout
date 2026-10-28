import { Skeleton } from '@workspace/ui/components/skeleton'

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o dashboard" className="flex flex-col gap-4.5 lg:gap-6">
      <Skeleton className="h-14 w-64 rounded-xl" />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-[18px] lg:h-36 lg:rounded-[20px]" />
        ))}
      </div>
      <Skeleton className="h-9 w-full rounded-full lg:w-2/3" />
      <div className="flex flex-col gap-5 lg:flex-row">
        <Skeleton className="h-96 rounded-[20px] lg:flex-[999_1_560px] lg:rounded-[22px]" />
        <Skeleton className="h-96 rounded-[20px] lg:flex-[1_1_320px] lg:rounded-[22px]" />
      </div>
    </div>
  )
}
