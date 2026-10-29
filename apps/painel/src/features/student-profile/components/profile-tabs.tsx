import { Link } from 'react-router'
import { cn } from '@workspace/ui/lib/utils'

export type ProfileTab = 'resumo' | 'treino' | 'dieta' | 'historico' | 'avaliacao' | 'check-ins' | 'info'

/** Seção 7.2 do guia: a aba fica no `?aba=` (recarregar mantém, o voltar funciona). Rótulo do desktop e do celular. */
export const profileTabs: { id: ProfileTab; label: [string, string] }[] = [
  { id: 'resumo', label: ['Resumo', 'Resumo'] },
  { id: 'treino', label: ['Treino', 'Treino'] },
  { id: 'dieta', label: ['Dieta', 'Dieta'] },
  { id: 'historico', label: ['Histórico', 'Histórico'] },
  { id: 'avaliacao', label: ['Avaliação física', 'Avaliação'] },
  { id: 'check-ins', label: ['Check-ins', 'Check-ins'] },
  { id: 'info', label: ['Informações', 'Info'] },
]

export function ProfileTabs({ current, pendingCheckIns }: { current: ProfileTab; pendingCheckIns: number }) {
  return (
    <nav aria-label="Seções do aluno" className="-mx-4 flex gap-1 overflow-x-auto border-b border-secondary px-4 lg:mx-0 lg:px-0">
      {profileTabs.map((t) => {
        const on = t.id === current
        return (
          <Link
            key={t.id}
            to={`?aba=${t.id}`}
            replace
            preventScrollReset
            aria-current={on ? 'page' : undefined}
            className={cn(
              '-mb-px flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-extrabold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:px-3.5',
              on ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label[0] === t.label[1] ? (
              t.label[0]
            ) : (
              <>
                <span className="hidden lg:inline">{t.label[0]}</span>
                <span className="lg:hidden">{t.label[1]}</span>
              </>
            )}
            {t.id === 'check-ins' && pendingCheckIns > 0 && (
              <span aria-label={`${pendingCheckIns} aguardando resposta`} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-extrabold text-primary-foreground">
                {pendingCheckIns}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
