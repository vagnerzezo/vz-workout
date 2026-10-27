import { Navigate, Outlet, useLocation } from 'react-router'
import { useMe } from '../shared/api/me'

/** Com o acesso pausado, só estas telas continuam abertas (seção 7.1 do guia: "libera só chat e progresso"). */
const openWhilePaused = ['/chat', '/perfil/progresso']

/**
 * Guard do acesso pausado. O login ainda não existe (etapa 3): quando existir, este guard vira o
 * RequireAuth da seção 7.3, que também manda para /entrar.
 */
export function RequireAccess() {
  const { data: me, isPending } = useMe()
  const { pathname } = useLocation()
  if (isPending) return null // o splash do PWA cobre esse instante
  if (me?.access === 'paused' && !openWhilePaused.includes(pathname)) return <Navigate to="/acesso-pausado" replace />
  return <Outlet />
}
