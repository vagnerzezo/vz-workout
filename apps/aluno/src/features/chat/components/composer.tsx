import { useState, type FormEvent } from 'react'
import { ArrowRight, Camera, Mic, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { audioDuration } from '@workspace/core'
import { useNow } from '../../../shared/hooks/use-now'
import { useSendFile, useSendText } from '../api/queries'
import { useAudioRecorder } from '../hooks/use-audio-recorder'

const round = 'flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

/** Campo de mensagem: texto, foto/vídeo e áudio gravado, com respostas rápidas acima. */
export function Composer({ coachFirst }: { coachFirst: string }) {
  const [draft, setDraft] = useState('')
  const sendText = useSendText()
  const sendFile = useSendFile()
  const recorder = useAudioRecorder()

  const quick = [
    { label: 'Dúvida sobre exercício', text: `${coachFirst}, tenho uma dúvida sobre a execução do ` },
    { label: 'Foto da refeição', text: `${coachFirst}, segue a foto da refeição para você conferir.` },
    { label: 'Não vou conseguir treinar hoje', text: `${coachFirst}, hoje não vou conseguir treinar. Posso repor amanhã?` },
  ]

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    sendText.mutate(text, {
      onError: () => {
        setDraft(text) // nada se perde: o texto volta para o campo
        toast.error('Não foi possível enviar. Tente de novo.')
      },
    })
  }

  const sendMedia = (file: File) => {
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : null
    if (!type) return toast.error('Envie uma foto ou um vídeo.')
    sendFile.mutate({ file, type }, { onError: () => toast.error('Não foi possível enviar o arquivo (até 25 MB).') })
  }

  const startRecording = () =>
    recorder.start().catch(() => toast.error('Libere o microfone nas configurações do navegador para gravar áudio.'))

  const finishRecording = async () => {
    const audio = await recorder.stop()
    if (!audio || audio.durationSec < 1) return toast('Áudio muito curto.')
    sendFile.mutate({ file: audio.blob, type: 'audio', durationSec: audio.durationSec }, { onError: () => toast.error('Não foi possível enviar o áudio.') })
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border/60 bg-background px-3 pt-2 pb-[max(18px,env(safe-area-inset-bottom))]">
      {!recorder.recording && (
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setDraft(q.text)}
              className="h-8 shrink-0 rounded-full border border-input bg-card px-3 text-xs font-bold whitespace-nowrap text-foreground-2 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {recorder.recording ? (
        <Recording startedAt={recorder.startedAt!} onCancel={recorder.cancel} onSend={() => void finishRecording()} />
      ) : (
        <form onSubmit={submit} className="flex items-center gap-2">
          <label className={`${round} cursor-pointer border bg-card text-foreground-2 hover:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50`}>
            <input
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              aria-label="Enviar foto ou vídeo"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) sendMedia(file)
              }}
            />
            <Camera aria-hidden="true" className="size-5" strokeWidth={1.9} />
          </label>
          <input
            type="text"
            aria-label="Mensagem"
            placeholder={`Mensagem para o ${coachFirst}`}
            value={draft}
            maxLength={2000}
            enterKeyHint="send"
            onChange={(e) => setDraft(e.target.value)}
            className="h-11 min-w-0 grow rounded-full border bg-card px-3.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          />
          {draft.trim() ? (
            <button type="submit" aria-label="Enviar mensagem" className={`${round} bg-primary text-primary-foreground`}>
              <ArrowRight aria-hidden="true" className="size-4.5" strokeWidth={2.4} />
            </button>
          ) : (
            recorder.supported && (
              <button type="button" aria-label="Gravar áudio" onClick={() => void startRecording()} className={`${round} bg-primary/14 text-primary`}>
                <Mic aria-hidden="true" className="size-4.5" strokeWidth={2} />
              </button>
            )
          )}
        </form>
      )}
    </div>
  )
}

function Recording({ startedAt, onCancel, onSend }: { startedAt: number; onCancel: () => void; onSend: () => void }) {
  const now = useNow(250)
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Descartar áudio" onClick={onCancel} className={`${round} border bg-card text-foreground-2 hover:bg-accent`}>
        <Trash2 aria-hidden="true" className="size-4.5" strokeWidth={2} />
      </button>
      <span role="status" className="flex h-11 grow items-center gap-2 rounded-full border bg-card px-3.5 text-sm font-bold">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-destructive motion-safe:animate-pulse" />
        Gravando {audioDuration(Math.max(0, (now - startedAt) / 1000))}
      </span>
      <button type="button" aria-label="Parar e enviar áudio" onClick={onSend} className={`${round} bg-primary text-primary-foreground`}>
        <Square aria-hidden="true" className="size-4" fill="currentColor" />
      </button>
    </div>
  )
}
