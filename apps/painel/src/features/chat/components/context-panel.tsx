import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { formatDecimal, initials, lastWorkoutLabel, parseIsoDate, shortDate, yearMonthOf, type CoachConversation } from '@workspace/core'
import { buttonVariants } from '@workspace/ui/components/button'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { useStudent } from '../../student-profile/api/queries'
import { useConversationSetting } from '../api/queries'

/** Notas privadas: salvam ao sair do campo. */
function Notes({ conversation: c }: { conversation: CoachConversation }) {
  const [value, setValue] = useState(c.notes)
  const save = useConversationSetting(c.id, 'notes')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`notas-${c.id}`} className="text-sm font-extrabold">
        Notas privadas
      </label>
      <span className="text-[11.5px] text-muted-foreground">Só você vê. O aluno não tem acesso.</span>
      <textarea
        id={`notas-${c.id}`}
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => value !== c.notes && save.mutate({ notes: value }, { onSuccess: () => toast.success('Notas salvas'), onError: () => toast.error('Não foi possível salvar as notas.') })}
        className="rounded-xl border bg-background p-3 text-[13px] leading-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  )
}

function StudentContext({ conversation: c }: { conversation: CoachConversation }) {
  const detail = useStudent(c.studentId!)
  const mute = useConversationSetting(c.id, 'muted')
  const d = detail.data
  const now = new Date()
  const weight = d?.weights.at(-1)?.kg
  const stats = d
    ? [
        { k: 'Adesão 30 dias', v: d.student.adherence30d === null ? '—' : `${Math.round(d.student.adherence30d)}%` },
        { k: 'Último treino', v: lastWorkoutLabel(d.student.lastWorkoutOn, now) },
        { k: 'Peso', v: weight ? `${formatDecimal(weight)} kg` : '—' },
        { k: 'Próximo check-in', v: d.nextCheckInOn ? shortDate(parseIsoDate(d.nextCheckInOn)) : '—' },
      ]
    : []
  const since = d ? yearMonthOf(parseIsoDate(d.memberSince)).split('-').reverse().join('/') : ''
  const link = cn(buttonVariants({ variant: 'outline', className: 'h-10 justify-start font-bold' }))
  return (
    <>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full border border-input bg-secondary text-lg font-extrabold">
          {initials(c.title)}
        </span>
        <span className="text-base font-extrabold">{c.title}</span>
        {d && <span className="text-xs text-muted-foreground">{[...d.student.tags.slice(0, 2), `desde ${since}`].join(' · ')}</span>}
      </div>
      <dl aria-label="Resumo do aluno" className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.k} className="flex flex-col gap-px rounded-xl bg-secondary px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">{s.k}</dt>
            <dd className="text-sm font-extrabold">{s.v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1.5">
        <Link to={`/alunos/${c.studentId}`} className={link}>
          Abrir perfil do aluno
        </Link>
        <Link to={`/alunos/${c.studentId}?aba=check-ins`} className={link}>
          Ver último check-in
        </Link>
        <Link to={`/alunos/${c.studentId}?aba=treino`} className={link}>
          Editar ficha de treino
        </Link>
        <Link to={`/alunos/${c.studentId}?aba=dieta`} className={link}>
          Ver dieta
        </Link>
      </div>
      <Notes conversation={c} />
      <label className="flex items-center justify-between gap-3 text-[13px] font-bold">
        Silenciar notificações desta conversa
        <Switch checked={c.muted} onCheckedChange={(v) => mute.mutate({ muted: v })} />
      </label>
    </>
  )
}

function GroupContext({ conversation: c }: { conversation: CoachConversation }) {
  const onlyCoach = useConversationSetting(c.id, 'only-coach')
  const g = c.group!
  return (
    <>
      <p className="text-[13px] leading-normal text-foreground-2">{g.description}</p>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-extrabold">Membros ({g.memberCount})</span>
        <div className="flex flex-wrap gap-1.5">
          {g.members.map((m) => (
            <span key={m} title={m} className="flex size-9 items-center justify-center rounded-full border border-input bg-secondary text-[11px] font-extrabold">
              {initials(m)}
            </span>
          ))}
          {g.memberCount > g.members.length && <span className="flex h-9 items-center px-1 text-xs font-bold text-muted-foreground">+{g.memberCount - g.members.length}</span>}
        </div>
      </div>
      <label className="flex items-center justify-between gap-3 text-[13px] font-bold">
        Só o treinador envia
        <Switch checked={g.onlyCoach} onCheckedChange={(v) => onlyCoach.mutate({ onlyCoach: v })} />
      </label>
      <button type="button" onClick={() => toast('Gerenciar membros chega em breve')} className={cn(buttonVariants({ variant: 'outline', className: 'h-10 font-bold' }))}>
        Gerenciar membros
      </button>
    </>
  )
}

/** Desktop: coluna da direita. Celular: dentro da folha "Contexto do aluno". */
export function ContextPanel({ conversation: c }: { conversation: CoachConversation }) {
  return <div className="flex flex-col gap-4">{c.kind === 'group' ? <GroupContext conversation={c} /> : <StudentContext key={c.id} conversation={c} />}</div>
}
