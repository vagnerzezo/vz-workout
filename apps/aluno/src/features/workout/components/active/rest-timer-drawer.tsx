import { useState } from 'react'
import { X } from 'lucide-react'
import { exerciseInitials, formatClock, formatKg, shortExerciseName } from '@workspace/core'
import { RingProgress } from '@workspace/ui/blocks/ring-progress'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@workspace/ui/components/drawer'
import { Switch } from '@workspace/ui/components/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { cn } from '@workspace/ui/lib/utils'
import { useNow } from '../../../../shared/hooks/use-now'
import type { SessionView } from '../../hooks/use-session-view'
import { restLeft, restRunning, useActiveWorkout } from '../../store/active-workout'

type RestTimerDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  next: SessionView['next']
}

const roundButton =
  'h-11 rounded-full border border-input bg-secondary px-3.5 text-[15px] font-extrabold text-primary hover:bg-accent'

export function RestTimerDrawer({ open, onOpenChange, next }: RestTimerDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-[430px] rounded-t-[28px] border-input pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col gap-3.5 overflow-y-auto px-5 pt-2.5 pb-6">
          <span aria-hidden="true" className="h-1.25 w-11 self-center rounded-full bg-line-strong" />
          <div className="grid grid-cols-[44px_1fr_44px] items-center">
            <DrawerClose
              render={<Button variant="secondary" size="icon" aria-label="Fechar timer" />}
            >
              <X aria-hidden="true" className="size-4.5" strokeWidth={2.2} />
            </DrawerClose>
            <DrawerTitle className="text-center text-[17px] font-extrabold">Descanso</DrawerTitle>
          </div>
          <Tabs defaultValue="timer" className="gap-3.5">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border bg-sunken p-1">
              <TabsTrigger value="timer" className={segment}>
                Timer
              </TabsTrigger>
              <TabsTrigger value="cronometro" className={segment}>
                Cronômetro
              </TabsTrigger>
            </TabsList>
            <TabsContent value="timer" className="flex flex-col gap-3.5">
              <RestTimer next={next} />
            </TabsContent>
            <TabsContent value="cronometro" className="flex flex-col gap-3.5">
              <Stopwatch />
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

const segment =
  'h-11 rounded-xl text-[15px] font-extrabold text-foreground data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground'

function RestTimer({ next }: { next: SessionView['next'] }) {
  const now = useNow(250)
  const rest = useActiveWorkout((s) => s.rest)
  const autoRest = useActiveWorkout((s) => s.autoRest)
  const { adjustRest, skipRest, pauseRest, resumeRest, startRest, setAutoRest } = useActiveWorkout.getState()
  const left = restLeft(rest, now)
  const running = restRunning(rest, now)

  const prescribed = next?.exercise.prescribed
  const range = next?.exercise.item.restRange
  const presets = prescribed && range
    ? [
        { label: 'Mín', seconds: range[0] },
        { label: 'Méd', seconds: prescribed.restSeconds },
        { label: 'Máx', seconds: range[1] },
      ]
    : []

  const primary = running
    ? { label: 'Pausar', run: pauseRest }
    : left > 0
      ? { label: 'Continuar', run: resumeRest }
      : { label: rest.total > 0 ? 'Reiniciar' : 'Iniciar', run: () => startRest(rest.total || prescribed?.restSeconds || 90) }

  return (
    <>
      <div className="relative flex h-63 items-center justify-center">
        <RingProgress value={rest.total ? left / rest.total : 0} size={240} strokeWidth={10} label={`Descanso: ${formatClock(left)} restantes`}>
          <span className="text-[58px] leading-none font-extrabold tracking-[-1.5px]">{formatClock(left)}</span>
          <span className="text-[13px] text-muted-foreground">de {formatClock(rest.total)}</span>
        </RingProgress>
        <Button variant="ghost" className={cn(roundButton, 'absolute bottom-1.5 left-0')} aria-label="Diminuir 15 segundos" onClick={() => adjustRest(-15)}>
          −15s
        </Button>
        <Button variant="ghost" className={cn(roundButton, 'absolute right-0 bottom-1.5')} aria-label="Aumentar 15 segundos" onClick={() => adjustRest(15)}>
          +15s
        </Button>
      </div>

      {next && <NextSetCard next={next} />}

      {presets.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-muted-foreground" id="faixa-treinador">
            Faixa do treinador
          </span>
          <div role="group" aria-labelledby="faixa-treinador" className="grid grid-cols-3 gap-2">
            {presets.map((p) => {
              const on = rest.total === p.seconds
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${p.label}: ${formatClock(p.seconds)}`}
                  onClick={() => startRest(p.seconds)}
                  className={cn(
                    'flex h-12 flex-col items-center justify-center rounded-[14px] border outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    on ? 'border-primary bg-foreground/6 text-primary' : 'border-input text-foreground hover:bg-accent',
                  )}
                >
                  <span className="text-[11px] font-bold opacity-80">{p.label}</span>
                  <span className="text-[15px] font-extrabold">{formatClock(p.seconds)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <label className="flex min-h-11 items-center justify-between gap-3 text-sm text-foreground-2">
        Iniciar ao concluir a série
        <Switch size="lg" checked={autoRest} onCheckedChange={setAutoRest} />
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="outline" size="xl" onClick={skipRest} disabled={left === 0}>
          Pular descanso
        </Button>
        <Button size="xl" onClick={primary.run}>
          {primary.label}
        </Button>
      </div>
    </>
  )
}

function NextSetCard({ next }: { next: NonNullable<SessionView['next']> }) {
  const { exercise, set } = next
  const name = shortExerciseName(exercise.exercise.name)
  const which = set.kind === 'working' ? `Série ${set.label}` : set.kind === 'warmup' ? 'Aquecimento' : 'Preparatória'
  const target = `Meta ${formatKg(set.entry?.kg ?? set.suggestion.kg)} kg × ${exercise.prescribed.reps}`
  const previous = set.previous ? ` · anterior ${formatKg(set.previous.kg)} kg × ${set.previous.reps}` : ''

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary px-3.5 py-3">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sunken text-[13px] font-extrabold text-foreground-2">
        {exerciseInitials(exercise.exercise.name)}
      </span>
      <div className="flex grow flex-col gap-px">
        <span className="text-[11px] font-extrabold tracking-[1.2px] text-muted-foreground">PRÓXIMA SÉRIE</span>
        <span className="text-sm font-extrabold">
          {name} · {which}
        </span>
        <span className="text-[13px] text-muted-foreground">
          {target}
          {previous}
        </span>
      </div>
    </div>
  )
}

/** Cronômetro livre: só desta tela, não precisa sobreviver ao app fechar. */
function Stopwatch() {
  const now = useNow(250)
  const [clock, setClock] = useState<{ startedAt: number | null; accumulated: number }>({ startedAt: null, accumulated: 0 })
  const running = clock.startedAt !== null
  const seconds = Math.floor((clock.accumulated + (running ? now - clock.startedAt! : 0)) / 1000)

  const toggle = () =>
    setClock((c) =>
      c.startedAt === null
        ? { ...c, startedAt: Date.now() }
        : { startedAt: null, accumulated: c.accumulated + Date.now() - c.startedAt },
    )

  return (
    <>
      <div className="flex h-63 items-center justify-center">
        <RingProgress value={(seconds % 60) / 60} size={240} strokeWidth={10} label={`Cronômetro: ${formatClock(seconds)}`}>
          <span className="text-[58px] leading-none font-extrabold tracking-[-1.5px]">{formatClock(seconds)}</span>
          <span className="text-[13px] text-muted-foreground">tempo livre</span>
        </RingProgress>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="outline" size="xl" onClick={() => setClock({ startedAt: null, accumulated: 0 })}>
          Zerar
        </Button>
        <Button size="xl" onClick={toggle}>
          {running ? 'Pausar' : 'Iniciar'}
        </Button>
      </div>
    </>
  )
}
