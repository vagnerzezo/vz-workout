import type { z } from 'zod'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T extends z.ZodType>(path: string, schema: T, init?: RequestInit): Promise<z.infer<T>> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include', // a sessão vai em cookie httpOnly (decisão para a fase da API)
  })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return schema.parse(await res.json()) // erro de contrato aparece no dev, não na tela do aluno
}
