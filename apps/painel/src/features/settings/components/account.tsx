import { toast } from 'sonner'
import { formatBRL, parseIsoDate, shortDate, type CoachSettings } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Switch } from '@workspace/ui/components/switch'
import { useCoach } from '../../../shared/api/coach'
import { useEndSession } from '../api/queries'
import { soon } from './fields'

/** Uso do plano: alunos ativos contra o limite (arquivados não contam). */
export function PlanUsage({ plan }: { plan: CoachSettings['plan'] }) {
  const { data: coach } = useCoach()
  const active = coach?.activeStudents ?? 0
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border bg-card p-4">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-extrabold">
          Plano {plan.name} · {formatBRL(plan.price)}/mês
        </span>
        <span className="text-xs text-muted-foreground">renova {shortDate(parseIsoDate(plan.renewsOn))}</span>
      </span>
      <span className="text-[13px] text-foreground-2">
        <strong className="text-lg text-foreground">{active}</strong> de {plan.studentLimit} alunos ativos · faltam {Math.max(0, plan.studentLimit - active)} vagas
      </span>
      <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (active / plan.studentLimit) * 100)}%` }} />
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] text-muted-foreground">Alunos arquivados não contam no limite</span>
        <Button size="sm" variant="outline" onClick={() => soon('A troca de plano')} className="font-bold">
          Mudar de plano
        </Button>
      </span>
    </div>
  )
}

export function Sessions({ sessions }: { sessions: CoachSettings['security']['sessions'] }) {
  const end = useEndSession()
  return (
    <ul aria-label="Sessões ativas" className="flex flex-col">
      {sessions.map((s) => (
        <li key={s.id} className="flex items-center gap-3 border-b border-[#22252b] py-3 last:border-b-0">
          <span className="flex min-w-0 grow flex-col gap-0.5">
            <span className="text-sm font-bold">{s.device}</span>
            <span className={s.current ? 'text-xs text-primary' : 'text-xs text-muted-foreground'}>{s.current ? `${s.meta} · esta sessão` : s.meta}</span>
          </span>
          {!s.current && (
            <Button
              size="sm"
              variant="outline"
              aria-label={`Encerrar ${s.device}`}
              disabled={end.isPending}
              onClick={() => end.mutate(s.id, { onSuccess: () => toast.success('Sessão encerrada'), onError: () => toast.error('Não foi possível encerrar a sessão.') })}
              className="shrink-0 font-bold"
            >
              Encerrar
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Desktop: plano, segurança e LGPD. As sessões vêm da query (encerrar não passa pelo "Salvar"). */
export function AccountSection({ value, sessions, onTwoFactor }: { value: CoachSettings; sessions: CoachSettings['security']['sessions']; onTwoFactor: (on: boolean) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <PlanUsage plan={value.plan} />
      <section aria-labelledby="seg-titulo" className="flex flex-col gap-2">
        <h3 id="seg-titulo" className="text-[15px] font-extrabold">
          Segurança
        </h3>
        <label className="flex items-center gap-3 border-b border-[#22252b] py-3">
          <span className="flex grow flex-col gap-0.5">
            <span className="text-sm font-bold">Verificação em duas etapas</span>
            <span className="text-xs text-muted-foreground">{value.security.twoFactor ? 'Código do app autenticador ao entrar no painel' : 'Desligada · recomendamos ligar'}</span>
          </span>
          <Switch checked={value.security.twoFactor} onCheckedChange={onTwoFactor} />
        </label>
        <Sessions sessions={sessions} />
      </section>
      <section aria-labelledby="lgpd-titulo" className="flex flex-col gap-2">
        <h3 id="lgpd-titulo" className="text-[15px] font-extrabold">
          Dados e privacidade (LGPD)
        </h3>
        {(
          [
            ['Exportar dados', 'Alunos, fichas, check-ins e pagamentos em CSV e JSON', 'Solicitar exportação', () => toast.success('Exportação solicitada. O arquivo chega por e-mail em até 24 h')],
            ['Termo de consentimento do aluno', 'Aceito no primeiro acesso: uso de fotos, medidas e dados de saúde', 'Editar termo', () => soon('A edição do termo')],
            ['Excluir conta', 'Apaga o painel e os dados dos alunos após 30 dias', 'Excluir conta', () => soon('A exclusão da conta')],
          ] as const
        ).map(([title, hint, action, run]) => (
          <div key={title} className="flex items-center gap-3 border-b border-[#22252b] py-3 last:border-b-0">
            <span className="flex grow flex-col gap-0.5">
              <span className="text-sm font-bold">{title}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </span>
            <Button size="sm" variant={title === 'Excluir conta' ? 'destructive' : 'outline'} onClick={run} className="shrink-0 font-bold">
              {action}
            </Button>
          </div>
        ))}
      </section>
    </div>
  )
}
