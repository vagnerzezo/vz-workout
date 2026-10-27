/// <reference types="vitest/config" />
import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import pkg from "./package.json" with { type: "json" }

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    // Seção 10 do guia. Desligado no dev (o MSW usa service worker) e registrado à mão em
    // shared/pwa: com a API simulada ligada, quem fica com o service worker é o MSW.
    VitePWA({
      registerType: "prompt", // o aluno decide quando atualizar; nunca no meio do treino
      injectRegister: null,
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "Team Oliveira",
        short_name: "T. Oliveira", // até 12 caracteres: senão o celular corta o nome
        lang: "pt-BR",
        start_url: "/",
        display: "standalone",
        background_color: "#0B0C0E",
        theme_color: "#0B0C0E",
        icons: [
          { src: "/icons/192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globIgnores: ["mockServiceWorker.js"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: { cacheName: "api", networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: { cacheName: "images", expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
})
