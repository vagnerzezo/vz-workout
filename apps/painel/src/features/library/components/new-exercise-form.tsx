import { useState } from 'react'
import { toast } from 'sonner'
import { EQUIPMENT, Muscle, muscleLabel, NewExercise, parseSteps, type LibraryExercise } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { useCreateExercise } from '../api/queries'

const field = 'w-full rounded-[14px] border bg-card px-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'
const chip = (on: boolean) => cn('h-8.5 shrink-0 rounded-full border px-3 text-[12.5px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')

/** "Novo exercício": nome, músculos (principal conta 1, secundários 0,5), equipamento, passo a passo e vídeo. */
export function NewExerciseForm({ onDone, onCancel }: { onDone: (e: LibraryExercise) => void; onCancel: () => void }) {
  const create = useCreateExercise()
  const [name, setName] = useState('')
  const [primary, setPrimary] = useState<Muscle>('lats')
  const [secondary, setSecondary] = useState<Muscle[]>(['biceps'])
  const [equipment, setEquipment] = useState<string>('Máquina')
  const [steps, setSteps] = useState('')
  const [video, setVideo] = useState<string | null>(null)
  const [youtube, setYoutube] = useState('')
  const [tried, setTried] = useState(false)
  const draft = { name, primary, secondary: secondary.filter((m) => m !== primary), equipment, steps: parseSteps(steps), videoName: video, youtubeUrl: youtube.trim() }
  const parsed = NewExercise.safeParse(draft)
  const errors = parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]))

  const save = () => {
    setTried(true)
    if (!parsed.success) return
    create.mutate(parsed.data, {
      onSuccess: (e) => {
        toast.success(`${e.name} entrou nos seus exercícios`)
        onDone(e)
      },
      onError: () => toast.error('Não foi possível salvar o exercício.'),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ex-nome" className="text-xs font-bold text-foreground-2">
          Nome
        </label>
        <input id="ex-nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Remada cavalinho (máquina)" aria-invalid={tried && !!errors.name} aria-describedby={tried && errors.name ? 'ex-nome-erro' : undefined} className={cn(field, 'h-12')} />
        {tried && errors.name && (
          <span id="ex-nome-erro" className="text-[11.5px] text-destructive">
            {errors.name}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-foreground-2">Músculo principal (conta 1 série no volume)</span>
        <div role="radiogroup" aria-label="Músculo principal" className="flex flex-wrap gap-1.5">
          {Muscle.options.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={primary === m} onClick={() => setPrimary(m)} className={chip(primary === m)}>
              {muscleLabel[m]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-foreground-2">Músculos secundários (contam 0,5)</span>
        <div role="group" aria-label="Músculos secundários" className="flex flex-wrap gap-1.5">
          {Muscle.options
            .filter((m) => m !== primary)
            .map((m) => (
              <button key={m} type="button" aria-pressed={secondary.includes(m)} onClick={() => setSecondary(secondary.includes(m) ? secondary.filter((x) => x !== m) : [...secondary, m])} className={chip(secondary.includes(m))}>
                {muscleLabel[m]}
              </button>
            ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-foreground-2">Equipamento</span>
        <div role="radiogroup" aria-label="Equipamento" className="flex flex-wrap gap-1.5">
          {EQUIPMENT.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={equipment === e} onClick={() => setEquipment(e)} className={chip(equipment === e)}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ex-passos" className="text-xs font-bold text-foreground-2">
          Como executar (uma etapa por linha)
        </label>
        <textarea id="ex-passos" rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Peito apoiado no banco\nPuxe levando os cotovelos para trás'} className={cn(field, 'resize-none py-3 leading-[1.45]')} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-foreground-2">Vídeo</span>
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[14px] border border-dashed border-line-strong p-4 text-center focus-within:ring-3 focus-within:ring-ring/50">
          <span className="text-sm font-bold">{video ?? 'Enviar vídeo de execução'}</span>
          <span className="text-[11.5px] text-muted-foreground">MP4 ou MOV, até 60 s, gravado na vertical</span>
          <input type="file" accept="video/mp4,video/quicktime" className="sr-only" onChange={(e) => setVideo(e.target.files?.[0]?.name ?? null)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] text-muted-foreground">ou cole um link do YouTube</span>
          <input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/…" aria-invalid={tried && !!errors.youtubeUrl} className={cn(field, 'h-11')} />
        </label>
        {tried && errors.youtubeUrl && <span className="text-[11.5px] text-destructive">{errors.youtubeUrl}</span>}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="lg" onClick={onCancel} className="font-bold">
          Cancelar
        </Button>
        <Button size="lg" disabled={create.isPending} onClick={save} className="grow font-extrabold">
          {create.isPending ? 'Salvando…' : 'Salvar exercício'}
        </Button>
      </div>
    </div>
  )
}
