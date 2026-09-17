import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import test from 'node:test'
import ts from 'typescript'

// The shipping UI must remain DOM-based, including lazy gallery modules.
// Offline screenshot renderers live in scripts/reference and may use canvas.
test('browser source contains no canvas UI or offline renderer dependencies', () => {
  const root = resolve('src')
  const files = readdirSync(root, { recursive: true }).filter((file): file is string => typeof file === 'string' && /\.tsx?$/.test(file))
  const failures: string[] = []
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    function check(node: ts.Node) {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === 'canvas') failures.push(`${file}: canvas element`)
      if (ts.isPropertyAccessExpression(node) && ['getContext', 'drawImage', 'fillRect', 'putImageData'].includes(node.name.text)) failures.push(`${file}: canvas drawing API`)
      if (ts.isNewExpression(node) && node.expression.getText(source) === 'OffscreenCanvas') failures.push(`${file}: offscreen canvas`)
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith('.')) {
        const target = resolve(root, file, '..', node.moduleSpecifier.text)
        if (relative(root, target).startsWith('..')) failures.push(`${file}: imports outside browser source`)
      }
      ts.forEachChild(node, check)
    }
    check(source)
  }
  assert.deepEqual(failures, [])
})
