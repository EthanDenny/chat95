import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadChatHistory, saveChatHistory } from '../src/chat/storage.ts'
import type { Conversation } from '../src/chat/model.ts'

function memoryStorage(initial: string | null = null) {
  const entries = new Map<string, string>(initial === null ? [] : [['chat95.history.v1', initial]])
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value) },
  }
}

const conversation: Conversation = {
  id: 'one', title: 'Hello', draft: 'An unsent follow-up', messages: [
    { id: 'prompt', role: 'user', text: 'Hello' },
    { id: 'reply:prompt', role: 'assistant', text: 'Hi there.' },
  ],
}

test('history restores conversations, message order, drafts and the selected chat', () => {
  const storage = memoryStorage()
  const history = { folders: [], conversations: [conversation, { id: 'two', title: 'New conversation', draft: 'Another draft', messages: [] }], selected: 'two' }
  assert.equal(saveChatHistory(history, storage), true)
  assert.deepEqual(loadChatHistory(storage), history)
})

test('interrupted replies restore as retryable without persisting transient fields', () => {
  const storage = memoryStorage()
  const interrupted = { ...conversation, messages: conversation.messages.slice(0, 1), pending: true, error: 'Temporary error', apiKey: 'not-for-storage' }
  saveChatHistory({ folders: [], conversations: [interrupted], selected: 'one' }, storage)
  const serialized = storage.getItem('chat95.history.v2')!
  assert.doesNotMatch(serialized, /pending|Temporary error|apiKey|not-for-storage/)
  const restored = loadChatHistory(storage).conversations[0]
  assert.equal(restored.pending, undefined)
  assert.match(restored.error!, /Retry/)
  assert.deepEqual(restored.messages, interrupted.messages)
})

test('invalid history recovers safely and missing selections use the first valid chat', () => {
  for (const value of ['not json', 'null', '{"version":2}', '{"version":1,"conversations":[]}', JSON.stringify({ version: 1, conversations: [conversation, conversation] })]) {
    assert.equal(loadChatHistory(memoryStorage(value)).selected, 'welcome')
  }
  const storage = memoryStorage(JSON.stringify({ version: 1, selected: 'missing', conversations: [
    { ...conversation, id: 'invalid', messages: [{ id: 'bad', role: 'system', text: 'Invalid role' }] },
    { ...conversation, id: 'duplicates', messages: [conversation.messages[0], conversation.messages[0]] },
    conversation,
  ] }))
  assert.deepEqual(loadChatHistory(storage), { folders: [], conversations: [conversation], selected: 'one' })
})

test('blocked storage or an exhausted quota does not break the chat', () => {
  const blocked = {
    getItem: () => { throw new Error('Storage denied') },
    setItem: () => { throw new Error('Quota exceeded') },
  }
  assert.equal(loadChatHistory(blocked).selected, 'welcome')
  assert.equal(saveChatHistory({ folders: [], conversations: [conversation], selected: 'one' }, blocked), false)
})

test('folder history round-trips without leaking extra fields or transient state', () => {
  const storage = memoryStorage()
  const history = { selected: 'one', folders: [{ id: 'work', name: 'Work', secret: 'never-save' }], conversations: [{ ...conversation, folderId: 'work' }] }
  assert.equal(saveChatHistory(history, storage), true)
  assert.deepEqual(loadChatHistory(storage), { ...history, folders: [{ id: 'work', name: 'Work' }] })
  assert.doesNotMatch(storage.getItem('chat95.history.v2')!, /secret|never-save/)
})

test('legacy history migrates without changing messages or overwriting its backup', () => {
  const legacy = JSON.stringify({ version: 1, conversations: [conversation], selected: 'one' })
  const storage = memoryStorage(legacy)
  const loaded = loadChatHistory(storage)
  assert.deepEqual(loaded, { folders: [], conversations: [conversation], selected: 'one' })
  assert(saveChatHistory({ ...loaded, folders: [{ id: 'f', name: 'Work' }] }, storage))
  assert.equal(storage.getItem('chat95.history.v1'), legacy)
  assert.equal(loadChatHistory(storage).folders[0].name, 'Work')
  storage.setItem('chat95.history.v2', 'broken')
  assert.deepEqual(loadChatHistory(storage), loaded)
})

test('malformed folders and orphaned membership do not discard valid conversations', () => {
  const storage = memoryStorage()
  storage.setItem('chat95.history.v2', JSON.stringify({ version: 2, selected: 'one', folders: [
    null, { id: 'blank', name: ' ' }, { id: 'long', name: 'x'.repeat(41) },
    { id: 'valid', name: ' Work ' }, { id: 'valid', name: 'Duplicate' },
  ], conversations: [{ ...conversation, folderId: 'missing' }] }))
  const restored = loadChatHistory(storage)
  assert.deepEqual(restored.folders, [{ id: 'valid', name: 'Work' }])
  assert.deepEqual(restored.conversations, [conversation])
  assert.equal(restored.selected, 'one')
})
