import { forwardRef } from 'react'
import { Button, TextArea } from '@ethandenny/win95-ui'
import { ChatMessages } from './ChatMessages'
import type { Conversation } from './model'

type Props = {
  chat: Conversation
  width: number
  height: number
  onSend: () => void
  onStop: () => void
  onRetry: () => void
  onDraftChange: (value: string) => void
  onShowOperations: (entries: string[], trigger: HTMLElement) => void
}

export const ChatConversation = forwardRef<HTMLTextAreaElement, Props>(function ChatConversation(
  { chat, width, height, onSend, onStop, onRetry, onDraftChange, onShowOperations },
  composer,
) {
  const compactComposer = width < 240

  return (
    <section className="chat-main" aria-label="Chat" style={{ width, height }}>
      <div className="chat-pane-label">Conversation</div>
      <ChatMessages
        key={chat.id}
        width={width}
        height={height - (compactComposer ? 80 : 62)}
        messages={chat.messages}
        pending={chat.pending}
        error={chat.error}
        toolStatus={chat.toolStatus}
        onRetry={onRetry}
        onShowOperations={onShowOperations}
      />
      <form
        className="chat-composer"
        data-compact={compactComposer}
        onSubmit={event => {
          event.preventDefault()
          onSend()
        }}
      >
        <label htmlFor="chat-message">Message:</label>
        <TextArea
          ref={composer}
          id="chat-message"
          aria-label="Message"
          placeholder="Type a message"
          width={width - (compactComposer ? 54 : 110)}
          height={36}
          maxLength={4000}
          value={chat.draft}
          onChange={event => onDraftChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              onSend()
            }
          }}
        />
        {chat.pending ? (
          <Button type="button" onClick={onStop} width={48}>
            Stop
          </Button>
        ) : (
          <Button type="submit" defaultButton disabled={!chat.draft.trim()} width={48}>
            Send
          </Button>
        )}
      </form>
    </section>
  )
})
