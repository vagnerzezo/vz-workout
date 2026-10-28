import { Link, useMatches } from 'react-router'
import { Button } from '@workspace/ui/components/button'

/** Rota que ainda não foi construída. Some quando a tela de verdade entrar no router. */
export default function ComingSoonPage() {
  const matches = useMatches()
  const title = (matches.at(-1)?.handle as { title?: string } | undefined)?.title ?? 'Em breve'

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-5 pb-32 text-center lg:pb-0">
      <h1 className="text-[26px] font-extrabold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">Esta tela ainda está em construção.</p>
      <Button variant="outline" nativeButton={false} render={<Link to="/" />}>
        Voltar para o início
      </Button>
    </main>
  )
}
