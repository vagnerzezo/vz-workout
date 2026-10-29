import { useState } from 'react'
import { toast } from 'sonner'
import { formatBRL, pixPayload, PixKeyType, validatePixKey, type PixSettings } from '@workspace/core'
import { PixQr } from '@workspace/ui/blocks/pix-qr'
import { Button } from '@workspace/ui/components/button'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { useSavePix } from '../api/queries'

const keyTypes: Record<PixKeyType, [string, string]> = { cpf: ['CPF', '000.000.000-00'], cnpj: ['CNPJ', '00.000.000/0000-00'], email: ['E-mail', 'voce@email.com'], phone: ['Celular', '(51) 99999-9999'], random: ['Aleatória', '123e4567-e89b-…'] }
const field = 'h-12 w-full rounded-[14px] border bg-card px-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'
const chip = (on: boolean) => cn('h-9 shrink-0 rounded-full border px-3 text-[12.5px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary/14 text-primary' : 'border-input text-foreground-2')

/** Configurar Pix: chave, recebedor, QR e confirmação; ao lado (desktop), como o aluno vê. */
export function PixSettingsForm({ initial, desktop }: { initial: PixSettings; desktop: boolean }) {
  const [pix, setPix] = useState(initial)
  const [copied, setCopied] = useState(false)
  const [qrFile, setQrFile] = useState<{ name: string; url: string } | null>(null)
  const save = useSavePix()
  const set = (patch: Partial<PixSettings>) => setPix((p) => ({ ...p, ...patch }))
  const key = validatePixKey(pix.keyType, pix.key)
  const valid = key.ok && pix.receiverName.trim().length > 0 && pix.city.trim().length > 0
  const sample = { amount: 600, txid: 'RENATO1512TRI' }
  const payload = pixPayload({ key: key.normalized || '12345678000190', name: pix.receiverName || 'RECEBEDOR', city: pix.city || 'CIDADE', amount: sample.amount, txid: sample.txid })

  const form = (
    <section aria-label="Configurar Pix" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-extrabold">1. Chave Pix</h2>
        <div role="radiogroup" aria-label="Tipo de chave" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {PixKeyType.options.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={pix.keyType === t} onClick={() => set({ keyType: t, key: '' })} className={chip(pix.keyType === t)}>
              {keyTypes[t][0]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pix-key" className="text-xs font-bold text-foreground-2">
            Chave
          </label>
          <input id="pix-key" value={pix.key} onChange={(e) => set({ key: e.target.value })} placeholder={keyTypes[pix.keyType][1]} inputMode={pix.keyType === 'email' ? 'email' : pix.keyType === 'random' ? 'text' : 'numeric'} aria-invalid={pix.key.length > 0 && !key.ok} aria-describedby="pix-key-msg" className={field} />
          <span id="pix-key-msg" className={cn('text-[11.5px]', key.ok ? 'text-primary' : 'text-muted-foreground')}>
            {key.message}
          </span>
        </div>
        <div className="grid grid-cols-[1.4fr_1fr] gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="flex justify-between text-xs">
              <span className="font-bold text-foreground-2">Nome do recebedor</span>
              <span className="text-muted-foreground">{pix.receiverName.length}/25</span>
            </span>
            <input value={pix.receiverName} maxLength={25} onChange={(e) => set({ receiverName: e.target.value })} className={field} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="flex justify-between text-xs">
              <span className="font-bold text-foreground-2">Cidade</span>
              <span className="text-muted-foreground">{pix.city.length}/15</span>
            </span>
            <input value={pix.city} maxLength={15} onChange={(e) => set({ city: e.target.value })} className={field} />
          </label>
        </div>
        <span className="text-[11.5px] text-muted-foreground">Use o nome como está no banco. Acentos são removidos automaticamente no código Pix.</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-extrabold">2. QR Code</h2>
        <div role="radiogroup" aria-label="Origem do QR Code" className="flex flex-col gap-1.5">
          {(
            [
              ['auto', 'Gerar automaticamente', 'Um QR por cobrança, com o valor e o identificador'],
              ['upload', 'Usar o QR do meu banco', 'A mesma imagem para todas as cobranças, sem valor'],
            ] as const
          ).map(([v, label, desc]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={pix.qrMode === v}
              onClick={() => set({ qrMode: v })}
              className={cn('flex min-h-14 items-center gap-3 rounded-[14px] border px-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50', pix.qrMode === v ? 'border-primary bg-primary/12' : 'bg-card')}
            >
              <span aria-hidden="true" className={cn('flex size-4.5 shrink-0 items-center justify-center rounded-full border-2', pix.qrMode === v ? 'border-primary' : 'border-muted-foreground')}>
                {pix.qrMode === v && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span className="flex flex-col gap-px">
                <span className="text-sm font-extrabold">{label}</span>
                <span className="text-[11.5px] text-muted-foreground">{desc}</span>
              </span>
            </button>
          ))}
        </div>
        {pix.qrMode === 'upload' && (
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[14px] border border-dashed border-line-strong p-4 text-center focus-within:ring-3 focus-within:ring-ring/50">
            <span className="text-sm font-bold">{qrFile ? qrFile.name : 'Enviar imagem do QR Code'}</span>
            <span className="text-[11.5px] text-muted-foreground">PNG ou JPG, até 2 MB · gere no app do seu banco em “Receber com Pix”</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                if (f.size > 2 * 1024 * 1024) return toast.error('A imagem passa de 2 MB.')
                setQrFile({ name: f.name, url: typeof URL.createObjectURL === 'function' ? URL.createObjectURL(f) : '' })
              }}
            />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-extrabold">3. Confirmação</h2>
        <label className="flex items-center justify-between gap-3">
          <span className="flex flex-col gap-px">
            <span className="text-[13.5px] font-bold">Pedir comprovante ao aluno</span>
            <span className="text-[11.5px] text-muted-foreground">O aluno anexa a imagem no app e você confirma aqui</span>
          </span>
          <Switch checked={pix.requireProof} onCheckedChange={(v) => set({ requireProof: v })} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-foreground-2">Instruções para o aluno</span>
          <textarea rows={3} maxLength={300} value={pix.instructions} onChange={(e) => set({ instructions: e.target.value })} className={cn(field, 'h-auto resize-none py-3 leading-[1.45]')} />
        </label>
      </div>

      <Button size="lg" disabled={!valid || save.isPending} onClick={() => save.mutate(pix, { onSuccess: () => toast.success('Pix salvo'), onError: () => toast.error('Não foi possível salvar o Pix.') })} className="self-end font-extrabold max-lg:w-full">
        {save.isPending ? 'Salvando…' : 'Salvar Pix'}
      </Button>
    </section>
  )

  const preview = (
    <aside aria-label="Como o aluno vê" className="flex flex-col gap-3 rounded-[20px] border bg-card p-4">
      <span className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-extrabold">Como o aluno vê</h2>
        <span className="text-xs text-muted-foreground">Exemplo: Renato Alves · Trimestral · {formatBRL(sample.amount)}</span>
      </span>
      <div className="flex justify-center rounded-2xl bg-white p-3">
        {pix.qrMode === 'upload' ? qrFile?.url ? <img src={qrFile.url} alt="QR Code Pix enviado" className="size-44 object-contain" /> : <span className="flex size-44 items-center justify-center text-center text-xs text-[#0B0C0E]">Envie a imagem do QR Code ao lado</span> : <PixQr payload={payload} label="QR Code Pix de exemplo" />}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-muted-foreground">Pix copia e cola</span>
        <code className="rounded-lg bg-background p-2.5 text-[11px] leading-[1.45] break-all text-foreground-2">{payload}</code>
        <Button variant="outline" onClick={() => navigator.clipboard?.writeText(payload).then(() => setCopied(true), () => setCopied(false))} className="font-bold">
          {copied ? 'Copiado!' : 'Copiar código'}
        </Button>
      </div>
      <span className="text-[11px] text-muted-foreground">O código segue o padrão BR Code do Banco Central, com valor e identificador da cobrança.</span>
    </aside>
  )

  return desktop ? (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5">
      {form}
      {preview}
    </div>
  ) : (
    form
  )
}
