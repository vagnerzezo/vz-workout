import { create } from 'zustand'

/** Evento que o Chrome/Android dispara quando o app pode ser instalado (não existe no tipo do DOM). */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

type InstallState = {
  prompt: InstallPromptEvent | null
  installed: boolean
}

export const useInstall = create<InstallState>(() => ({
  prompt: null,
  installed: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches,
}))

/**
 * O navegador dispara o convite logo ao abrir, antes de o aluno chegar em Configurações:
 * por isso a escuta começa no main.tsx e o evento fica guardado aqui.
 */
export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // sem o banner automático; o aluno instala pelo cartão
    useInstall.setState({ prompt: e as InstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => useInstall.setState({ prompt: null, installed: true }))
}

/** iPhone/iPad não tem convite: a instalação é pelo menu Compartilhar do Safari. */
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export async function install() {
  const { prompt } = useInstall.getState()
  if (!prompt) return
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  useInstall.setState({ prompt: null, installed: outcome === 'accepted' })
}
