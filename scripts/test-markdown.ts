import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AssistantMarkdown } from '../src/chat/AssistantMarkdown.tsx'

const render = (text: string) => renderToStaticMarkup(createElement(AssistantMarkdown, { text }))

test('assistant replies remove emoji sequences without damaging ordinary text', () => {
  const emoji = ['😀', '👍🏽', '👨‍👩‍👧‍👦', '👩🏿‍💻', '🇨🇦', '🏳️‍🌈', '1️⃣', '#️⃣', '*️⃣', '❤️', '☀️', '🫩']
  for (const sequence of emoji) assert.equal(render(`Before${sequence}after`), render('Beforeafter'))
  const ordinary = '1994 # * $ £ € + = → café 日本語'
  assert.equal(render(ordinary), `<div class="chat-markdown"><p>${ordinary}</p></div>`)
})

test('emoji removal also covers formatted text, code and decoded HTML entities', () => {
  assert.equal(render('**Good👍** *news🎉*\n\n- Done✅\n\n`hello😀`\n\n```\nworld🌍\n```'),
    render('**Good** *news*\n\n- Done\n\n`hello`\n\n```\nworld\n```'))
  assert.equal(render('A&#x1F600;B&#128512;C&#x1F1E8;&#x1F1E6;D'), render('ABCD'))
  assert.equal(render('<span>Hi😀</span>'), render('<span>Hi</span>'))
  assert.equal(render('😀'), render('🎉'))
})

test('assistant Markdown renders paragraphs, bullets, bold and italic text', () => {
  const html = render('A **bold** and *italic* introduction.\n\n- First item\n- Second **item**')
  assert.match(html, /<strong>bold<\/strong>/)
  assert.match(html, /<em>italic<\/em>/)
  assert.match(html, /<ul>\s*<li>First item<\/li>\s*<li>Second <strong>item<\/strong><\/li>\s*<\/ul>/)
  assert(!html.includes('**'))
})

test('ordered and nested lists, combined emphasis and escaped markers follow Markdown syntax', () => {
  const html = render('3. **Bold with _italics_**\n4. Another\n   - Nested\n\n\\*literal\\* and snake_case_name')
  assert.match(html, /<ol start="3">/)
  assert.match(html, /<strong>Bold with <em>italics<\/em><\/strong>/)
  assert.match(html, /<ul>\s*<li>Nested/)
  assert.match(html, /\*literal\* and snake_case_name/)
})

test('code preserves literal formatting markers', () => {
  const html = render('`**not bold**`\n\n```\n*not italic*\n```')
  assert.match(html, /<code>\*\*not bold\*\*<\/code>/)
  assert.match(html, /<pre><code>\*not italic\*/)
  assert(!html.includes('<strong>')); assert(!html.includes('<em>'))
})

test('raw HTML is escaped and Markdown cannot load images or create active links', () => {
  const html = render('<script>alert(1)</script>\n\n<img src="https://example.com/track" onerror="alert(1)">\n\n[click](javascript:alert%281%29) ![pixel](https://example.com/pixel)')
  assert(!/<script|<img|<a\s|<iframe/.test(html))
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /click/)
})
