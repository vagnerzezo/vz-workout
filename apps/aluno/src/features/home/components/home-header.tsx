import { Link } from 'react-router'
import { Bell, MessageCircle } from 'lucide-react'
import { greetingFor, homeDateLabel } from '@workspace/core'

type HomeHeaderProps = {
  firstName: string
  now: Date
  unreadNotifications: number
  hasUnreadMessages: boolean
}

const iconLink =
  'relative flex size-11 items-center justify-center rounded-full border bg-card text-foreground outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50'

export function HomeHeader({ firstName, now, unreadNotifications, hasUnreadMessages }: HomeHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-[13px] text-muted-foreground">{homeDateLabel(now)}</p>
        <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.4px]">
          {greetingFor(now)}, {firstName}
        </h1>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          to="/notificacoes"
          className={iconLink}
          aria-label={unreadNotifications > 0 ? `Notificações, ${unreadNotifications} novas` : 'Notificações'}
        >
          <Bell aria-hidden="true" className="size-5" strokeWidth={1.8} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.25 right-1.25 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>
        <Link
          to="/chat"
          className={iconLink}
          aria-label={hasUnreadMessages ? 'Mensagens do treinador, há mensagens novas' : 'Mensagens do treinador'}
        >
          <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.8} />
          {hasUnreadMessages && (
            <span className="absolute top-2.25 right-2.5 size-2 rounded-full border-2 border-card bg-primary" />
          )}
        </Link>
        <Link
          to="/perfil"
          aria-label="Abrir perfil"
          className="flex size-11 items-center justify-center rounded-full bg-primary text-base font-extrabold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {firstName.charAt(0).toUpperCase()}
        </Link>
      </div>
    </header>
  )
}
