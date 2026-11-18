// Orçamento do guia (seção 11.2): JS da primeira tela do app do aluno ≤ 170 KB gzip.
// Mede o build de produção sem a API simulada (VITE_USE_MOCKS=false): entrada + Home e o que elas importam.
import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const LIMIT_KB = 170
const out = mkdtempSync(join(tmpdir(), 'aluno-budget-'))
execSync(`pnpm --filter aluno exec vite build --outDir ${out} --emptyOutDir --manifest`, { stdio: 'ignore', env: { ...process.env, VITE_USE_MOCKS: 'false' } })

const manifest = JSON.parse(readFileSync(join(out, '.vite/manifest.json'), 'utf8'))
const seen = new Set()
const walk = (key) => {
  if (!manifest[key] || seen.has(key)) return
  seen.add(key)
  for (const dep of manifest[key].imports ?? []) walk(dep)
}
walk(Object.keys(manifest).find((k) => manifest[k].isEntry))
walk(Object.keys(manifest).find((k) => k.includes('features/home/pages/home-page')))

const rows = [...seen].map((k) => [gzipSync(readFileSync(join(out, manifest[k].file))).length / 1024, manifest[k].file]).sort((a, b) => b[0] - a[0])
const total = rows.reduce((s, [kb]) => s + kb, 0)
for (const [kb, file] of rows.slice(0, 6)) console.log(`${kb.toFixed(1).padStart(7)} KB  ${file}`)
console.log(`JS da primeira tela: ${total.toFixed(1)} KB gzip (meta ${LIMIT_KB} KB)`)
process.exit(total <= LIMIT_KB ? 0 : 1)
