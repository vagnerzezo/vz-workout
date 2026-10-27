import { useEffect, useRef, useState } from 'react'

type Recording = { blob: Blob; durationSec: number }

/** Gravação de áudio com MediaRecorder. `stop` devolve o arquivo; `cancel` descarta. */
export function useAudioRecorder() {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const release = () => {
    recorder.current?.stream.getTracks().forEach((t) => t.stop()) // apaga a luz do microfone
    recorder.current = null
    setStartedAt(null)
  }

  useEffect(() => () => release(), [])

  const supported = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia

  /** Rejeita se o aluno negar o microfone. */
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(stream)
    chunks.current = []
    rec.ondataavailable = (e) => chunks.current.push(e.data)
    rec.start()
    recorder.current = rec
    setStartedAt(Date.now())
  }

  const stop = () =>
    new Promise<Recording | null>((resolve) => {
      const rec = recorder.current
      if (!rec || startedAt === null) return resolve(null)
      const durationSec = (Date.now() - startedAt) / 1000
      rec.onstop = () => {
        resolve({ blob: new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }), durationSec })
        release()
      }
      rec.stop()
    })

  const cancel = () => {
    if (recorder.current) recorder.current.onstop = null
    recorder.current?.stop()
    release()
  }

  return { supported, recording: startedAt !== null, startedAt, start, stop, cancel }
}
