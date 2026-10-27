import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { useProgress } from '../api/queries'
import { LoadProgressCard, MeasurementsCard, PhotosCard, WeightChartCard } from '../components/progress-sections'

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

/** Progresso: peso, carga, medidas e fotos. O Perfil abre direto numa seção (#fotos, #medidas). */
export default function ProgressPage() {
  const { hash } = useLocation()
  const [today] = useState(() => new Date())
  const progress = useProgress()
  const data = progress.data

  // A seção só existe depois que os dados chegam; aí rola até ela
  useEffect(() => {
    if (data && hash) document.getElementById(hash.slice(1))?.scrollIntoView?.()
  }, [data, hash])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4.5 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(40px,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        <Link to="/perfil" aria-label="Voltar ao perfil" className={iconButton}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </Link>
        <h1 className="text-[26px] font-extrabold tracking-[-0.5px]">Progresso</h1>
      </div>

      {progress.isError ? (
        <ErrorState title="Não foi possível carregar seu progresso" onRetry={() => progress.refetch()} retrying={progress.isFetching} />
      ) : !data ? (
        <div aria-busy="true" aria-label="Carregando seu progresso" className="flex flex-col gap-4.5">
          <Skeleton className="h-75 rounded-[22px]" />
          <Skeleton className="h-80 rounded-[22px]" />
          <Skeleton className="h-60 rounded-[22px]" />
        </div>
      ) : (
        <>
          <WeightChartCard weights={data.weights} goalKg={data.weightGoalKg} today={today} />
          <LoadProgressCard lifts={data.lifts} today={today} />
          <MeasurementsCard measurements={data.measurements} />
          <PhotosCard photos={data.photos} />
        </>
      )}
    </main>
  )
}
