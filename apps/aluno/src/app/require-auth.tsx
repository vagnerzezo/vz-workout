import { Navigate, Outlet, useLocation } from 'react-router'
import { isUnauthorized, useMe } from '../shared/api/me'

/** Com o acesso pausado, só estas telas continuam abertas (seção 7.1 do guia: "libera só chat e progresso"). */
const openWhilePaused = ['/chat', '/perfil/progresso']

/** Guard da seção 7.3: sem sessão vai para /entrar (e volta para onde estava); acesso pausado vai para /acesso-pausado. */
export function RequireAuth() {
  const { data: me, error, isPending } = useMe()
  const location = useLocation()
  if (isPending) return null // o splash do PWA cobre esse instante
  if (isUnauthorized(error)) return <Navigate to="/entrar" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
  if (me?.access === 'paused' && !openWhilePaused.includes(location.pathname)) return <Navigate to="/acesso-pausado" replace />
  return <Outlet />
}
