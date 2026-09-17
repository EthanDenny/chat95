import { useLayoutEffect, useRef, useState } from 'react'
import { ScrollArea } from '../components/ScrollArea'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import type { Message } from './model'

export function ChatMessages({ messages, pending, error, onRetry, onPrompt, width, height: frameHeight }: { width: number; height: number; messages: Message[]; pending?: boolean; error?: string; onRetry: () => void; onPrompt: (text: string) => void }) {
  const content = useRef<HTMLDivElement>(null)
  const pageHeight = frameHeight - 4
  const [height, setHeight] = useState(pageHeight)
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
        {messages.length ? messages.map(message => <article key={message.id} className={`chat-message chat-message-${message.role}`}>
          <div className="chat-message-author">{message.role === 'assistant' && <Icon name="My Computer" />}<strong>{message.role === 'user' ? 'You' : 'Chat95'}</strong></div>
          <p>{message.text}</p>
        </article>) : <div className="chat-welcome">
          <Icon name="My Computer" size={32} />
          <h1>What are we working on?</h1>
          <p>A little chat. A lot of gray buttons.</p>
          <div className="chat-suggestions">{['Explain something to me', 'Write a little code', 'Help me plan my day'].map(prompt => <Button key={prompt} width={Math.min(224, width - 52)} onClick={() => onPrompt(prompt)}>{prompt}</Button>)}</div>
        </div>}
        {pending && <p role="status">Thinking...</p>}
        {error && <div className="chat-response-error" role="alert"><p>{error}</p><Button onClick={onRetry} width={65}>Retry</Button></div>}
      </div>
    </ScrollArea>
  </div>
}
