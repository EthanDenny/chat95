import assert from 'node:assert/strict'
import { test } from 'node:test'
import { presentMessages } from '../src/chat/messagePresentation.ts'
import type { Message } from '../src/chat/model.ts'

test('completed replies retain operation receipts without changing ordinary messages', () => {
  const messages: Message[] = [{ id: 'u', role: 'user', text: 'Create Trips' },
    { id: 'a', role: 'assistant', text: 'Created Trips.', toolActivity: ['Created folder Trips.'] }]
  assert.deepEqual(presentMessages(messages).rows, messages)
  assert.equal(presentMessages(messages).response, undefined)
})

test('unfinished receipts are attached to the assistant progress/error message, not the user', () => {
  const user: Message = { id: 'u', role: 'user', text: 'Organize', toolActivity: ['Created folder Trips.'] }
  for (const status of ['Searching conversations...', 'Please retry.']) {
    const { rows, response } = presentMessages([user], status)
    assert.equal(rows.length, 2)
    assert.equal(rows[0].toolActivity, undefined)
    assert.equal(rows[1], response)
    assert.equal(rows[1].role, 'assistant')
    assert.deepEqual(rows[1].toolActivity, user.toolActivity)
  }
  assert.deepEqual(user.toolActivity, ['Created folder Trips.'])
})

test('interrupted earlier turns keep an assistant-owned details entry when a new request follows', () => {
  const { rows } = presentMessages([
    { id: 'u1', role: 'user', text: 'Organize', toolActivity: ['Moved a conversation.'] },
    { id: 'u2', role: 'user', text: 'Hello' },
  ], 'Thinking...')
  assert.deepEqual(rows.map(row => row.role), ['user', 'assistant', 'user', 'assistant'])
  assert.equal(rows[1].id, 'activity:u1')
  assert.deepEqual(rows[1].toolActivity, ['Moved a conversation.'])
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length)
})
