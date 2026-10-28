import type { ReactNode } from "react"
import { cn } from "cn"

type RingProgressProps = {
  /** 0 a 1; valores acima de 1 desenham o anel cheio */
  value: number
  /** Descreve os números para o leitor de tela: "1.240 de 2.127 kcal consumidas" */
  label: string
  size?: number
  strokeWidth?: number
  /** Conteúdo no centro do anel */
  children?: ReactNode
  className?: string
  /** Cor do arco (padrão: a da marca). A lista de alunos pinta pela faixa de adesão. */
  indicatorClassName?: string
}

/** Anel de progresso em SVG puro (sem biblioteca de gráfico, para a Home ficar leve). */
export function RingProgress({
  value,
  label,
  size = 92,
  strokeWidth = 8,
  children,
  className,
  indicatorClassName = "stroke-primary",
}: RingProgressProps) {
  const r = (size - strokeWidth) / 2 - 1
  const c = size / 2
  const circumference = 2 * Math.PI * r
  const filled = circumference * Math.min(Math.max(value, 0), 1)

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle cx={c} cy={c} r={r} fill="none" className="stroke-border" strokeWidth={strokeWidth} />
        {filled > 0 && (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            className={cn(indicatorClassName, "motion-safe:transition-[stroke-dasharray] motion-safe:duration-500")}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            transform={`rotate(-90 ${c} ${c})`}
          />
        )}
      </svg>
      {children && (
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
