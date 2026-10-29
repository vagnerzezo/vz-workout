import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { ApiError } from '../../../shared/api/client'
import { ErrorState } from '../../../shared/components/error-state'
import { useArchiveStudents, useStudents, useUnarchiveStudents } from '../../students/api/queries'
import { ArchiveDialog } from '../../students/components/archive-dialog'
import { useStudent, useStudentCheckIns } from '../api/queries'
import { AssessmentTab } from '../components/assessment-tab'
import { CheckInsTab } from '../components/check-ins-tab'
import { DietTab } from '../components/diet-tab'
import { HistoryTab } from '../components/history-tab'
import { InfoTab } from '../components/info-tab'
import { ProfileHeader } from '../components/profile-header'
import { ProfileStats } from '../components/profile-stats'
import { profileTabs, ProfileTabs, type ProfileTab } from '../components/profile-tabs'
import { SummaryTab } from '../components/summary-tab'
import { WorkoutTab } from '../components/workout-tab'

export default function StudentPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const student = useStudent(id)
  const checkIns = useStudentCheckIns(id)
  const { data: list } = useStudents()
  const archive = useArchiveStudents()
  const unarchive = useUnarchiveStudents()
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [now] = useState(() => new Date())
  const tab: ProfileTab = profileTabs.find((t) => t.id === params.get('aba'))?.id ?? 'resumo'

  const notFound = student.error instanceof ApiError && student.error.status === 404
  const d = student.data
  const pending = checkIns.data?.filter((c) => c.status === 'waiting').length ?? 0

  return (
    <main className="flex flex-col gap-4 px-4 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-5 lg:px-8 lg:pt-6 lg:pb-10">
      {notFound ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <h1 className="text-xl font-extrabold">Aluno não encontrado</h1>
          <p className="text-sm text-muted-foreground">O link pode estar errado ou o aluno foi removido.</p>
          <Link to="/alunos" className={cn(buttonVariants({ size: 'lg' }))}>
            Ver todos os alunos
          </Link>
        </div>
      ) : student.isError ? (
        <ErrorState title="Não foi possível carregar o aluno" retrying={student.isFetching} onRetry={() => student.refetch()} />
      ) : !d ? (
        <div aria-busy="true" aria-label="Carregando o aluno" className="flex flex-col gap-4">
          <Skeleton className="h-20 w-80 rounded-2xl" />
          <Skeleton className="h-20 rounded-[20px]" />
          <Skeleton className="h-72 rounded-[20px]" />
        </div>
      ) : (
        <>
          <ProfileHeader
            detail={d}
            now={now}
            filterTags={list?.filterTags ?? []}
            onArchive={() => setConfirmArchive(true)}
            onUnarchive={() =>
              unarchive.mutate([id], {
                onSuccess: () => {
                  toast.success(`${d.student.fullName} voltou para os ativos`)
                  student.refetch()
                },
                onError: () => toast.error('Não foi possível reativar. Tente de novo.'),
              })
            }
          />
          <ProfileStats detail={d} now={now} variant="desktop" />
          <ProfileTabs current={tab} pendingCheckIns={pending} />
          {tab === 'resumo' && <SummaryTab detail={d} now={now} />}
          {tab === 'treino' && <WorkoutTab studentId={id} />}
          {tab === 'dieta' && <DietTab studentId={id} />}
          {tab === 'historico' && <HistoryTab studentId={id} />}
          {tab === 'avaliacao' && <AssessmentTab studentId={id} />}
          {tab === 'check-ins' && <CheckInsTab studentId={id} />}
          {tab === 'info' && <InfoTab detail={d} now={now} />}
          <ArchiveDialog
            names={confirmArchive ? [d.student.fullName] : []}
            pending={archive.isPending}
            onCancel={() => setConfirmArchive(false)}
            onConfirm={() =>
              archive.mutate([id], {
                onSuccess: () => {
                  toast.success(`${d.student.fullName} foi arquivado`)
                  setConfirmArchive(false)
                  navigate('/alunos?aba=arquivados')
                },
                onError: () => toast.error('Não foi possível arquivar. Tente de novo.'),
              })
            }
          />
        </>
      )}
    </main>
  )
}
