import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

type ChatConfig = { apiKey: string; model: string; fetch?: typeof fetch }
type ChatMessage = { role: 'user' | 'assistant'; content: string }
const MAX_BODY = 128 * 1024

function validMessages(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 100 &&
    value.every(item => item && (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string' && item.content.trim() && item.content.length <= 16000) &&
    value.reduce((length, item) => length + item.content.length, 0) <= 100000 &&
    value.at(-1).role === 'user'
}

function reply(res: ServerResponse, status: number, body: object) {
  if (res.destroyed) return
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

export function createChatHandler(config: ChatConfig) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      reply(res, 405, { error: 'Use POST to send a message.' }); return
    }
    // Only the local app may use this endpoint, which has access to a paid API key.
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) {
      reply(res, 403, { error: 'This request must come from the local app.' }); return
    }
    if (!req.headers['content-type']?.startsWith('application/json')) {
      reply(res, 415, { error: 'Send a JSON request.' }); return
    }
    if (!config.apiKey) {
      reply(res, 503, { error: 'Add OPENROUTER_API_KEY to .env.local, then restart Vite.' }); return
    }
    let messages: ChatMessage[]
    try {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > MAX_BODY) { reply(res, 413, { error: 'This conversation is too long. Start a new chat.' }); return }
        chunks.push(Buffer.from(chunk))
      }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (!validMessages(body?.messages)) {
        reply(res, 400, { error: 'Invalid or oversized conversation. Try a shorter message or start a new chat.' }); return
      }
      messages = body.messages.map(({ role, content }: ChatMessage) => ({ role, content }))
    } catch {
      reply(res, 400, { error: 'Could not read the message.' }); return
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    const disconnect = () => controller.abort()
    res.on('close', disconnect)
    try {
      const response = await (config.fetch ?? fetch)('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'X-OpenRouter-Title': 'Chat95' },
        body: JSON.stringify({ model: config.model, max_tokens: 2048, messages: [
          { role: 'system', content: 'You are Chat95, a helpful assistant. Be clear and concise. Use plain text formatting because this chat does not render Markdown.' },
          ...messages,
        ] }),
      })
      if (!response.ok) {
        const errors: Record<number, string> = {
          401: 'OpenRouter rejected the API key. Check .env.local.',
          402: 'The OpenRouter account needs more credits.',
          403: 'OpenRouter denied access. Check the key’s permissions and spending limit.',
          429: 'OpenRouter is busy or rate limited. Please retry shortly.',
        }
        let error = errors[response.status] ?? 'OpenRouter could not complete the response. Please retry.'
        if (response.status === 403) {
          const details = await response.json().catch(() => null) as { error?: { message?: string } } | null
          if (details?.error?.message?.startsWith('Key limit exceeded')) {
            error = 'This OpenRouter key has reached its spending limit. Raise its limit in OpenRouter, then retry.'
          }
        }
        reply(res, response.status === 429 ? 429 : 502, { error }); return
      }
      const data = await response.json() as { choices?: { message?: { content?: unknown } }[]; model?: string; error?: unknown }
      const content = data.choices?.[0]?.message?.content
      if (typeof content !== 'string' || !content.trim() || data.error) {
        reply(res, 502, { error: 'OpenRouter returned no reply. Please retry.' }); return
      }
      reply(res, 200, { text: content, model: data.model ?? config.model })
    } catch {
      reply(res, 502, { error: controller.signal.aborted ? 'The response timed out. Please retry.' : 'Could not reach OpenRouter. Check your connection and retry.' })
    } finally {
      clearTimeout(timeout)
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
