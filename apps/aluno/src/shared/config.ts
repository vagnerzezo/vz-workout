/**
 * Enquanto a API não existe, a API simulada (MSW) roda também no site publicado.
 * Quando a API real chegar, defina VITE_USE_MOCKS=false no ambiente de produção.
 */
export const useMocks = import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'false'

/**
 * O service worker do PWA só entra no build sem a API simulada: os dois disputariam o mesmo escopo,
 * e o do MSW precisa ficar com as requisições /api.
 */
export const pwaEnabled = !import.meta.env.DEV && !useMocks
