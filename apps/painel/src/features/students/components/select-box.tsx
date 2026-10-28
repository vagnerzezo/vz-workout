import { Checkbox } from '@workspace/ui/components/checkbox'
import { cn } from '@workspace/ui/lib/utils'

type SelectBoxProps = {
  label: string
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  className?: string
}

/** Caixa de seleção do tamanho do canvas (22 px, borda forte). */
export function SelectBox({ label, checked, indeterminate = false, onChange, className }: SelectBoxProps) {
  return (
    <Checkbox
      aria-label={label}
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={(v) => onChange(v === true)}
      className={cn('size-5.5 rounded-[6px] border-2 border-line-strong data-checked:border-primary data-indeterminate:border-primary [&_svg]:size-3.5 [&_svg]:stroke-[3.6]', className)}
    />
  )
}
