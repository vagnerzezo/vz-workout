import { toast } from 'sonner'

/** Retorno uniforme das ações: toast de sucesso, ou de erro com "Tente de novo". Resolve true se deu certo. */
export function runAction(fn: () => Promise<unknown>, messages: { success: string; error: string }): Promise<boolean> {
  return fn().then(
    () => {
      toast.success(messages.success)
      return true
    },
    () => {
      toast.error(`${messages.error} Tente de novo.`)
      return false
    },
  )
}
