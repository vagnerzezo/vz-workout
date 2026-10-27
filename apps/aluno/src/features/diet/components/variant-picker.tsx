import { useRef, type KeyboardEvent } from 'react'
import type { DietVariant } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

type VariantPickerProps = {
  variants: DietVariant[]
  value: string
  onChange: (id: string) => void
}

/**
 * Escolha da ficha do dia. É um radiogroup de verdade: Tab entra só na opção marcada
 * e as setas trocam de opção, como num grupo de rádios nativo.
 */
export function VariantPicker({ variants, value, onChange }: VariantPickerProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (index + step + variants.length) % variants.length
    onChange(variants[next]!.id)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Ficha de dieta" className="flex flex-wrap gap-2">
      {variants.map((v, i) => {
        const on = v.id === value
        return (
          <button
            key={v.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => !on && onChange(v.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'h-9 rounded-full border px-3.5 text-[13px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              on ? 'border-primary bg-primary/15 text-primary' : 'border-input text-foreground-2 hover:bg-accent',
            )}
          >
            {v.label}
          </button>
        )
      })}
    </div>
  )
}
