import type { ComponentType, SVGProps } from "react"
import { NavLink } from "react-router"
import { cn } from "cn"

type Icon = ComponentType<SVGProps<SVGSVGElement>>

export type BottomNavItem = {
  label: string
  icon: Icon
  /** Contador no canto do ícone (o painel mostra check-ins e conversas) */
  badge?: number
} & (
  | {
      to: string
      /** Só marca ativo na rota exata (use no "/") */
      end?: boolean
    }
  | {
      /** Item que abre algo em vez de navegar (o "Mais" do painel) */
      onSelect: () => void
      active?: boolean
    }
)

const itemClass = (active: boolean) =>
  cn(
    "relative flex flex-col items-center justify-center gap-0.75 rounded-full text-[11px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    active
      ? "bg-primary/15 font-extrabold text-primary"
      : "font-bold text-muted-foreground hover:text-foreground"
  )

function Content({ label, icon: Icon, badge }: BottomNavItem) {
  return (
    <>
      <Icon aria-hidden="true" className="size-5.5" strokeWidth={2} />
      {label}
      {!!badge && (
        <span className="absolute top-1 right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
          {badge}
        </span>
      )}
    </>
  )
}

/** Barra inferior flutuante do app do aluno (4 itens) e do painel mobile (5, com "Mais"). */
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
      {items.map((item) =>
        "to" in item ? (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            aria-label={item.badge ? `${item.label}, ${item.badge} novos` : undefined}
            className={({ isActive }) => itemClass(isActive)}
          >
            <Content {...item} />
          </NavLink>
        ) : (
          <button
            key={item.label}
            type="button"
            onClick={item.onSelect}
            aria-expanded={item.active ?? false}
            className={itemClass(item.active ?? false)}
          >
            <Content {...item} />
          </button>
        )
      )}
    </nav>
  )
}
