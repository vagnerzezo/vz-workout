import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

export const field =
  'h-13 w-full rounded-2xl border bg-card px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

/** Senha com o botão "mostrar" (o celular não tem como conferir o que digitou). */
export function PasswordInput({ className, ...props }: ComponentProps<'input'>) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative block">
      <input {...props} type={show ? 'text' : 'password'} className={cn(field, 'pr-14', className)} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
        className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-xl text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {show ? <EyeOff aria-hidden="true" className="size-5" strokeWidth={2} /> : <Eye aria-hidden="true" className="size-5" strokeWidth={2} />}
      </button>
    </span>
  )
}

export function FormError({ children }: { children: string }) {
  return (
    <p role="alert" className="rounded-xl border border-destructive/45 bg-destructive/10 px-3 py-2.5 text-[13px] leading-[1.45] text-destructive">
      {children}
    </p>
  )
}

/** Regras da senha nova com check verde quando cumpridas. */
export function PasswordRules({ rules }: { rules: { label: string; ok: boolean }[] }) {
  return (
    <ul aria-label="Regras da senha" className="flex flex-col gap-1.5">
      {rules.map((r) => (
        <li key={r.label} className={cn('flex items-center gap-2 text-[13px]', r.ok ? 'text-foreground' : 'text-muted-foreground')}>
          <span aria-hidden="true" className={cn('flex size-4.5 items-center justify-center rounded-full text-[11px] font-extrabold text-primary-foreground', r.ok ? 'bg-primary' : 'bg-secondary')}>
            {r.ok ? '✓' : ''}
          </span>
          {r.label}
          <span className="sr-only">{r.ok ? ' (ok)' : ' (falta)'}</span>
        </li>
      ))}
    </ul>
  )
}
