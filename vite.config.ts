import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { openRouterPlugin } from './server/chat.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), openRouterPlugin({
      apiKey: env.OPENROUTER_API_KEY ?? '',
      model: env.OPENROUTER_MODEL || 'openrouter/free',
    })],
  }
})
