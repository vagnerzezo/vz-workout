import { groupInitials, initials } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

/** Aluno: círculo com iniciais (bolinha verde se online). Grupo: quadrado roxo. */
export function ConversationAvatar({ title, group, online = false, size = 'md' }: { title: string; group: boolean; online?: boolean; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex shrink-0 items-center justify-center font-extrabold',
        size === 'md' ? 'size-12.5 text-sm' : 'size-10 text-[13px]',
        group ? 'rounded-2xl bg-violet/18 text-violet' : 'rounded-full border border-input bg-secondary',
      )}
    >
      {group ? groupInitials(title) : initials(title)}
      {online && <span className="absolute right-0 bottom-0 size-3.25 rounded-full border-2 border-background bg-primary" />}
    </span>
  )
}
