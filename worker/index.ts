import { handleChat, jsonReply } from '../server/chat-api'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/api/chat') return jsonReply(404, { error: 'Not found.' })
    if (request.method !== 'POST') return jsonReply(405, { error: 'Use POST to send a message.' }, { Allow: 'POST' })
    if (request.headers.get('Origin') !== url.origin) {
      return jsonReply(403, { error: 'This request must come from the Chat95 app.' })
    }
    try {
      const ip = request.headers.get('CF-Connecting-IP')
      if (!ip) return jsonReply(403, { error: 'Could not verify the request origin.' })
      const visitor = await env.CHAT_RATE_LIMIT.limit({ key: ip })
      if (!visitor.success) {
        return jsonReply(429, { error: 'Too many messages. Please wait a minute and retry.' }, { 'Retry-After': '60' })
      }
      // Cloudflare counters are local to each data center, not a global spending cap.
      const site = await env.SITE_RATE_LIMIT.limit({ key: 'chat95' })
      if (!site.success) {
        return jsonReply(429, { error: 'Chat95 is busy. Please wait a minute and retry.' }, { 'Retry-After': '60' })
      }
      return await handleChat(request, { apiKey: env.OPENROUTER_API_KEY, model: env.OPENROUTER_MODEL })
    } catch {
      console.error(JSON.stringify({ event: 'chat_request_failed' }))
      return jsonReply(503, { error: 'Chat95 is temporarily unavailable. Please retry shortly.' })
    }
  },
} satisfies ExportedHandler<Env>
