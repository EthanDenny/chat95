import { useLayoutEffect, useRef, useState } from 'react'
import { ScrollArea } from '../components/ScrollArea'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { presentMessages } from './messagePresentation'
import { AssistantMarkdown } from './AssistantMarkdown'
import type { Message } from './model'

export function ChatMessages({ messages, pending, error, toolStatus, onRetry, onShowOperations, width, height: frameHeight }: { width: number; height: number; messages: Message[]; pending?: boolean; error?: string; toolStatus?: string; onRetry: () => void; onShowOperations: (entries: string[], trigger: HTMLElement) => void }) {
  const content = useRef<HTMLDivElement>(null)
  const pageHeight = frameHeight - 4
  const [height, setHeight] = useState(pageHeight)
  const responseText = pending ? toolStatus || 'Thinking...' : error
  const { rows: displayedMessages, response } = presentMessages(messages, responseText)
  useLayoutEffect(() => {
    const element = content.current!
    const measure = () => setHeight(Math.max(pageHeight, Math.ceil(element.offsetHeight)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [messages, pageHeight])
  return <div className="w95-inset chat-message-frame" style={{ width, height: frameHeight }}>
    <ScrollArea label="Message history" width={width - 4} height={pageHeight} contentWidth={width - 20} contentHeight={height} vertical y={Math.max(0, height - pageHeight)}>
      <div ref={content} className="chat-messages" style={{ minHeight: pageHeight }} role="log" aria-label="Conversation messages" aria-live="polite" aria-relevant="additions text">
        {displayedMessages.length ? displayedMessages.map(message => <article key={message.id} className="chat-message">
          <div className="chat-message-author"><Icon name={message.role === 'user' ? 'Notepad' : 'My Computer'} /><strong>{message.role === 'user' ? 'You' : 'Chat95'}</strong></div>
          {message.text && (message.role === 'assistant' && message !== response
            ? <AssistantMarkdown text={message.text} />
            : <p role={message === response ? pending ? 'status' : 'alert' : undefined}>{message.text}</p>)}
          {!!message.toolActivity?.length && <div className="chat-operation-summary">
            <Icon name="Documents" /><span>{message.toolActivity.length} operation{message.toolActivity.length === 1 ? '' : 's'}</span>
            <Button width={70} height={22} aria-label={`Details for ${message.toolActivity.length} recorded operations`} onClick={event => onShowOperations([...message.toolActivity!], event.currentTarget)}>Details...</Button>
          </div>}
          {message === response && !pending && error && <div className="chat-message-actions"><Button onClick={onRetry} width={65}>Retry</Button></div>}
        </article>) : <div className="chat-welcome">
          <div className="chat-welcome-title"><Icon name="My Computer" /><h1>Welcome to Chat95</h1></div>
          <p>Type a message below, then choose Send.</p>
          <p>To start another conversation, choose File &gt; New Conversation.</p>
        </div>}
      </div>
    </ScrollArea>
  </div>
}
