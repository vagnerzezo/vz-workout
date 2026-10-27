import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Preferências deste aparelho (não vão para a API): som, tela ligada e ficha para treinar sem internet. */
type DevicePrefsState = {
  sound: boolean // som e vibração no fim do descanso
  keepAwake: boolean // tela não apaga durante o treino
  offlinePlan: boolean
  offlineSyncedAt: string | null // ISO da última vez que a ficha foi baixada
  set: (patch: Partial<Omit<DevicePrefsState, 'set'>>) => void
}

export const useDevicePrefs = create<DevicePrefsState>()(
  persist(
    (set) => ({
      sound: true,
      keepAwake: true,
      offlinePlan: true,
      offlineSyncedAt: null,
      set: (patch) => set(patch),
    }),
    { name: 'preferencias-aparelho', version: 1 },
  ),
)
