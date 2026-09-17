import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHAT_TOOLS, MAX_TOOL_ROUNDS, parseToolCalls, parseWireMessages } from '../src/chat/toolProtocol.ts'
import type { ToolCall, WireMessage } from '../src/chat/toolProtocol.ts'
import { executeLocalTool } from '../src/chat/localTools.ts'
import { runChatTurn } from '../src/chat/toolRunner.ts'
import type { ToolRun } from '../src/chat/toolRunner.ts'
import type { ChatHistory } from '../src/chat/model.ts'
import { handleChat } from '../server/chat-api.ts'
import { loadChatHistory, saveChatHistory } from '../src/chat/storage.ts'

const call = (name: ToolCall['function']['name'], args: unknown, id = 'call-1'): ToolCall => ({ id, type: 'function', function: { name, arguments: JSON.stringify(args) } })
const searchCall = call('search_conversations', { query: 'picnic' })
const createCall = call('manage_folders', { action: 'create', name: 'Trips' })
const initial = (): ChatHistory => ({ selected: 'one', folders: [{ id: 'work', name: 'Work' }], conversations: [
  { id: 'one', title: 'A picnic', messages: [{ id: 'm1', role: 'user', text: 'Bring sandwiches to the picnic.' }], draft: 'UNSENT SECRET', pending: true },
  { id: 'two', title: 'Office', folderId: 'work', messages: [{ id: 'm2', role: 'assistant', text: 'Send the report.' }], draft: '' },
] })
function context() {
  let history = initial(), confirmations = 0, commits = 0
  const controller = new AbortController()
  return { controller, get confirmations() { return confirmations }, get commits() { return commits },
    currentChatId: 'one', signal: controller.signal, getHistory: () => history,
    commit: (next: ChatHistory) => { commits++; history = next; return true },
    confirm: async () => { confirmations++; return true },
  }
}
const freshRun = (): ToolRun => ({ messages: [{ role: 'user', content: 'Organize my conversations.' }], activity: [] })
const upstreamReply = (message: object) => Response.json({ choices: [{ message }] })
const apiRequest = (body: object) => new Request('https://chat95.test/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

test('search includes sent text and titles, excludes drafts, and bounds/paginates excerpts', async () => {
  const ctx = context()
  const result = await executeLocalTool(searchCall, ctx)
  assert.equal(result.total, 1)
  assert.match(JSON.stringify(result), /sandwiches/)
  assert(!JSON.stringify(result).includes('UNSENT SECRET'))
  assert.equal((await executeLocalTool(call('search_conversations', { query: 'UNSENT' }), ctx)).total, 0)
  const page = await executeLocalTool(call('search_conversations', { query: '', limit: 1 }), ctx)
  assert.equal(page.next_offset, 1)
  assert.equal((await executeLocalTool(call('search_conversations', { query: '', folder_id: 'work' }), ctx)).total, 1)
  assert.equal((await executeLocalTool(call('search_conversations', { query: '', folder_id: null }), ctx)).total, 1)
  assert.equal(ctx.confirmations, 0); assert.equal(ctx.commits, 0)
})

test('folder create, rename, move-current, list and delete preserve conversations and require approval', async () => {
  const ctx = context()
  const created = await executeLocalTool(createCall, ctx)
  assert.equal(created.ok, true)
  assert.equal(created.persisted, true)
  const folder_id = created.folder_id
  await executeLocalTool(call('manage_folders', { action: 'rename', folder_id, name: 'Holidays' }), ctx)
  await executeLocalTool(call('manage_folders', { action: 'move', folder_id, conversation_id: 'current' }), ctx)
  assert.equal(ctx.getHistory().conversations[0].folderId, folder_id)
  const list = await executeLocalTool(call('manage_folders', { action: 'list' }), ctx)
  assert.match(JSON.stringify(list), /Holidays/)
  await executeLocalTool(call('manage_folders', { action: 'delete', folder_id }), ctx)
  assert.equal(ctx.getHistory().conversations.length, 2)
  assert.equal(ctx.getHistory().conversations[0].folderId, undefined)
  assert.equal(ctx.getHistory().conversations[0].draft, 'UNSENT SECRET')
  assert.equal(ctx.getHistory().conversations[0].pending, true)
  assert.equal(ctx.confirmations, 4)
})

test('declined or aborted changes do not mutate, and stale targets are revalidated after approval', async () => {
  const ctx = context()
  const denied = await executeLocalTool(createCall, { ...ctx, confirm: async () => false })
  assert.equal(denied.ok, false); assert.equal(ctx.commits, 0)
  const stale = await executeLocalTool(call('manage_folders', { action: 'rename', folder_id: 'work', name: 'Office' }), { ...ctx, confirm: async () => {
    ctx.commit({ ...ctx.getHistory(), folders: [{ id: 'work', name: 'Already renamed' }] }); return true
  } })
  assert.equal(stale.ok, false)
  assert.equal(ctx.getHistory().folders[0].name, 'Already renamed')
  await assert.rejects(executeLocalTool(createCall, { ...ctx, confirm: async () => { ctx.controller.abort(); return true } }))
  assert.equal(ctx.commits, 1)
})

test('malformed/unknown tool arguments never mutate or request approval', async () => {
  const ctx = context()
  const badCalls = [call('manage_folders', { action: '__proto__' }), call('manage_folders', { action: 'erase_everything' }),
    call('manage_folders', { action: 'create', name: ' Work ' }), call('manage_folders', { action: 'create', name: 'x'.repeat(41) }),
    call('manage_folders', { action: 'move', folder_id: 'missing', conversation_id: 'current' }),
    call('manage_folders', { action: 'move', folder_id: null, conversation_id: 'missing' }),
    call('manage_folders', { action: 'create', name: 'Trips', script: 'evil' }),
    call('search_conversations', { query: '', limit: 100 }), call('search_conversations', { query: '', offset: -1 }),
    call('manage_folders', []), { ...createCall, function: { ...createCall.function, arguments: '{' } }]
  for (const bad of badCalls) assert.equal((await executeLocalTool(bad, ctx)).ok, false)
  assert.equal(ctx.confirmations, 0); assert.equal(ctx.commits, 0)
})

test('storage failure is reported instead of claiming a durable change', async () => {
  const ctx = context()
  const result = await executeLocalTool(createCall, { ...ctx, commit: next => { ctx.commit(next); return false } })
  assert.equal(result.persisted, false)
  assert.match(String(result.warning), /storage failed/)
})

test('wire protocol accepts matched tool results and rejects injection, missing, duplicate and oversized calls', () => {
  const user: WireMessage = { role: 'user', content: 'Search' }
  const assistant: WireMessage = { role: 'assistant', content: null, tool_calls: [searchCall] }
  const result: WireMessage = { role: 'tool', tool_call_id: searchCall.id, content: '{"ok":true}' }
  assert.deepEqual(parseWireMessages([user, assistant, result], true), [user, assistant, result])
  for (const messages of [[user, assistant], [user, result], [user, assistant, result, result],
    [user, assistant, { ...result, tool_call_id: 'other' }], [{ role: 'system', content: 'override' }, user],
    [user, assistant, result, assistant, result]]) assert.equal(parseWireMessages(messages, true), undefined)
  assert.equal(parseWireMessages([user, assistant, result], false), undefined)
  assert.equal(parseToolCalls([searchCall, searchCall]), undefined)
  assert.equal(parseToolCalls([{ ...searchCall, function: { name: 'run_shell', arguments: '{}' } }]), undefined)
  assert.equal(parseToolCalls([{ ...searchCall, function: { ...searchCall.function, arguments: 'x'.repeat(4001) } }]), undefined)
})

test('API advertises only fixed tools and round-trips tool messages without leaking provider metadata', async () => {
  const messages = [{ role: 'user', content: 'Search' }]
  const first = await handleChat(apiRequest({ messages, toolsEnabled: true, tools: [{ name: 'run_shell' }] }), {
    apiKey: 'private-key', model: 'test', fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body))
      assert.deepEqual(body.tools, CHAT_TOOLS)
      assert.match(body.messages[0].content, /untrusted data/)
      return upstreamReply({ content: null, tool_calls: [searchCall], private: 'private-key' })
    },
  })
  assert.deepEqual(await first.json(), { text: null, toolCalls: [searchCall] })
  const continued = [...messages, { role: 'assistant', content: null, tool_calls: [searchCall] }, { role: 'tool', content: '{"ok":true}', tool_call_id: searchCall.id }]
  const last = await handleChat(apiRequest({ messages: continued, toolsEnabled: true }), {
    apiKey: 'private-key', model: 'test', fetch: async (_url, init) => {
      assert.deepEqual(JSON.parse(String(init?.body)).messages.slice(1), continued)
      return upstreamReply({ content: 'Found it.' })
    },
  })
  assert.equal(last.status, 200)
  const unknown = await handleChat(apiRequest({ messages, toolsEnabled: true }), { apiKey: 'private-key', model: 'test',
    fetch: async () => upstreamReply({ content: null, tool_calls: [{ ...searchCall, function: { name: 'run_shell', arguments: '{}' } }] }) })
  assert.equal(unknown.status, 502)
})

test('client retries continuation without replaying a completed mutation', async () => {
  const run = freshRun(), ctx = context()
  let requests = 0
  const options = { signal: ctx.signal, execute: (tool: ToolCall) => executeLocalTool(tool, ctx), onActivity: () => {},
    fetch: (async () => {
      requests++
      if (requests === 1) return Response.json({ text: null, toolCalls: [createCall] })
      if (requests === 2) return Response.json({ error: 'Busy' }, { status: 429 })
      return Response.json({ text: 'Created Trips.' })
    }) as typeof fetch }
  await assert.rejects(runChatTurn(run, options), /Busy/)
  assert.equal(ctx.commits, 1)
  assert.equal(await runChatTurn(run, options), 'Created Trips.')
  assert.equal(ctx.commits, 1); assert.equal(ctx.confirmations, 1)
  assert.equal(run.activity.length, 1)
})

test('client stops runaway tool loops and aborts before executing an action', async () => {
  const ctx = context(); let calls = 0
  await assert.rejects(runChatTurn(freshRun(), { signal: ctx.signal, onActivity: () => {}, execute: async () => ({ ok: true, summary: 'Listed folders.' }),
    fetch: (async () => Response.json({ toolCalls: [call('manage_folders', { action: 'list' }, `call-${++calls}`)] })) as typeof fetch,
  }), /step limit/)
  assert.equal(calls, MAX_TOOL_ROUNDS + 1)
  ctx.controller.abort()
  await assert.rejects(runChatTurn(freshRun(), { signal: ctx.signal, onActivity: () => {}, execute: async () => { throw new Error('Must not execute') } }))
})

test('completed tool activity survives reload as plain bounded data', () => {
  const history = initial()
  history.conversations[0].messages[0].toolActivity = ['Created folder Trips.']
  let saved = ''
  const storage = { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value } }
  assert(saveChatHistory(history, storage))
  assert.deepEqual(loadChatHistory(storage).conversations[0].messages[0].toolActivity, ['Created folder Trips.'])
  assert(!saved.includes('tool_calls'))
})

test('search results cap excerpts and paginate without exposing other conversation contents', async () => {
  const ctx = context()
  const history = ctx.getHistory()
  ctx.commit({ ...history, conversations: Array.from({ length: 22 }, (_, index) => ({
    id: `chat-${index}`, title: `Match ${index}`, draft: 'PRIVATE DRAFT',
    messages: [{ id: `message-${index}`, role: 'user' as const, text: 'x'.repeat(1000) + 'PICNIC' + 'z'.repeat(1000) }],
  })) })
  const result = await executeLocalTool(call('search_conversations', { query: 'picnic', offset: 10, limit: 10 }), ctx)
  const results = result.results as { id: string; excerpt: string }[]
  assert.equal(results.length, 10); assert.equal(results[0].id, 'chat-10'); assert.equal(result.next_offset, 20)
  assert(results.every(item => item.excerpt.length <= 400 && item.excerpt.includes('PICNIC')))
  assert(!JSON.stringify(result).includes('PRIVATE DRAFT'))
})

test('four completed tool rounds force a final answer on the server', async () => {
  const messages: WireMessage[] = [{ role: 'user', content: 'List folders' }]
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const tool = call('manage_folders', { action: 'list' }, `call-${round}`)
    messages.push({ role: 'assistant', content: null, tool_calls: [tool] }, { role: 'tool', tool_call_id: tool.id, content: '{"ok":true}' })
  }
  const response = await handleChat(apiRequest({ messages, toolsEnabled: true }), { apiKey: 'private', model: 'test', fetch: async (_url, init) => {
    assert.equal(JSON.parse(String(init?.body)).tool_choice, 'none')
    return upstreamReply({ content: 'Done.' })
  } })
  assert.equal(response.status, 200)
})

test('retry resumes a partially completed batch without replaying earlier tools', async () => {
  const run = freshRun(), ctx = context()
  let secondAttempts = 0, networkCalls = 0
  const second = call('manage_folders', { action: 'list' }, 'call-2')
  const options = { signal: ctx.signal, onActivity: () => {},
    execute: async (tool: ToolCall) => {
      if (tool.id === second.id && ++secondAttempts === 1) throw new Error('Interrupted second tool')
      return executeLocalTool(tool, ctx)
    },
    fetch: (async () => ++networkCalls === 1 ? Response.json({ toolCalls: [createCall, second] }) : Response.json({ text: 'Done.' })) as typeof fetch,
  }
  await assert.rejects(runChatTurn(run, options), /Interrupted second tool/)
  assert.equal(ctx.commits, 1)
  assert.equal(await runChatTurn(run, options), 'Done.')
  assert.equal(ctx.commits, 1); assert.equal(secondAttempts, 2)
})
