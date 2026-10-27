import { Link } from 'react-router'
import { CalendarDays, ChartLine, Dumbbell, Ruler } from 'lucide-react'

const shortcuts = [
  { to: '/perfil/progresso', label: 'Estatísticas', icon: ChartLine },
  { to: '/treinos', label: 'Exercícios', icon: Dumbbell },
  { to: '/perfil/progresso', label: 'Medidas', icon: Ruler },
  { to: '/treinos/historico', label: 'Calendário', icon: CalendarDays },
]

export function Shortcuts() {
  return (
    <section aria-labelledby="atalhos" className="flex flex-col gap-2.5">
      <h2 id="atalhos" className="text-[15px] font-bold text-muted-foreground">
        Painel
      </h2>
      <ul className="grid grid-cols-2 gap-2.5">
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <li key={label}>
            <Link
              to={to}
              className="flex h-15 items-center gap-3 rounded-2xl border bg-card px-4 text-[15px] font-bold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Icon aria-hidden="true" className="size-5.5" strokeWidth={1.8} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
