import { expect, test } from '@playwright/test'

// Metas do guia para o app do aluno no 4G (seção 11.2)
// O orçamento de JS (≤ 170 KB gzip) é medido sem a API simulada: `pnpm budget`.
// O LCP aqui inclui o MSW (~190 KB e o service worker), que sai com a API real: fica registrado, sem reprovar.
test('Home: LCP no 4G com CPU 4× mais lenta', async ({ page, context }) => {
  // 4G "rápido" do Lighthouse: 150 ms de latência, ~1,6 Mbps
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 20_000 })
  const lcp = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        new PerformanceObserver((list) => resolve(list.getEntries().at(-1)!.startTime)).observe({ type: 'largest-contentful-paint', buffered: true })
      }),
  )
  test.info().annotations.push({ type: 'LCP (com MSW)', description: `${Math.round(lcp)} ms` })
  console.log(`LCP (com a API simulada): ${Math.round(lcp)} ms`)
})

test('INP: tocar numa série do treino responde em ≤ 200 ms (CPU 4× mais lenta)', async ({ page, context }) => {
  await page.goto('/treinos/day_c/ativo')
  const hack = page.getByRole('region', { name: 'Agachamento hack (máquina)' })
  await expect(hack).toBeVisible()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.evaluate(() => {
    ;(window as unknown as { __inp: number }).__inp = 0
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) (window as unknown as { __inp: number }).__inp = Math.max((window as unknown as { __inp: number }).__inp, e.duration)
    }).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit)
  })
  await hack.getByRole('button', { name: 'Concluir aquecimento 1' }).click()
  await hack.getByRole('button', { name: 'Concluir série válida 1' }).click()
  await page.getByRole('button', { name: 'Pular' }).click()
  await page.waitForTimeout(500)
  const inp = await page.evaluate(() => (window as unknown as { __inp: number }).__inp)
  console.log(`INP (pior interação): ${Math.round(inp)} ms`)
  expect(inp).toBeLessThanOrEqual(200)
})
