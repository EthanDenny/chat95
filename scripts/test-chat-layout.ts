import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const css = readFileSync(new URL('../src/chat/ChatPage.css', import.meta.url), 'utf8')

test('message text is clipped and kept clear of the inset border while scrolling', () => {
  assert.match(css, /\.chat-message-frame\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden;/s)
  assert.match(css, /\.chat-message-frame::before, \.chat-message-frame::after\s*\{[^}]*left:\s*2px;[^}]*right:\s*18px;[^}]*height:\s*2px;[^}]*background:\s*#fff;/s)
  assert.match(css, /\.chat-message-frame::before\s*\{\s*top:\s*2px;/)
  assert.match(css, /\.chat-message-frame::after\s*\{\s*bottom:\s*2px;/)
})
