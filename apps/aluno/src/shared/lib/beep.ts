let ctx: AudioContext | null = null

/** Dois bipes curtos no fim do descanso. Silencioso onde não há Web Audio (ou o navegador bloquear). */
export function restFinishedAlert() {
  navigator.vibrate?.(300)
  try {
    ctx ??= new AudioContext()
    for (const at of [0, 0.22]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.16)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + at)
      osc.stop(ctx.currentTime + at + 0.18)
    }
  } catch {
    // sem áudio: fica só a vibração
  }
}
