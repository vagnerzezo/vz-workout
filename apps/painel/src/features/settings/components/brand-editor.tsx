import { useId, useState } from 'react'
import { Camera, Check, Image, Map, StickyNote, TriangleAlert } from 'lucide-react'
import { appInitials, BRAND_SWATCHES, brandContrast, HOME_NAME_LIMIT, homeScreenName, type CoachSettings } from '@workspace/core'
import { cn } from '@workspace/ui/lib/utils'
import { field } from './fields'

type Branding = CoachSettings['branding']

const one = (n: number) => n.toFixed(1).replace('.', ',')

/** Ícone do app: o logo enviado ou as iniciais sobre a cor da marca. */
function AppIcon({ b, logo, className }: { b: Branding; logo: string | null; className?: string }) {
  const { onBrand } = brandContrast(b.brandColor)
  return (
    <span aria-hidden="true" className={cn('flex items-center justify-center overflow-hidden rounded-[14px] font-extrabold', className)} style={{ background: b.brandColor, color: onBrand }}>
      {logo ? <img src={logo} alt="" className="size-full object-cover" /> : appInitials(b.appName)}
    </span>
  )
}

/** O que o aluno vê: tela inicial do celular, abertura do app e botões na cor da marca. */
export function BrandPreview({ b, logo }: { b: Branding; logo: string | null }) {
  const { onBrand } = brandContrast(b.brandColor)
  const others = [
    { label: 'Fotos', icon: Image },
    { label: 'Mapas', icon: Map },
    { label: 'Notas', icon: StickyNote },
  ]
  return (
    <section aria-label="Pré-visualização da marca" className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)]">
      <div className="flex flex-col gap-2 rounded-[18px] border bg-[linear-gradient(160deg,#1d2433,#0b0c0e)] p-4">
        <span className="text-[11px] font-bold text-muted-foreground">Tela inicial do celular</span>
        <div className="grid grid-cols-4 gap-2 pt-1">
          <span className="flex flex-col items-center gap-1">
            <AppIcon b={b} logo={logo} className="size-13 text-base" />
            <span className="max-w-full truncate text-[10.5px] text-white">{homeScreenName(b.appName)}</span>
          </span>
          {others.map(({ label, icon: Icon }) => (
            <span key={label} aria-hidden="true" className="flex flex-col items-center gap-1">
              <span className="flex size-13 items-center justify-center rounded-[14px] bg-white/10 text-white/70">
                <Icon className="size-5.5" />
              </span>
              <span className="text-[10.5px] text-white/70">{label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-[18px] border bg-background p-4">
        <span className="self-start text-[11px] font-bold text-muted-foreground">Tela de abertura</span>
        <AppIcon b={b} logo={logo} className="size-14 text-lg" />
        <span className="text-sm font-extrabold">{b.appName.trim() || 'Meu app'}</span>
      </div>
      <div className="flex flex-col gap-2.5 rounded-[18px] border bg-background p-4 sm:col-span-2 lg:col-span-1">
        <span className="text-[11px] font-bold text-muted-foreground">Dentro do app</span>
        <span className="text-[11px] font-extrabold tracking-wide" style={{ color: b.brandColor }}>
          TREINO DE HOJE
        </span>
        <span className="text-[15px] font-extrabold">Treino C — Legs</span>
        <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <span className="block h-full w-3/5 rounded-full" style={{ background: b.brandColor }} />
        </span>
        <span aria-hidden="true" className="flex h-11 items-center justify-center rounded-full text-sm font-extrabold" style={{ background: b.brandColor, color: onBrand }}>
          Começar treino
        </span>
      </div>
    </section>
  )
}

/** Nome, logo e cor do app dos alunos, com o aviso de contraste. */
export function BrandFields({ value, onChange, logo, onLogo, desktop }: { value: Branding; onChange: (b: Branding) => void; logo: string | null; onLogo: (file: File) => void; desktop: boolean }) {
  const id = useId()
  const [hex, setHex] = useState(value.brandColor)
  const [shown, setShown] = useState(value.brandColor)
  // Cor trocada por fora (amostra, desfazer) atualiza o campo
  if (shown !== value.brandColor) {
    setShown(value.brandColor)
    setHex(value.brandColor)
  }
  const contrast = brandContrast(value.brandColor)
  const long = value.appName.trim().length > HOME_NAME_LIMIT
  const ContrastIcon = contrast.level === 'good' ? Check : TriangleAlert
  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onLogo(f)
    e.target.value = ''
  }
  const fileButton = 'flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold focus-within:ring-3 focus-within:ring-ring/50'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between">
          <label htmlFor={`${id}-nome`} className="text-xs font-bold text-foreground-2">
            Nome do app na tela inicial
          </label>
          <span className={cn('text-[11.5px]', long ? 'text-warning' : 'text-muted-foreground')}>
            {value.appName.trim().length}/{HOME_NAME_LIMIT}
          </span>
        </span>
        <input id={`${id}-nome`} value={value.appName} maxLength={30} onChange={(e) => onChange({ ...value, appName: e.target.value })} aria-invalid={!value.appName.trim()} aria-describedby={`${id}-nome-dica`} className={cn(field, 'h-12')} />
        <span id={`${id}-nome-dica`} className="text-[11.5px] text-muted-foreground">
          {!value.appName.trim() ? 'Dê um nome ao app' : long ? `Embaixo do ícone aparece "${homeScreenName(value.appName)}"` : `Acima de ${HOME_NAME_LIMIT} caracteres o iPhone corta o nome embaixo do ícone`}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-foreground-2">Logo</span>
        <div className="flex items-center gap-3">
          <AppIcon b={value} logo={logo} className="size-16 text-lg" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {!desktop && (
                <label className={fileButton}>
                  <Camera aria-hidden="true" className="size-4" />
                  Câmera
                  <input type="file" accept="image/*" capture="environment" onChange={pickFile} className="sr-only" />
                </label>
              )}
              <label className={fileButton}>
                <Image aria-hidden="true" className="size-4" />
                {desktop ? (value.logoName ? 'Trocar logo' : 'Enviar logo') : 'Galeria'}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} className="sr-only" />
              </label>
            </div>
            <span className="text-[11.5px] text-muted-foreground">{value.logoName ?? 'PNG quadrado, mínimo 512 × 512 px. Sem logo, o ícone usa as iniciais.'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-foreground-2">Cor de destaque</span>
        <div role="radiogroup" aria-label="Cor de destaque" className="flex flex-wrap items-center gap-2.5">
          {BRAND_SWATCHES.map((c) => {
            const on = value.brandColor.toUpperCase() === c
            return (
              <button key={c} type="button" role="radio" aria-checked={on} aria-label={c} onClick={() => onChange({ ...value, brandColor: c })} className={cn('size-10 rounded-full border-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-white' : 'border-transparent')} style={{ background: c }} />
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-hex`} className="text-xs font-bold text-muted-foreground">
            HEX
          </label>
          <input
            id={`${id}-hex`}
            value={hex}
            maxLength={7}
            spellCheck={false}
            onChange={(e) => {
              const v = `#${e.target.value.replace(/#/g, '')}`
              setHex(v)
              if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange({ ...value, brandColor: v.toUpperCase() })
            }}
            aria-invalid={!/^#[0-9a-fA-F]{6}$/.test(hex)}
            className={cn(field, 'h-10 w-32 font-mono uppercase')}
          />
        </div>
        <p role="status" className={cn('flex items-start gap-1.5 text-[12.5px] leading-snug', contrast.level === 'good' ? 'text-primary' : contrast.level === 'low' ? 'text-destructive' : 'text-warning')}>
          <ContrastIcon aria-hidden="true" className="mt-px size-4 shrink-0" />
          <span>
            <span className="block">{contrast.message}</span>
            <span className="block text-[11.5px] text-muted-foreground">
              Texto sobre a cor {one(contrast.text)}:1 · cor sobre o fundo {one(contrast.bg)}:1
            </span>
          </span>
        </p>
      </div>
    </div>
  )
}
