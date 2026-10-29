import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import type { CoachSettings } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ErrorState } from '../../../shared/components/error-state'
import { UnsavedChangesDialog } from '../../../shared/components/unsaved-changes-dialog'
import { useIsDesktop } from '../../../shared/hooks/use-is-desktop'
import { useCoachSettings, useSaveSettings } from '../api/queries'
import { BrandFields, BrandPreview } from '../components/brand-editor'
import { useLogoPreview } from './settings-page'

function BrandEditor({ data }: { data: CoachSettings }) {
  const save = useSaveSettings()
  const [branding, setBranding] = useState(data.branding)
  const [logo, setLogo] = useLogoPreview()
  const dirty = JSON.stringify(branding) !== JSON.stringify(data.branding)

  const publish = () =>
    save.mutate(
      { ...data, branding },
      {
        onSuccess: () => toast.success('Marca publicada. Os alunos veem na próxima vez que abrirem o app.'),
        onError: () => toast.error('Não foi possível publicar a marca.'),
      },
    )

  return (
    <main className="flex flex-col gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(190px+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2.5">
        <Link to="/configuracoes" aria-label="Voltar para as configurações" className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-lg font-extrabold">Marca do app</h1>
          <span role="status" className={cn('text-xs font-bold', dirty ? 'text-warning' : 'text-muted-foreground')}>
            {dirty ? 'Alterações não publicadas' : 'Publicado para os alunos'}
          </span>
        </div>
      </header>
      <BrandPreview b={branding} logo={logo} />
      <BrandFields value={branding} onChange={setBranding} logo={logo} onLogo={(f) => (setLogo(f), setBranding((b) => ({ ...b, logoName: f.name })))} desktop={false} />
      <div className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-[560px] gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button size="lg" variant="outline" disabled={!dirty || save.isPending} onClick={() => (setBranding(data.branding), setLogo(null))} className="font-extrabold">
          Desfazer
        </Button>
        <Button size="lg" disabled={!dirty || !branding.appName.trim() || save.isPending} onClick={publish} className="grow font-extrabold">
          Publicar para os alunos
        </Button>
      </div>
      <UnsavedChangesDialog dirty={dirty} what="da marca" />
    </main>
  )
}

/** /configuracoes/marca: no celular, a tela da marca com prévia; no desktop, a seção "Marca do app". */
export default function BrandRoute() {
  const desktop = useIsDesktop()
  const query = useCoachSettings()
  if (desktop) return <Navigate to="/configuracoes?secao=marca" replace />
  const shell = (children: React.ReactNode) => <main className="flex flex-col gap-3.5 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">{children}</main>
  if (query.isError) return shell(<ErrorState title="Não foi possível carregar a marca" retrying={query.isFetching} onRetry={() => query.refetch()} />)
  if (!query.data) return shell(<Skeleton aria-label="Carregando a marca" className="h-[70vh] rounded-[20px]" />)
  return <BrandEditor data={query.data} />
}
