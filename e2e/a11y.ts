import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** Meta do guia: WCAG 2.2 AA sem violações (seção 11.1). */
export async function expectAccessible(page: Page, where: string) {
  // Transições no meio (botão saindo do desabilitado, folha abrindo) dariam contraste falso
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity))
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `  ${n.target.join(' ')}`).join('\n')}`)
  expect(summary, `axe em ${where}`).toEqual([])
}
