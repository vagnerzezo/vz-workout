import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, X } from 'lucide-react'
import type { Coach, CreatedStudent, NewStudent, NewStudentOptions } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@workspace/ui/components/sheet'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { useCoach } from '../../../shared/api/coach'
import { ErrorState } from '../../../shared/components/error-state'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import StudentsPage from '../../students/pages/students-page'
import { useNewStudentOptions } from '../api/queries'
import { InviteReady } from '../components/invite-ready'
import { NewStudentForm } from '../components/new-student-form'

type Done = { created: CreatedStudent; form: NewStudent }

/** Formulário ou, depois de criar, o convite pronto. "Cadastrar outro" volta ao formulário vazio. */
function NewStudentFlow({ coach, options, done, setDone, bodyClassName, footerClassName }: {
  coach: Coach
  options: NewStudentOptions
  done: Done | null
  setDone: (d: Done | null) => void
  bodyClassName?: string
  footerClassName?: string
}) {
  return done ? (
    <InviteReady {...done} coach={coach} options={options} onAgain={() => setDone(null)} bodyClassName={bodyClassName} footerClassName={footerClassName} />
  ) : (
    <NewStudentForm options={options} onCreated={(created, form) => setDone({ created, form })} bodyClassName={bodyClassName} footerClassName={footerClassName} />
  )
}

const usageLine = (c: Coach) => `${c.activeStudents} de ${c.plan.studentLimit} vagas do plano ${c.plan.name} em uso`

/** /alunos/novo: sheet por cima da lista no desktop, página inteira no celular. */
export default function NewStudentPage() {
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const coach = useCoach()
  const options = useNewStudentOptions()
  const [done, setDone] = useState<Done | null>(null)
  const title = done ? 'Aluno cadastrado' : 'Novo aluno'

  let body: ReactNode
  if (coach.isError || options.isError) {
    body = <ErrorState title="Não foi possível abrir o cadastro" onRetry={() => void Promise.all([coach.refetch(), options.refetch()])} retrying={coach.isFetching || options.isFetching} />
  } else if (!coach.data || !options.data) {
    body = <Skeleton aria-label="Carregando o cadastro" className="mx-4 h-96 rounded-[20px] lg:mx-6" />
  } else {
    const flow = { coach: coach.data, options: options.data, done, setDone }
    body = isDesktop ? (
      <NewStudentFlow {...flow} bodyClassName="min-h-0 grow overflow-y-auto px-6 pb-6" footerClassName="border-t px-6 py-4" />
    ) : (
      <NewStudentFlow {...flow} bodyClassName="pb-5" />
    )
  }

  if (isDesktop) {
    return (
      <>
        <StudentsPage />
        <Sheet open onOpenChange={(open) => !open && navigate('/alunos')}>
          <SheetContent showCloseButton={false} className="w-full gap-0 p-0 data-[side=right]:sm:max-w-[520px]">
            <SheetHeader className="flex-row items-start justify-between gap-3 px-6 pt-6 pb-5">
              <div className="flex flex-col gap-0.5">
                <SheetTitle className="text-xl font-extrabold">{title}</SheetTitle>
                <SheetDescription className="text-xs">{coach.data ? usageLine(coach.data) : ' '}</SheetDescription>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Fechar" onClick={() => navigate('/alunos')}>
                <X aria-hidden="true" />
              </Button>
            </SheetHeader>
            {body}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <main className="flex flex-col gap-4.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2.5">
        <Link to="/alunos" aria-label="Voltar para alunos" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="flex flex-col gap-px">
          <h1 className="text-xl font-extrabold">{title}</h1>
          {coach.data && <span className="text-xs text-muted-foreground">{usageLine(coach.data)}</span>}
        </div>
      </header>
      {body}
    </main>
  )
}
