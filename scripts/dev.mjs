import { createServer, request as proxyRequest } from "node:http"
import { spawn } from "node:child_process"

const apps = [
  { name: "aluno", port: 5173 },
  { name: "painel", port: 5174 },
].map(({ name, port }) => {
  const child = spawn("pnpm", ["--filter", name, "dev", "--", "--port", String(port), "--strictPort"], {
    env: { ...process.env, ...(name === "painel" ? { APP_BASE_PATH: "/admin/" } : {}) },
    stdio: "inherit",
  })

  child.on("exit", (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(`${name} encerrou (${signal ?? `código ${code}`})`)
      shutdown(code ?? 1)
    }
  })

  return child
})

const gateway = createServer((incoming, response) => {
  const isPanel = incoming.url === "/admin" || incoming.url?.startsWith("/admin/")
  const targetPort = isPanel ? 5174 : 5173
  if (incoming.url === "/admin") {
    response.writeHead(308, { location: "/admin/" })
    response.end()
    return
  }

  const upstream = proxyRequest(
    {
      hostname: "localhost",
      port: targetPort,
      path: incoming.url,
      method: incoming.method,
      headers: { ...incoming.headers, host: `localhost:${targetPort}` },
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers)
      upstreamResponse.pipe(response)
    },
  )

  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502)
    response.end("Servidor da aplicação ainda não está pronto.")
  })

  incoming.pipe(upstream)
})

let shuttingDown = false
const shutdown = (code = 0) => {
  if (shuttingDown) return
  shuttingDown = true
  gateway.close()
  for (const app of apps) app.kill("SIGTERM")
  process.exitCode = code
}

process.on("SIGINT", () => shutdown())
process.on("SIGTERM", () => shutdown())

gateway.listen(3000, () => {
  console.log("Aluno:  http://localhost:3000/")
  console.log("Painel: http://localhost:3000/admin")
})
