import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

type SearchBoxProps = {
  placeholder: string
  /** Mostra o "Ctrl K" e atende o atalho (só no desktop) */
  shortcut?: boolean
  className?: string
}

/** Busca do topo: por enquanto leva para a lista de alunos já filtrada (`/alunos?busca=`). */
export function SearchBox({ placeholder, shortcut = false, className }: SearchBoxProps) {
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    if (!shortcut) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut])

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        const q = text.trim()
        navigate(q ? `/alunos?busca=${encodeURIComponent(q)}` : '/alunos')
      }}
      className={cn('flex h-11.5 items-center gap-2.5 rounded-full border bg-card px-4 focus-within:ring-3 focus-within:ring-ring/50 lg:h-11', className)}
    >
      <Search aria-hidden="true" className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={2} />
      <input
        ref={input}
        type="search"
        aria-label="Buscar"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-w-0 grow bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {shortcut && (
        <kbd className="flex h-6 items-center rounded-md border border-input px-2 font-sans text-[11px] font-bold text-muted-foreground">Ctrl K</kbd>
      )}
    </form>
  )
}
