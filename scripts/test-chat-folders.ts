import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addFolder, folderNameError, moveConversation, removeFolder, renameFolder } from '../src/chat/folders.ts'
import { removeConversation } from '../src/chat/model.ts'
import type { ChatHistory } from '../src/chat/model.ts'
import { folderContents } from '../src/chat/folderContents.ts'

const history: ChatHistory = {
  selected: 'one', folders: [{ id: 'work', name: 'Work' }, { id: 'personal', name: 'Personal' }],
  conversations: [
    { id: 'one', title: 'A project', folderId: 'work', draft: 'Unsent draft', pending: true, messages: [{ id: 'm', role: 'user', text: 'Hello' }] },
    { id: 'two', title: 'A question', draft: '', messages: [] },
  ],
}

test('folder names are trimmed, nonempty, bounded and unique without regard to case', () => {
  assert(folderNameError(history.folders, ' '))
  assert(folderNameError(history.folders, ' work '))
  assert(folderNameError(history.folders, 'x'.repeat(41)))
  assert.equal(folderNameError(history.folders, 'WORK', 'work'), undefined)
  assert.equal(addFolder(history, { id: 'x', name: 'WORK' }), history)
  const added = addFolder(history, { id: 'new', name: ' Notes ' })
  assert.deepEqual(added.folders.at(-1), { id: 'new', name: 'Notes' })
  assert.equal(addFolder(added, { id: 'new', name: 'Other' }), added)
})

test('renaming a folder preserves membership and refuses duplicate names', () => {
  const renamed = renameFolder(history, 'work', ' Projects ')
  assert.equal(renamed.folders[0].name, 'Projects')
  assert.equal(renamed.conversations, history.conversations)
  assert.equal(renameFolder(history, 'work', 'Personal'), history)
})

test('moving a conversation preserves its messages, draft and pending reply', () => {
  const moved = moveConversation(history, 'one', 'personal')
  assert.deepEqual(moved.conversations[0], { ...history.conversations[0], folderId: 'personal' })
  assert.equal(moved.selected, 'one')
  assert.equal(history.conversations[0].folderId, 'work')
  assert.equal(moveConversation(history, 'one', 'missing'), history)
  const unfiled = moveConversation(moved, 'one', null)
  assert.equal(unfiled.conversations[0].folderId, undefined)
  assert.equal(unfiled.conversations[0].draft, 'Unsent draft')
})

test('deleting a folder returns chats to the root without removing data or selection', () => {
  const result = removeFolder(history, 'work')
  assert.equal(result.conversations.length, 2)
  assert.equal(result.conversations[0].folderId, undefined)
  assert.equal(result.conversations[0].messages, history.conversations[0].messages)
  assert.equal(result.conversations[0].pending, true)
  assert.equal(result.selected, 'one')
  assert.deepEqual(result.folders, [history.folders[1]])
  assert.equal(removeConversation(history, 'one').folders, history.folders)
})

test('root lists folders first alphabetically, then unfiled documents, without a wrapper', () => {
  const items = folderContents(history.conversations, history.folders, undefined, '')
  assert.deepEqual(items.map(item => [item.kind, item.id]), [['folder', 'personal'], ['folder', 'work'], ['chat', 'two']])
  assert(items.every(item => !('children' in item)))
})

test('opening a folder lists only its documents, including an empty folder', () => {
  assert.deepEqual(folderContents(history.conversations, history.folders, 'work', '').map(item => item.id), ['one'])
  assert.deepEqual(folderContents(history.conversations, history.folders, 'personal', ''), [])
})

test('Find matches both conversation titles and folder names', () => {
  const title = folderContents(history.conversations, history.folders, undefined, 'PROJECT')
  assert.equal(title.length, 1)
  assert.equal(title[0].id, 'one')
  const folder = folderContents(history.conversations, history.folders, 'personal', 'work')
  assert.deepEqual(folder.map(item => item.id), ['work', 'one'])
  assert.equal(folderContents(history.conversations, history.folders, undefined, 'missing').length, 0)
})

test('unfiled-only and empty sidebars do not create wrapper folders', () => {
  const unfiled = folderContents([history.conversations[1]], [], undefined, '')
  assert.deepEqual(unfiled, [{ id: 'two', kind: 'chat', label: 'A question', icon: 'Windows document' }])
  assert.deepEqual(folderContents([], [], undefined, ''), [])
})
