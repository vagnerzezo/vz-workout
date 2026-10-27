import type { ComponentType, SVGProps } from "react"
import { NavLink } from "react-router"
import { cn } from "cn"

export type BottomNavItem = {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Só marca ativo na rota exata (use no "/") */
  end?: boolean
}

/** Barra inferior flutuante do app do aluno (4 itens) e do painel mobile. */
export function BottomNav({
  items,
  label = "Navegação principal",
  className,
}: {
  items: BottomNavItem[]
  label?: string
  className?: string
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "grid h-18 rounded-full border border-input bg-card/95 p-1.5 backdrop-blur",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-0.75 rounded-full text-[11px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "bg-primary/15 font-extrabold text-primary"
                : "font-bold text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Icon aria-hidden="true" className="size-5.5" strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
