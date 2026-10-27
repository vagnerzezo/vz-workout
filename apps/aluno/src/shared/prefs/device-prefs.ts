import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Preferências deste aparelho (não vão para a API): som, tela ligada, ficha sem internet e avisos. */
type DevicePrefsState = {
  sound: boolean // som e vibração no fim do descanso
  keepAwake: boolean // tela não apaga durante o treino
  offlinePlan: boolean
  offlineSyncedAt: string | null // ISO da última vez que a ficha foi baixada
  pushEnabled: boolean // avisos neste aparelho (além da permissão do navegador)
  set: (patch: Partial<Omit<DevicePrefsState, 'set'>>) => void
}

export const useDevicePrefs = create<DevicePrefsState>()(
  persist(
    (set) => ({
      sound: true,
      keepAwake: true,
      offlinePlan: true,
      offlineSyncedAt: null,
      pushEnabled: true,
      set: (patch) => set(patch),
    }),
    { name: 'preferencias-aparelho', version: 1 },
  ),
)
