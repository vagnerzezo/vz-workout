/**
 * Enquanto a API não existe, a API simulada (MSW) roda também no site publicado.
 * Quando a API real chegar, defina VITE_USE_MOCKS=false no ambiente de produção.
 */
export const useMocks = import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'false'
