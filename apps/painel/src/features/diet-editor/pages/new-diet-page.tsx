import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ErrorState } from '../../../shared/components/error-state'
import { useCreateDiet } from '../api/queries'

/** /dietas/nova: cria um modelo com café, almoço e jantar vazios e abre o editor nele. */
export default function NewDietPage() {
  const navigate = useNavigate()
  const create = useCreateDiet()
  const started = useRef(false)
  const { mutate } = create

  const start = () => mutate(undefined, { onSuccess: (t) => navigate(`/dietas/${t.id}`, { replace: true }) })
  useEffect(() => {
    if (started.current) return // o StrictMode roda o efeito duas vezes no dev
    started.current = true
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="flex flex-col gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] lg:px-8 lg:pt-5">
      {create.isError ? <ErrorState title="Não foi possível criar a dieta" retrying={create.isPending} onRetry={start} /> : <Skeleton aria-label="Criando a dieta" className="h-[70vh] rounded-[20px]" />}
    </main>
  )
}
