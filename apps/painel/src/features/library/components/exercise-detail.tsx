import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ChevronRight, Search, User } from 'lucide-react'
import { audioDuration, exerciseLevelLabel, muscleLabel, type ExerciseDetail, type LibraryExercise } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { SelectBox } from '../../students/components/select-box'
import { useStudents } from '../../students/api/queries'
import { useDuplicateExercise, useSendExercise } from '../api/queries'

/** Vídeo de execução: sem arquivo na API simulada, fica o espaço com a duração (ou "Sem vídeo"). */
export function VideoBox({ exercise: e, tall = false }: { exercise: LibraryExercise; tall?: boolean }) {
  return (
    <section aria-label="Vídeo de execução" className={cn('relative flex items-center justify-center overflow-hidden rounded-[22px] border bg-card', tall ? 'h-96' : 'h-56')}>
      <User aria-hidden="true" className="size-24 text-secondary" strokeWidth={1} />
      <span className="absolute top-3 left-3 flex h-6 items-center rounded-md bg-background/80 px-2 text-[11px] font-extrabold text-foreground-2">{e.origin === 'coach' ? 'MEU' : 'BASE'}</span>
      <span className="absolute right-3 bottom-3 flex h-7 items-center rounded-md bg-background/80 px-2.5 text-xs font-bold text-foreground-2">{e.videoSeconds ? `Vídeo · ${audioDuration(e.videoSeconds)}` : 'Sem vídeo'}</span>
    </section>
  )
}

/** "Enviar para aluno": cartão com o vídeo e o passo a passo no chat. */
export function SendExerciseDrawer({ exercise, open, onOpenChange }: { exercise: LibraryExercise; open: boolean; onOpenChange: (o: boolean) => void }) {
  const students = useStudents()
  const send = useSendExercise()
  const [picked, setPicked] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [sent, setSent] = useState<number | null>(null)
  const fold = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
  const list = (students.data?.students ?? []).filter((s) => s.status === 'active' && (!query.trim() || fold(s.fullName).includes(fold(query.trim()))))
  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setSent(null)
      }}
    >
      <DrawerContent className="mx-auto max-h-[85dvh] max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
        {sent !== null ? (
          <div className="flex flex-col items-center gap-3 px-4 pt-8 pb-6 text-center">
            <DrawerTitle className="text-[17px] font-extrabold">Enviado para {sent === 1 ? '1 aluno' : `${sent} alunos`}</DrawerTitle>
            <DrawerDescription className="sr-only">O exercício foi para o chat</DrawerDescription>
            <Link to="/chat" className={cn(buttonVariants({ variant: 'outline', size: 'lg', className: 'font-extrabold' }))}>
              Ver no chat
            </Link>
          </div>
        ) : (
          <>
            <DrawerHeader className="gap-0.5 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
              <DrawerTitle className="text-[17px] font-extrabold">Enviar no chat</DrawerTitle>
              <DrawerDescription className="text-xs">Vai como cartão com o vídeo e o passo a passo</DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-col gap-3 px-4 pt-2">
              <label className="flex h-10.5 shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 focus-within:ring-3 focus-within:ring-ring/50">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <input type="search" aria-label="Buscar aluno" placeholder="Buscar aluno" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 grow bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
              </label>
              <ul aria-label="Alunos" className="flex min-h-0 flex-col overflow-y-auto">
                {list.map((s) => (
                  <li key={s.id}>
                    <label className={cn('flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2', picked.includes(s.id) && 'bg-primary/14')}>
                      <SelectBox label={s.fullName} checked={picked.includes(s.id)} onChange={(v) => setPicked(v ? [...picked, s.id] : picked.filter((x) => x !== s.id))} />
                      <span className="text-sm font-bold">{s.fullName}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <DrawerFooter className="pt-3">
              <Button size="lg" disabled={picked.length === 0 || send.isPending} onClick={() => send.mutate({ id: exercise.id, studentIds: picked }, { onSuccess: (r) => setSent(r.sent), onError: () => toast.error('Não foi possível enviar.') })} className="font-extrabold">
                {picked.length ? `Enviar para ${picked.length === 1 ? '1 aluno' : `${picked.length} alunos`}` : 'Selecione os alunos'}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

/** Músculos, passo a passo, substituições e onde é usado (painel do desktop e página do celular). */
export function ExerciseDetailBody({ detail, library, showActions }: { detail: ExerciseDetail | undefined; library: LibraryExercise[]; showActions: boolean }) {
  const navigate = useNavigate()
  const duplicate = useDuplicateExercise()
  const [sending, setSending] = useState(false)
  if (!detail) return <Skeleton aria-label="Carregando o exercício" className="h-80 rounded-[20px]" />
  const e = detail.exercise
  const names = new Map(library.map((x) => [x.id, x.name]))
  const doDuplicate = () =>
    duplicate.mutate(e.id, {
      onSuccess: (copy) => {
        toast.success('Cópia criada nos seus exercícios')
        navigate(`/biblioteca/exercicios/${copy.id}`)
      },
      onError: () => toast.error('Não foi possível duplicar.'),
    })
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] leading-tight font-extrabold tracking-[-0.3px]">{e.name}</h2>
        <span className="text-[13px] text-muted-foreground">
          {e.equipment} · {exerciseLevelLabel[e.level]} · {e.origin === 'coach' ? 'criado por você' : 'base da plataforma'}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5 rounded-[14px] border bg-card px-3 py-2.5">
          <dt className="text-[11px] text-muted-foreground">Principal · conta 1</dt>
          <dd className="text-[15px] font-extrabold text-primary">{muscleLabel[e.primary]}</dd>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[14px] border bg-card px-3 py-2.5">
          <dt className="text-[11px] text-muted-foreground">Secundário · conta 0,5</dt>
          <dd className="text-[15px] font-extrabold">{e.secondary.length ? e.secondary.map((m) => muscleLabel[m]).join(', ') : '—'}</dd>
        </div>
      </dl>
      <section aria-labelledby={`passos-${e.id}`} className="flex flex-col gap-2">
        <h3 id={`passos-${e.id}`} className="text-[15px] font-extrabold">
          Como executar
        </h3>
        <ol className="flex flex-col gap-2">
          {e.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-[1.45] text-foreground-2">
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-extrabold">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>
      {e.alternatives.length > 0 && (
        <section aria-labelledby={`subs-${e.id}`} className="flex flex-col gap-2">
          <h3 id={`subs-${e.id}`} className="text-[15px] font-extrabold">
            Substituições sugeridas no app
          </h3>
          <span className="-mt-1 text-xs text-muted-foreground">O aluno pode trocar sozinho quando o aparelho estiver ocupado</span>
          <ul className="flex flex-wrap gap-1.5">
            {e.alternatives.map((id) => (
              <li key={id} className="flex h-8.5 items-center rounded-full border border-input px-3 text-[13px] text-foreground-2">
                {names.get(id) ?? id}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby={`usado-${e.id}`} className="overflow-hidden rounded-[18px] border bg-card">
        <div className="flex items-baseline justify-between gap-2 px-3.5 pt-3 pb-2">
          <h3 id={`usado-${e.id}`} className="text-[15px] font-extrabold">
            Usado em {e.uses === 1 ? '1 ficha' : `${e.uses} fichas`}
          </h3>
          <span className="text-xs text-muted-foreground">
            {detail.templates} modelos · {detail.students} de alunos
          </span>
        </div>
        <ul>
          {detail.usedIn.map((u) => (
            <li key={u.link}>
              <Link to={u.link} className="flex min-h-13 items-center gap-2.5 border-t border-[#22252b] px-3.5 py-2 outline-none hover:bg-accent/50 focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="flex grow flex-col gap-px">
                  <span className="text-[13.5px] font-bold">{u.name}</span>
                  <span className="text-[11.5px] text-muted-foreground">{u.meta}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          {detail.usedIn.length === 0 && <li className="border-t border-[#22252b] px-3.5 py-3 text-[13px] text-muted-foreground">Ainda não está em nenhuma ficha.</li>}
        </ul>
      </section>
      {showActions && (
        <div className="flex gap-2">
          {e.origin === 'base' ? (
            <Button variant="outline" size="lg" disabled={duplicate.isPending} onClick={doDuplicate} className="grow font-extrabold">
              Duplicar e personalizar
            </Button>
          ) : (
            <Button variant="outline" size="lg" onClick={() => toast('Editar o exercício chega em breve')} className="grow font-extrabold">
              Editar
            </Button>
          )}
          <Button size="lg" onClick={() => setSending(true)} className="grow font-extrabold">
            Enviar para aluno
          </Button>
        </div>
      )}
      <SendExerciseDrawer exercise={e} open={sending} onOpenChange={setSending} />
    </div>
  )
}
