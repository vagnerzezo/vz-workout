import { Minus, Plus } from "lucide-react"
import { Button } from "../components/button"

type StepperProps = {
  value: number
  onChange: (next: number) => void
  label: string // obrigatório: vira o aria-label do grupo e dos botões
  min?: number
  max?: number
  step?: number
  format?: (v: number) => string
}

export function Stepper({
  value,
  onChange,
  label,
  min = 0,
  max = Infinity,
  step = 1,
  format = String,
}: StepperProps) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)))
  return (
    <div
      role="group"
      aria-label={label}
      className="flex h-11 items-center gap-1 rounded-full border border-input px-1"
    >
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label={`Diminuir ${label}`}
        disabled={value <= min}
        onClick={() => set(value - step)}
      >
        <Minus />
      </Button>
      <output aria-live="polite" className="min-w-14 flex-1 text-center text-[15px] font-extrabold">
        {format(value)}
      </output>
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label={`Aumentar ${label}`}
        disabled={value >= max}
        onClick={() => set(value + step)}
      >
        <Plus />
      </Button>
    </div>
  )
}
