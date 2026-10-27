import { useState } from 'react'
import { isIos, useInstall } from './install'
import { useDevicePrefs } from '../prefs/device-prefs'

/**
 * Avisos neste aparelho: depende da permissão do navegador e da escolha do aluno.
 * No iPhone, push só existe com o app instalado na tela inicial (iOS 16.4+).
 * TODO(API): ao ligar, criar a inscrição (PushManager.subscribe com a chave VAPID) e enviar para a API.
 */
export type PushState = 'on' | 'off' | 'denied' | 'needs-install' | 'unsupported'

export function usePushNotifications() {
  const installed = useInstall((s) => s.installed)
  const enabled = useDevicePrefs((s) => s.pushEnabled)
  const set = useDevicePrefs((s) => s.set)
  const [permission, setPermission] = useState(() => (typeof Notification === 'undefined' ? null : Notification.permission))

  const state: PushState =
    isIos() && !installed
      ? 'needs-install'
      : permission === null
        ? 'unsupported'
        : permission === 'denied'
          ? 'denied'
          : permission === 'granted' && enabled
            ? 'on'
            : 'off'

  /** Precisa vir de um toque do aluno: o iPhone só mostra o pedido de permissão assim. */
  const toggle = async () => {
    if (state === 'on') return set({ pushEnabled: false })
    if (state !== 'off') return
    const result = await Notification.requestPermission()
    setPermission(result)
    set({ pushEnabled: result === 'granted' })
  }

  const device = isIos() ? 'iPhone' : /android/i.test(navigator.userAgent) ? 'Android' : 'Este navegador'
  return { state, toggle, device, installed }
}
