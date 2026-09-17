import assert from 'node:assert/strict'
import { test } from 'node:test'
import { removeConversation } from '../src/chat/model.ts'
import type { ChatHistory } from '../src/chat/model.ts'

const history: ChatHistory = {
  folders: [],
  selected: 'second',
  conversations: [
    { id: 'first', title: 'First', messages: [], draft: 'Keep my draft' },
    { id: 'second', title: 'Second', messages: [{ id: 'prompt', role: 'user', text: 'Hello' }], draft: '', pending: true },
  ],
}

test('deleting the selected conversation selects a survivor without changing its draft', () => {
  const result = removeConversation(history, 'second')
  assert.equal(result.selected, 'first')
  assert.deepEqual(result.conversations, [history.conversations[0]])
  assert.equal(history.conversations.length, 2)
})

test('deleting another conversation keeps the current selection and pending response', () => {
  const result = removeConversation(history, 'first')
  assert.equal(result.selected, 'second')
  assert.equal(result.conversations[0].pending, true)
  assert.equal(removeConversation(history, 'missing'), history)
})

test('deleting the final conversation leaves a new, empty, usable conversation', () => {
  const result = removeConversation({ folders: [], conversations: [history.conversations[1]], selected: 'second' }, 'second')
  assert.equal(result.conversations.length, 1)
  assert.notEqual(result.selected, 'second')
  assert.equal(result.selected, result.conversations[0].id)
  assert.equal(result.conversations[0].draft, '')
  assert.deepEqual(result.conversations[0].messages, [])
})
