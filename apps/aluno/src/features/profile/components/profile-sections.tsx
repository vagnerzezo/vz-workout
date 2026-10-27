import { Link } from 'react-router'
import { ArrowRight, ClipboardList, History, Image, LineChart, MessageCircle } from 'lucide-react'
import type { StudentProfile } from '@workspace/core'
import { ageOn, dueLabel, formatDecimal, formatDeltaKg, formatInt, initials, parseIsoDate, shortDate, timeSince, weightProgress } from '@workspace/core'
import { LogWeightDrawer } from '../../../shared/components/log-weight-drawer'
import { SurfaceCard } from '../../../shared/components/surface-card'

export function ProfileCard({ profile, today }: { profile: StudentProfile; today: Date }) {
  const stats = [
    { value: formatInt(profile.totalWorkouts), label: profile.totalWorkouts === 1 ? 'treino feito' : 'treinos feitos' },
    { value: profile.streakDays === 1 ? '1 dia' : `${profile.streakDays} dias`, label: 'de sequência' },
    { value: timeSince(profile.memberSince, today), label: 'na consultoria' },
  ]
  return (
    <SurfaceCard role="region" aria-label="Seus dados" className="gap-4 rounded-[22px] p-4.5">
      <div className="flex items-center gap-3.5">
        <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-primary-foreground">
          {initials(profile.fullName)}
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold">{profile.fullName}</h2>
          <p className="text-[13px] text-muted-foreground">
            {profile.goal} · {profile.level} · {ageOn(profile.birthDate, today)} anos
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 border-t pt-3.5">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-0.5">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="text-xl font-extrabold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </SurfaceCard>
  )
}

export function CheckInCard({ checkIn, coachFirstName, today }: { checkIn: NonNullable<StudentProfile['checkIn']>; coachFirstName: string; today: Date }) {
  return (
    <section aria-labelledby="check-in" className="flex flex-col gap-3 rounded-[22px] bg-primary p-4.5 text-primary-foreground">
      <div className="flex items-center justify-between gap-2">
        <h2 id="check-in" className="text-xs font-extrabold tracking-[1.4px] uppercase">
          {checkIn.label}
        </h2>
        <span className="flex h-6.5 items-center rounded-full bg-primary-foreground/12 px-2.5 text-xs font-extrabold">{dueLabel(checkIn.dueDate, today)}</span>
      </div>
      <p className="text-[15px] leading-[1.4] font-semibold">
        Envie {checkIn.photoCount} fotos e responda {checkIn.questionCount} perguntas para o {coachFirstName} ajustar o próximo bloco.
      </p>
      <Link
        to="/perfil/check-in"
        className="flex h-12.5 items-center justify-center gap-2 rounded-full bg-background text-[15px] font-extrabold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-background/50"
      >
        Fazer check-in
        <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
      </Link>
    </section>
  )
}

export function CoachCard({ profile }: { profile: StudentProfile }) {
  const { coach, subscription } = profile
  return (
    <SurfaceCard role="region" aria-label="Seu treinador" className="flex-row items-center gap-3 rounded-[20px] px-4 py-3.5">
      <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-secondary text-[15px] font-extrabold">
        {initials(coach.name)}
      </span>
      <div className="flex grow flex-col gap-0.5">
        <span className="text-[15px] font-extrabold">{coach.name}</span>
        <span className="text-xs text-muted-foreground">
          Seu treinador{subscription && ` · plano ${subscription.planLabel} até ${shortDate(parseIsoDate(subscription.endsAt))}`}
        </span>
      </div>
      <Link
        to="/chat"
        aria-label="Conversar com o treinador"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/14 text-primary outline-none hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.9} />
      </Link>
    </SurfaceCard>
  )
}

const weighButton =
  'flex h-9 items-center gap-1 rounded-full border border-line-strong px-3.5 text-[13px] font-bold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5'

export function WeightGoalCard({ goal, currentKg }: { goal: NonNullable<StudentProfile['weightGoal']>; currentKg: number | null }) {
  const progress = currentKg !== null ? weightProgress(goal.startKg, currentKg, goal.goalKg) : null
  return (
    <SurfaceCard role="region" aria-labelledby="objetivo-peso" className="gap-3.5 rounded-[22px] p-4.5">
      <div className="flex items-center justify-between">
        <h2 id="objetivo-peso" className="text-[15px] font-bold">
          Objetivo de peso
        </h2>
        <LogWeightDrawer lastWeightKg={currentKg ?? goal.startKg} trigger={<button type="button" className={weighButton} />} triggerLabel="Pesagem" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Atual</span>
          <span className="text-[32px] leading-tight font-extrabold tracking-[-0.8px]">{currentKg !== null ? `${formatDecimal(currentKg)} kg` : '—'}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground">Meta</span>
          <span className="text-[32px] leading-tight font-extrabold tracking-[-0.8px] text-primary">{formatKgShort(goal.goalKg)} kg</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div
          role="progressbar"
          aria-label="Progresso até a meta de peso"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress?.percent ?? 0}
          className="h-2.5 overflow-hidden rounded-full bg-border"
        >
          <div className="h-2.5 rounded-full bg-primary" style={{ width: `${progress?.percent ?? 0}%` }} />
        </div>
        <div className="flex justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Início {formatDecimal(goal.startKg)} kg · {shortDate(parseIsoDate(goal.startDate))}
          </span>
          <span>
            {progress && currentKg !== null
              ? `${currentKg === goal.startKg ? '0' : formatDeltaKg(currentKg - goal.startKg)} kg de ${formatKgShort(progress.totalKg)} kg`
              : 'Registre seu peso'}
          </span>
        </div>
      </div>
    </SurfaceCard>
  )
}

/** 85 → "85" · 75.5 → "75,5": a meta não precisa de ",0" */
const formatKgShort = (kg: number) => (Number.isInteger(kg) ? formatInt(kg) : formatDecimal(kg))

const links = [
  { to: '/perfil/progresso', label: 'Progresso', icon: LineChart },
  { to: '/perfil/progresso?aba=fotos', label: 'Fotos de evolução', icon: Image },
  { to: '/treinos/historico', label: 'Histórico de treinos', icon: History },
  { to: '/perfil/progresso?aba=check-ins', label: 'Check-ins anteriores', icon: ClipboardList },
]

export function ProfileLinks() {
  return (
    <nav aria-label="Seu acompanhamento" className="grid grid-cols-2 gap-2.5">
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={label}
          to={to}
          className="flex min-h-16 items-center gap-3 rounded-2xl border bg-card px-4 text-sm font-bold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Icon aria-hidden="true" className="size-5.5 shrink-0" strokeWidth={1.8} />
          {label}
        </Link>
      ))}
    </nav>
  )
}

