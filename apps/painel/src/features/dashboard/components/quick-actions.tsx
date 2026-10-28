import { Link } from 'react-router'
import { Dumbbell, Plus, Send, Wallet, type LucideIcon } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

const actions: { to: string; label: string; icon: LucideIcon; primary?: boolean }[] = [
  { to: '/alunos/novo', label: 'Aluno', icon: Plus, primary: true },
  { to: '/fichas/nova', label: 'Nova ficha', icon: Dumbbell },
  { to: '/notificacoes/nova', label: 'Notificar', icon: Send },
  { to: '/financeiro', label: 'Lançar pagamento', icon: Wallet },
]

/** Atalhos do celular (o desktop tem o "Novo aluno" no topo). */
export function QuickActions() {
  return (
    <nav aria-label="Atalhos" className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
      {actions.map(({ to, label, icon: Icon, primary }) => (
        <Link
          key={to}
          to={to}
          aria-label={primary ? 'Cadastrar aluno' : undefined}
          className={cn(
            'flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-extrabold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            primary ? 'border-primary bg-primary text-primary-foreground' : 'bg-card',
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
