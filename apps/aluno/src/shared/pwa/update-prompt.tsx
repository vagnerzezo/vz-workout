import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useActiveWorkout } from '../../features/workout/store/active-workout'

/**
 * Registra o service worker e avisa quando há versão nova (seção 10 do guia).
 * Nunca atualiza sozinho, e não avisa no meio de um treino: espera o aluno concluir.
 */
export function UpdatePrompt() {
  const training = useActiveWorkout((s) => !!s.startedAt && !s.finishedAt)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh || training) return
    const id = toast('Nova versão disponível', {
      duration: Infinity,
      action: { label: 'Atualizar', onClick: () => void updateServiceWorker(true) },
    })
    return () => void toast.dismiss(id)
  }, [needRefresh, training, updateServiceWorker])

  return null
}
