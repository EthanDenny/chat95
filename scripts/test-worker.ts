import assert from 'node:assert/strict'
import { test } from 'node:test'
import worker from '../worker/index.ts'
import { handleChat } from '../server/chat-api.ts'

const origin = 'https://chat95.example'
function request(body = '{}', headers: Record<string, string> = {}) {
  return new Request(origin + '/api/chat', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers }, body,
  })
}
function environment(visitor = true, site = true) {
  return {
    OPENROUTER_API_KEY: 'test-secret', OPENROUTER_MODEL: 'nvidia/nemotron-3-super-120b-a12b:free',
    CHAT_RATE_LIMIT: { limit: async () => ({ success: visitor }) },
    SITE_RATE_LIMIT: { limit: async () => ({ success: site }) },
  } as Env
}

test('Worker rejects unknown routes, methods and foreign or missing origins', async () => {
  const env = environment()
  assert.equal((await worker.fetch(new Request(origin + '/api/unknown'), env)).status, 404)
  assert.equal((await worker.fetch(new Request(origin + '/api/chat'), env)).status, 405)
  for (const value of ['', 'https://evil.example', 'null']) {
    assert.equal((await worker.fetch(request('{}', { Origin: value }), env)).status, 403)
  }
  assert.equal((await worker.fetch(request('{}', { 'CF-Connecting-IP': '' }), env)).status, 403)
})

test('Worker enforces both visitor and site limits with a retry delay', async () => {
  for (const env of [environment(false, true), environment(true, false)]) {
    const response = await worker.fetch(request(), env)
    assert.equal(response.status, 429)
    assert.equal(response.headers.get('Retry-After'), '60')
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert(!JSON.stringify(await response.json()).includes('test-secret'))
  }
  assert.equal((await worker.fetch(request(), environment())).status, 400)
})

test('Worker fails closed when its rate limiter is unavailable', async () => {
  const env = environment()
  env.CHAT_RATE_LIMIT.limit = async () => { throw new Error('private implementation detail') }
  const response = await worker.fetch(request(), env)
  assert.equal(response.status, 503)
  assert(!JSON.stringify(await response.json()).includes('private'))
})

test('API validates malformed JSON and content types before contacting provider', async () => {
  let calls = 0
  const config = { apiKey: 'test-secret', model: 'test', fetch: async () => { calls++; return new Response() } }
  assert.equal((await handleChat(request('{'), config)).status, 400)
  assert.equal((await handleChat(request('{}', { 'Content-Type': 'text/plain' }), config)).status, 415)
  assert.equal((await handleChat(request(), { ...config, apiKey: '' })).status, 503)
  assert.equal(calls, 0)
})

test('API limits streamed request bytes without relying on Content-Length', async () => {
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(129 * 1024)); controller.close() },
  })
  const req = new Request(origin + '/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body, duplex: 'half',
  } as RequestInit)
  const response = await handleChat(req, { apiKey: 'test-secret', model: 'test' })
  assert.equal(response.status, 413)
})

test('API bounds provider responses and preserves split UTF-8 characters', async () => {
  const body = JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
  const oversized = await handleChat(request(body), {
    apiKey: 'test-secret', model: 'test',
    fetch: async () => new Response('x'.repeat(513 * 1024)),
  })
  assert.equal(oversized.status, 502)
  const bytes = new TextEncoder().encode(JSON.stringify({ choices: [{ message: { content: 'Hello — café!' } }] }))
  const valid = await handleChat(request(body), {
    apiKey: 'test-secret', model: 'test',
    fetch: async () => new Response(new ReadableStream({
      start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close() },
    })),
  })
  assert.deepEqual(await valid.json(), { text: 'Hello — café!', model: 'test' })
})
