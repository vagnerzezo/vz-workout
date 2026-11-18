import { cn } from "cn"

/** Com `aria-label` ("Carregando…") vira um status: o leitor de tela anuncia o carregamento. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      role={props["aria-label"] ? "status" : undefined}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
