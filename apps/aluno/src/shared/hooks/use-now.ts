import { useEffect, useState } from 'react'

/** Hora atual (epoch ms), atualizada a cada `intervalMs`. Para relógios e timers na tela. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
