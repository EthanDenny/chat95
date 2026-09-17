import Markdown from 'react-markdown'
import { memo } from 'react'
import emojiRegex from 'emoji-regex'
import type { Root, RootContent } from 'hast'

// Keep the initial feature set small. No raw HTML, remote images, or active links.
const elements = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'code', 'pre']

// Strip after Markdown decodes entities, including text inside emphasis and code.
function removeEmojis() {
  const pattern = emojiRegex()
  function visit(node: Root | RootContent) {
    if (node.type === 'text' || node.type === 'raw') node.value = node.value.replace(pattern, '')
    if ('children' in node) node.children.forEach(visit)
  }
  return (tree: Root) => visit(tree)
}

const plugins = [removeEmojis]

export const AssistantMarkdown = memo(function AssistantMarkdown({ text }: { text: string }) {
  return <div className="chat-markdown"><Markdown allowedElements={elements} unwrapDisallowed rehypePlugins={plugins}>{text}</Markdown></div>
})
