import { useEffect, useId, useMemo } from 'react'
import { Camera, Check } from 'lucide-react'
import type { PhotoPose } from '@workspace/core'
import { poseLabels, ratingWords } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'

/** Espaço de uma foto: abre a câmera ou a galeria; com foto, mostra a miniatura e permite trocar. */
export function PhotoSlot({ pose, file, onChange }: { pose: PhotoPose; file: File | undefined; onChange: (file: File) => void }) {
  const label = poseLabels[pose]
  const preview = useMemo(() => (file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]) // libera a miniatura anterior

  return (
    <label
      className={cn(
        'relative flex h-37.5 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl text-center has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
        file ? 'border-2 border-primary bg-primary/14' : 'border border-dashed border-line-strong bg-card text-foreground-2',
      )}
    >
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={`${file ? 'Trocar' : 'Adicionar'} foto de ${label.toLowerCase()}`}
        onChange={(e) => {
          const picked = e.target.files?.[0]
          if (picked) onChange(picked)
          e.target.value = '' // escolher a mesma foto de novo também dispara
        }}
      />
      {preview && <img src={preview} alt="" className="absolute inset-0 size-full object-cover opacity-45" />}
      <span className="relative flex flex-col items-center gap-2">
        {file ? (
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden="true" className="size-4.5" strokeWidth={3} />
          </span>
        ) : (
          <Camera aria-hidden="true" className="size-7" strokeWidth={1.8} />
        )}
        <span className="text-[13px] font-extrabold text-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">{file ? 'Toque para trocar' : 'Adicionar'}</span>
      </span>
    </label>
  )
}

/** Nota de 1 a 5 com rádios nativos: Tab entra no grupo e as setas trocam a nota. */
export function RatingField({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 flex w-full items-baseline justify-between gap-2">
        <span className="text-sm font-bold">{label}</span>
        <span aria-hidden="true" className={cn('text-xs', value ? 'text-primary' : 'text-muted-foreground')}>
          {value ? `${value} · ${ratingWords[value]}` : 'Sem resposta'}
        </span>
      </legend>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value === n
          return (
            <label
              key={n}
              className={cn(
                'flex h-11 cursor-pointer items-center justify-center rounded-xl border text-[15px] font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground-2 hover:bg-accent',
              )}
            >
              <input type="radio" name={name} className="sr-only" checked={on} onChange={() => onChange(n)} aria-label={`${n}, ${ratingWords[n]}`} />
              {n}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Sim/Não grande, como no canvas. */
export function YesNoField({ legend, value, onChange }: { legend: string; value: boolean | null; onChange: (v: boolean) => void }) {
  const name = useId()
  return (
    <fieldset className="grid grid-cols-2 gap-2">
      <legend className="sr-only">{legend}</legend>
      {[
        { v: false, label: 'Não' },
        { v: true, label: 'Sim' },
      ].map((o) => {
        const on = value === o.v
        return (
          <label
            key={o.label}
            className={cn(
              'flex h-12 cursor-pointer items-center justify-center rounded-[14px] border text-[15px] font-extrabold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
              on ? 'border-primary bg-primary/14 text-primary' : 'bg-card hover:bg-accent',
            )}
          >
            <input type="radio" name={name} className="sr-only" checked={on} onChange={() => onChange(o.v)} />
            {o.label}
          </label>
        )
      })}
    </fieldset>
  )
}
