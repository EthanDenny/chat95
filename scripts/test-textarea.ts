import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const css = readFileSync(new URL('../src/components/controls.css', import.meta.url), 'utf8')
const component = readFileSync(new URL('../src/components/TextArea.tsx', import.meta.url), 'utf8')

test('textarea scroll content is isolated from its inset border', () => {
  assert.match(component, /<span className="w95-textarea-frame w95-inset"[^>]*style=\{\{ width, height \}\}>/)
  assert.match(component, /<textarea \{\.\.\.props\} className=\{`w95-textarea w95-native-text/)
  assert.match(css, /\.w95-textarea-frame\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden;/s)
  assert.match(css, /textarea\.w95-textarea\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*4px;[^}]*width:\s*calc\(100% - 8px\);[^}]*height:\s*calc\(100% - 8px\);/s)
})

test('disabled textarea applies its face color to both frame and scrolling surface', () => {
  assert.match(component, /data-disabled=\{props\.disabled \|\| undefined\}/)
  assert.match(css, /\.w95-textarea-frame\[data-disabled=true\]\s*\{[^}]*--inset-face:\s*#c0c0c0;/s)
  assert.match(css, /textarea\.w95-textarea:disabled\s*\{[^}]*background:\s*#c0c0c0;/s)
})
