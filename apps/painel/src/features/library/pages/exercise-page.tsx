import { Link, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { muscleGroup } from '@workspace/core'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useExerciseDetail, useLibrary } from '../api/queries'
import { ExerciseDetailBody, VideoBox } from '../components/exercise-detail'
import { LibraryPage } from './library-page'

/** /biblioteca/exercicios/:id: no celular, a página do exercício; no desktop, a biblioteca com ele aberto ao lado. */
export default function ExerciseRoute() {
  const { id = '' } = useParams()
  return useIsDesktop() ? <LibraryPage selectedId={id} /> : <ExercisePage id={id} />
}

function ExercisePage({ id }: { id: string }) {
  const detail = useExerciseDetail(id)
  const library = useLibrary()
  const e = detail.data?.exercise
  return (
    <main className="flex flex-col gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2.5">
        <Link to="/biblioteca" aria-label="Voltar para a biblioteca" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <span className="text-[13px] font-bold text-muted-foreground">Biblioteca{e && ` · ${muscleGroup[e.primary]}`}</span>
      </header>
      {detail.isError ? (
        <ErrorState title="Exercício não encontrado" retrying={detail.isFetching} onRetry={() => detail.refetch()} />
      ) : !e ? (
        <Skeleton aria-label="Carregando o exercício" className="h-[70vh] rounded-[20px]" />
      ) : (
        <>
          <VideoBox exercise={e} tall />
          <h1 className="sr-only">{e.name}</h1>
          <ExerciseDetailBody key={id} detail={detail.data} library={library.data?.exercises ?? []} showActions />
        </>
      )}
    </main>
  )
}
