import { Link } from 'react-router'
import { toast } from 'sonner'
import { Bell, ChevronLeft, MessageCircle, MoreHorizontal, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { adherenceTone, ageOn, initials, parseIsoDate, shortDate, type StudentDetail } from '@workspace/core'
import { RingProgress } from '@workspace/ui/blocks/ring-progress'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'
import { cn } from '@workspace/ui/lib/utils'
import { useTagStudents } from '../../students/api/queries'
import { adherenceStroke, statusBadge } from '../../students/components/tones'

type ProfileHeaderProps = {
  detail: StudentDetail
  now: Date
  filterTags: string[]
  onArchive: () => void
  onUnarchive: () => void
}

const outline = 'border-line-strong bg-transparent font-bold'

/** Só os dígitos, com o 55 do Brasil: o formato que o wa.me aceita. */
const whatsappUrl = (phone: string) => `https://wa.me/55${phone.replace(/\D/g, '')}`

export function ProfileHeader({ detail: d, now, filterTags, onArchive, onUnarchive }: ProfileHeaderProps) {
  const s = d.student
  const badge = statusBadge[s.status]
  const age = d.birthDate ? `${ageOn(d.birthDate, now)} anos` : null
  const tag = useTagStudents()
  const missingTags = filterTags.filter((t) => !s.tags.includes(t))

  const addTag = (t: string) =>
    tag.mutate(
      { ids: [s.id], tag: t },
      { onSuccess: () => toast.success(`Tag "${t}" adicionada`), onError: () => toast.error('Não foi possível adicionar a tag. Tente de novo.') },
    )

  return (
    <>
      <Link to="/alunos" className="flex w-fit items-center gap-1 rounded-md text-[13px] font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronLeft aria-hidden="true" className="size-4" />
        Alunos
      </Link>
      <header className="flex flex-col gap-3.5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center gap-3.5 lg:gap-4">
          {/* Celular: anel de adesão em volta das iniciais. Desktop: só as iniciais (a adesão está nos números). */}
          <RingProgress
            value={(s.adherence30d ?? 0) / 100}
            label={s.adherence30d === null ? 'Sem dados de adesão' : `Adesão de ${Math.round(s.adherence30d)}% em 30 dias`}
            size={72}
            strokeWidth={4}
            indicatorClassName={adherenceStroke[adherenceTone(s.adherence30d)]}
            className="lg:hidden"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-lg font-extrabold">{initials(s.fullName)}</span>
          </RingProgress>
          <span aria-hidden="true" className="hidden size-16 shrink-0 items-center justify-center rounded-full border border-input bg-secondary text-xl font-extrabold lg:flex">
            {initials(s.fullName)}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-extrabold tracking-[-0.4px] lg:text-[26px]">{s.fullName}</h1>
              <span className={cn('flex h-6 items-center rounded-full px-2.25 text-[11px] font-extrabold', badge.className)}>{badge.label}</span>
            </div>
            <span className="hidden text-[13px] text-muted-foreground lg:block">{[s.email, d.phone, age].filter(Boolean).join(' · ')}</span>
            <span className="text-[13px] text-foreground-2 lg:hidden">{[age, ...s.tags].filter(Boolean).join(' · ')}</span>
            <span className="text-xs text-muted-foreground lg:hidden">
              Aluno desde {format(parseIsoDate(d.memberSince), 'MM/yyyy')} · plano até {shortDate(parseIsoDate(d.subscription.endsOn))}
            </span>
            <div className="mt-1 hidden flex-wrap gap-1.5 lg:flex">
              {s.tags.map((t) => (
                <span key={t} className="flex h-6 items-center rounded-full border border-input px-2.5 text-xs font-bold text-foreground-2">
                  {t}
                </span>
              ))}
              {missingTags.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-6 items-center rounded-full border border-dashed border-line-strong px-2.5 text-xs font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                    + tag
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-40">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Adicionar a tag</DropdownMenuLabel>
                      {missingTags.map((t) => (
                        <DropdownMenuItem key={t} onClick={() => addTag(t)}>
                          {t}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:flex lg:flex-wrap">
          {s.conversationId && (
            <Link to={`/chat/${s.conversationId}`} className={cn(buttonVariants({ className: 'h-11' }))}>
              <MessageCircle aria-hidden="true" />
              Mensagem
            </Link>
          )}
          <Link to={`/notificacoes/nova?alunos=${s.id}`} className={cn(buttonVariants({ variant: 'outline', className: cn('h-11', outline) }))}>
            <Bell aria-hidden="true" className="lg:hidden" />
            Notificar
          </Link>
          {d.phone && (
            <a href={whatsappUrl(d.phone)} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: 'outline', className: cn('h-11 lg:hidden', outline) }))}>
              <Phone aria-hidden="true" />
              WhatsApp
            </a>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Mais ações" className={cn('hidden lg:inline-flex', outline)} />}>
              <MoreHorizontal aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {d.phone && <DropdownMenuItem render={<a href={whatsappUrl(d.phone)} target="_blank" rel="noreferrer" />}>Abrir WhatsApp</DropdownMenuItem>}
              {s.status === 'archived' ? (
                <DropdownMenuItem onClick={onUnarchive}>Reativar</DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive" onClick={onArchive}>
                  Arquivar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  )
}
