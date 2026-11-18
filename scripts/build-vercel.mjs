// Monta um único site para a Vercel: o app do aluno na raiz e o painel em /admin.
import { execSync } from "node:child_process"
import { cpSync, rmSync } from "node:fs"

execSync("pnpm turbo build --filter=aluno --filter=painel", {
  stdio: "inherit",
  env: { ...process.env, APP_BASE_PATH: "/admin/" }, // só o painel lê essa variável
})

rmSync("dist", { recursive: true, force: true })
cpSync("apps/aluno/dist", "dist", { recursive: true })
cpSync("apps/painel/dist", "dist/admin", { recursive: true })
console.log("Site montado em dist/ (aluno em /, painel em /admin)")
