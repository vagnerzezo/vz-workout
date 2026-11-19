import { useState } from 'react'
import { toast } from 'sonner'
import { audioDuration, EQUIPMENT, ExerciseEdit, ExerciseLevel, exerciseLevelLabel, Muscle, muscleLabel, NewExercise, parseSteps, type LibraryExercise } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { useCreateExercise, useUpdateExercise } from '../api/queries'

const field = 'w-full rounded-[14px] border bg-card px-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'
const chip = (on: boolean) => cn('h-8.5 shrink-0 rounded-full border px-3 text-[12.5px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')
const label = 'text-xs font-bold text-foreground-2'

type ExerciseFormProps = {
  /** Sem exercício = "Novo exercício"; com = editar um seu */
  exercise?: LibraryExercise
  /** Para escolher as substituições (mesmo músculo principal) */
  library: LibraryExercise[]
  onDone: (e: LibraryExercise) => void
  onCancel: () => void
}

/** Exercício seu: nome, músculos (principal conta 1, secundários 0,5), equipamento, nível, passo a passo, substituições e vídeo. */
export function ExerciseForm({ exercise: initial, library, onDone, onCancel }: ExerciseFormProps) {
  const editing = !!initial
  const create = useCreateExercise()
  const update = useUpdateExercise(initial?.id ?? '')
  const saving = create.isPending || update.isPending
  const [name, setName] = useState(initial?.name ?? '')
  const [primary, setPrimary] = useState<Muscle>(initial?.primary ?? 'lats')
  const [secondary, setSecondary] = useState<Muscle[]>(initial?.secondary ?? ['biceps'])
  const [equipment, setEquipment] = useState<string>(initial?.equipment ?? 'Máquina')
  const [level, setLevel] = useState<LibraryExercise['level']>(initial?.level ?? 'intermediate')
  const [steps, setSteps] = useState(initial?.steps.join('\n') ?? '')
  const [alternatives, setAlternatives] = useState<string[]>(initial?.alternatives ?? [])
  const [video, setVideo] = useState<string | null>(null)
  const [youtube, setYoutube] = useState('')
  const hadVideo = !!initial && (initial.videoSeconds !== null || !!initial.videoUrl)
  const [keepVideo, setKeepVideo] = useState(hadVideo)
  const [tried, setTried] = useState(false)

  // Substituições: outros exercícios com o mesmo músculo principal
  const candidates = library.filter((x) => x.id !== initial?.id && x.primary === primary)
  const pickedAlternatives = alternatives.filter((id) => candidates.some((c) => c.id === id))
  const draft = { name, primary, secondary: secondary.filter((m) => m !== primary), equipment, level, steps: parseSteps(steps), alternatives: pickedAlternatives, videoName: video, youtubeUrl: youtube.trim() }
  const parsed = editing ? ExerciseEdit.safeParse({ ...draft, keepVideo }) : NewExercise.safeParse(draft)
  const errors: Record<string, string> = parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))

  const save = () => {
    setTried(true)
    if (!parsed.success) return
    const done = {
      onSuccess: (e: LibraryExercise) => {
        toast.success(editing ? 'Exercício salvo' : `${e.name} entrou nos seus exercícios`)
        onDone(e)
      },
      onError: () => toast.error('Não foi possível salvar o exercício. Tente de novo.'),
    }
    if (editing) update.mutate(parsed.data as ExerciseEdit, done)
    else create.mutate(parsed.data, done)
  }

  const toggleAlternative = (id: string) => setAlternatives(pickedAlternatives.includes(id) ? pickedAlternatives.filter((x) => x !== id) : [...pickedAlternatives, id])
  const newVideo = !!video || !!youtube.trim()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ex-nome" className={label}>
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
        <span className={label}>Músculo principal (conta 1 série no volume)</span>
        <div role="radiogroup" aria-label="Músculo principal" className="flex flex-wrap gap-1.5">
          {Muscle.options.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={primary === m} onClick={() => setPrimary(m)} className={chip(primary === m)}>
              {muscleLabel[m]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={label}>Músculos secundários (contam 0,5)</span>
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
        <span className={label}>Equipamento</span>
        <div role="radiogroup" aria-label="Equipamento" className="flex flex-wrap gap-1.5">
          {EQUIPMENT.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={equipment === e} onClick={() => setEquipment(e)} className={chip(equipment === e)}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={label}>Nível</span>
        <div role="radiogroup" aria-label="Nível" className="flex flex-wrap gap-1.5">
          {ExerciseLevel.options.map((l) => (
            <button key={l} type="button" role="radio" aria-checked={level === l} onClick={() => setLevel(l)} className={cn(chip(level === l), 'capitalize')}>
              {exerciseLevelLabel[l]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ex-passos" className={label}>
          Como executar (uma etapa por linha, até 8)
        </label>
        <textarea id="ex-passos" rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Peito apoiado no banco\nPuxe levando os cotovelos para trás'} aria-invalid={tried && !!errors.steps} className={cn(field, 'resize-none py-3 leading-[1.45]')} />
        {tried && errors.steps && <span className="text-[11.5px] text-destructive">Use no máximo 8 etapas</span>}
      </div>
      {candidates.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className={label}>Substituições no app (o aluno troca sozinho)</span>
          <div role="group" aria-label="Substituições" className="flex flex-wrap gap-1.5">
            {candidates.map((c) => (
              <button key={c.id} type="button" aria-pressed={pickedAlternatives.includes(c.id)} onClick={() => toggleAlternative(c.id)} className={chip(pickedAlternatives.includes(c.id))}>
                {c.name}
              </button>
            ))}
          </div>
          {tried && errors.alternatives && <span className="text-[11.5px] text-destructive">{errors.alternatives}</span>}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span className={label}>Vídeo</span>
        {hadVideo && !newVideo && (
          <div className="flex items-center gap-2 rounded-[14px] border bg-card px-3.5 py-2.5">
            <span className={cn('grow text-sm', keepVideo ? 'font-bold' : 'text-muted-foreground line-through')}>
              Vídeo atual{initial?.videoSeconds ? ` · ${audioDuration(initial.videoSeconds)}` : ''}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => setKeepVideo(!keepVideo)} className="h-8 border-line-strong px-3 text-xs font-bold">
              {keepVideo ? 'Remover vídeo' : 'Manter vídeo'}
            </Button>
          </div>
        )}
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[14px] border border-dashed border-line-strong p-4 text-center focus-within:ring-3 focus-within:ring-ring/50">
          <span className="text-sm font-bold">{video ?? (hadVideo ? 'Trocar o vídeo' : 'Enviar vídeo de execução')}</span>
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
        <Button variant="outline" size="lg" onClick={onCancel} disabled={saving} className="font-bold">
          Cancelar
        </Button>
        <Button size="lg" disabled={saving} onClick={save} className="grow font-extrabold">
          {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar exercício'}
        </Button>
      </div>
    </div>
  )
}
