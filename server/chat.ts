import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import type { Plugin, ViteDevServer } from 'vite'
import { handleChat, jsonReply } from './chat-api.ts'
import type { ChatConfig } from './chat-api.ts'

export function createChatHandler(config: ChatConfig) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const controller = new AbortController()
    const disconnect = () => controller.abort()
    res.on('close', disconnect)
    try {
      const headers = new Headers()
      for (const [name, value] of Object.entries(req.headers)) {
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
      }
      const init: RequestInit & { duplex?: 'half' } = { method: req.method, headers, signal: controller.signal }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = Readable.toWeb(req) as ReadableStream<Uint8Array>
        init.duplex = 'half'
      }
      const response = await handleChat(new Request(`http://${req.headers.host}${req.url}`, init), config)
      if (!res.destroyed) {
        res.writeHead(response.status, Object.fromEntries(response.headers))
        res.end(await response.text())
      }
    } catch {
      if (!res.destroyed) {
        const response = jsonReply(500, { error: 'Chat95 could not complete the request. Please retry.' })
        res.writeHead(response.status, Object.fromEntries(response.headers))
        res.end(await response.text())
      }
    } finally {
      res.off('close', disconnect)
    }
  }
}

export function openRouterPlugin(config: ChatConfig): Plugin {
  const handler = createChatHandler(config)
  const configure = (server: Pick<ViteDevServer, 'middlewares'>) => {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/api/chat') { next(); return }
      void handler(req, res)
    })
  }
  return { name: 'chat95-openrouter', configureServer: configure, configurePreviewServer: configure }
}
