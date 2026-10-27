import { useEffect } from 'react'

/** Mantém a tela ligada enquanto `enabled`. O navegador solta a trava ao trocar de aba; pedimos de novo ao voltar. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const request = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen').then(
        (l) => (lock = l),
        () => {}, // bateria fraca ou sem permissão: segue sem
      )
    }
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      document.removeEventListener('visibilitychange', request)
      void lock?.release()
    }
  }, [enabled])
}
