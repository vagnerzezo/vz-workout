import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

type ListFooterProps = {
  shown: number
  total: number
  tabLabel: string
  page: number
  pages: number
  onPage: (p: number) => void
}

const Legend = () => (
  <>
    <span className="text-primary">80% ou mais</span> · <span className="text-warning">60–79%</span> · <span className="text-destructive">abaixo de 60%</span>
  </>
)

/** Legenda das cores de adesão e a paginação (só no desktop; o celular rola a lista inteira). */
export function ListFooter({ shown, total, tabLabel, page, pages, onPage }: ListFooterProps) {
  const pageButton = 'size-9 border-input p-0 font-normal'
  return (
    <>
      <p className="text-[11.5px] text-muted-foreground lg:hidden">
        Anel = adesão aos treinos em 30 dias: <Legend />
      </p>
      <div className="hidden flex-wrap items-center justify-between gap-2.5 text-[13px] text-muted-foreground lg:flex">
        <span>
          Mostrando {shown} de {total} {tabLabel} · adesão: <Legend />
        </span>
        {pages > 1 && (
          <nav aria-label="Páginas" className="flex gap-1.5">
            <Button variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPage(page - 1)} className={pageButton}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Página ${p}`}
                onClick={() => onPage(p)}
                className={cn(pageButton, p === page && 'border-transparent font-extrabold')}
              >
                {p}
              </Button>
            ))}
            <Button variant="outline" aria-label="Próxima página" disabled={page >= pages} onClick={() => onPage(page + 1)} className={pageButton}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        )}
      </div>
    </>
  )
}
