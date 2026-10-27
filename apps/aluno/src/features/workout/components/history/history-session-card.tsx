import { ChevronDown, Trophy } from "lucide-react"
import type { HistorySession } from "@workspace/core"
import {
  formatDeltaKg,
  formatKg,
  formatTons,
  parseIsoDate,
  weekdayShort,
} from "@workspace/core"
import { cn } from "@workspace/ui/lib/utils"

type HistorySessionCardProps = {
  session: HistorySession
  open: boolean
  onToggle: () => void
}

export function HistorySessionCard({
  session,
  open,
  onToggle,
}: HistorySessionCardProps) {
  const records = session.exercises.filter((e) => e.isRecord).length
  const title = `Treino ${session.letter} — ${session.name}`
  const panelId = `sessao-${session.id}`
  const meta = `${Math.round(session.durationMin)} min · ${formatTons(session.volumeKg)} · ${session.exercises.length} exercícios`

  return (
    <article
      aria-label={title}
      className={cn(
        "overflow-hidden rounded-[18px] border bg-card",
        open && "border-primary"
      )}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex min-h-17 w-full items-center gap-3 px-3.5 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <span className="flex w-11 shrink-0 flex-col items-center">
            <span className="text-[11px] font-extrabold text-muted-foreground">
              {weekdayShort(session.date)}
            </span>
            <span className="text-[19px] font-extrabold">
              {String(parseIsoDate(session.date).getDate()).padStart(2, "0")}
            </span>
          </span>
          <span className="flex min-w-0 grow flex-col gap-0.75">
            <span className="text-[14.5px] font-extrabold">{title}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {meta}
            </span>
          </span>
          {records > 0 && (
            <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-warning/16 px-2 text-[11px] font-extrabold text-warning">
              <Trophy aria-hidden="true" className="size-3" strokeWidth={2.4} />
              {records}
              <span className="sr-only">
                {records === 1 ? "recorde" : "recordes"}
              </span>
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground motion-safe:transition-transform",
              open && "rotate-180"
            )}
            strokeWidth={2.2}
          />
        </button>
      </h3>
      {open && (
        <div
          id={panelId}
          className="flex flex-col gap-0.5 border-t border-[#22252b] px-3.5 pt-2.5 pb-3.5"
        >
          <table className="w-full table-fixed text-[13px]">
            <colgroup>
              <col />
              <col className="w-23" />
              <col className="w-17" />
            </colgroup>
            <thead>
              <tr className="text-[10.5px] tracking-[0.8px] text-muted-foreground">
                <th scope="col" className="pb-1 text-left font-extrabold">
                  EXERCÍCIO
                </th>
                <th scope="col" className="pb-1 text-right font-extrabold">
                  MELHOR SÉRIE
                </th>
                <th scope="col" className="pb-1 text-right font-extrabold">
                  VS ANTES
                </th>
              </tr>
            </thead>
            <tbody>
              {session.exercises.map((e) => (
                <tr key={e.name} className="h-8.5 border-t border-secondary">
                  <th scope="row" className="pr-2 text-left font-normal">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{e.name}</span>
                      {e.isRecord && (
                        <abbr
                          title="Recorde pessoal"
                          className="flex h-4.5 shrink-0 items-center rounded-[5px] bg-warning px-1.25 text-[9.5px] font-extrabold text-primary-foreground no-underline"
                        >
                          PR
                        </abbr>
                      )}
                    </span>
                  </th>
                  <td className="text-right font-extrabold">
                    {formatKg(e.best.kg)} kg × {e.best.reps}
                  </td>
                  <td
                    className={cn(
                      "text-right font-bold",
                      e.deltaKg === null || e.deltaKg === 0
                        ? "text-muted-foreground"
                        : e.deltaKg > 0
                          ? "text-primary"
                          : "text-destructive"
                    )}
                  >
                    {e.deltaKg === null ? (
                      <abbr title="Primeira vez" className="no-underline">
                        novo
                      </abbr>
                    ) : (
                      <>
                        {formatDeltaKg(e.deltaKg)}
                        <span className="sr-only">
                          {e.deltaKg === 0 ? " mesma carga" : " kg"}
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {session.comment && (
            <p className="mt-2 rounded-xl bg-secondary px-3 py-2.5 text-[12.5px] leading-[1.45] text-foreground-2">
              Sua anotação: {session.comment}
            </p>
          )}
        </div>
      )}
    </article>
  )
}
