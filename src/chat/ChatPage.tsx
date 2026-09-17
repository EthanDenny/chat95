import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { TextArea } from '../components/TextArea'
import { TitleBar, WindowFrame } from '../components/WindowChrome'
import { CaptionButton } from '../components/CaptionButton'
import { StatusBar } from '../components/StatusBar'
import { ChatMenu } from './ChatMenu'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { useWin95Cursors } from '../useWin95Cursors'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessages } from './ChatMessages'
import { useChat } from './useChat'
import { useBrowserWindow } from './useBrowserWindow'
import './ChatPage.css'

const CHAT_SCALE = 2
const getDisplay = () => ({ width: window.innerWidth / CHAT_SCALE, height: Math.max(282, window.innerHeight / CHAT_SCALE) })
export default function ChatPage() {
  const [display, setDisplay] = useState(getDisplay)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showStatus, setShowStatus] = useState(true)
  const [about, setAbout] = useState(false)
  const browserWindow = useBrowserWindow()
  const { conversations, selected, setSelected, chat, send, newChat, updateDraft, stop, retry } = useChat()
  const composer = useRef<HTMLTextAreaElement>(null)
  const sidebarWidth = Math.min(240, Math.max(120, Math.floor(display.width * 0.22)))
  const chatLeft = showSidebar ? sidebarWidth + 22 : 8
  const chatWidth = display.width - chatLeft - 8
  const statusSpace = showStatus ? 0 : 22
  const historyHeight = display.height - 218 + statusSpace
  function startChat() { newChat(); composer.current?.focus() }
  function saveConversation() {
    const text = chat.messages.map(message => `${message.role === 'user' ? 'You' : 'Chat95'}:\n${message.text}`).join('\n\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'chat95-conversation.txt'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  useWin95Cursors(CHAT_SCALE)
  useEffect(() => {
    const resize = () => setDisplay(getDisplay())
    let media: MediaQueryList
    const watch = () => { media?.removeEventListener('change', watch); resize(); media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`); media.addEventListener('change', watch) }
    watch(); window.addEventListener('resize', resize)
    return () => { media.removeEventListener('change', watch); window.removeEventListener('resize', resize) }
  }, [])
  return <main className="chat-viewport" aria-label="Chat95">
    <WindowFrame className="chat-shell w95-native-text" style={{ width: display.width, height: display.height, transform: `scale(${CHAT_SCALE})`, transformOrigin: 'top left' }}>
      <div inert={about || !!browserWindow.error}>
      <TitleBar title="Chat95" icon="/icons/0-16.png" className="chat-titlebar" />
      <div className="chat-window-controls" aria-label="Chat95 window controls">
        <CaptionButton kind="minimize" aria-label="Minimize browser window (unavailable)" title="Webpages cannot minimize the browser window. Use the browser’s minimize control." data-window-control="minimize" disabled />
        <CaptionButton kind={browserWindow.fullscreen ? 'restore' : 'maximize'} aria-label={browserWindow.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={browserWindow.fullscreenEnabled ? browserWindow.fullscreen ? 'Exit fullscreen' : 'Enter browser fullscreen' : 'This browser does not support webpage fullscreen.'}
          data-window-control="maximize" disabled={!browserWindow.fullscreenEnabled && !browserWindow.fullscreen} onClick={browserWindow.toggleFullscreen} />
        <CaptionButton kind="close" aria-label="Close Chat95 tab" data-window-control="close" onClick={browserWindow.closeTab} />
      </div>
      <ChatMenu groups={[
        { label: 'File', items: [
          { label: 'New Conversation', action: startChat },
          { label: 'Save Conversation...', action: saveConversation, disabled: !chat.messages.length },
        ] },
        { label: 'Edit', items: [
          { label: 'Select All Message Text', action: () => { composer.current?.focus(); composer.current?.select() }, disabled: !chat.draft },
          { label: 'Clear Message', action: () => { updateDraft(''); composer.current?.focus() }, disabled: !chat.draft },
        ] },
        { label: 'View', items: [
          { label: 'Conversation Sidebar', checked: showSidebar, action: () => setShowSidebar(value => !value) },
          { label: 'Status Bar', checked: showStatus, action: () => setShowStatus(value => !value) },
        ] },
        { label: 'Help', items: [{ label: 'About Chat95...', action: () => setAbout(true) }] },
      ]} />
      {showSidebar && <ChatSidebar width={sidebarWidth} height={display.height - 80 + statusSpace} conversations={conversations} selected={selected} onSelect={setSelected} onNew={startChat} />}
      {showSidebar && <div className="chat-divider" style={{ left: sidebarWidth + 15, bottom: showStatus ? 28 : 6 }} />}
      <section className="chat-main" aria-label="Chat" style={{ left: chatLeft, width: chatWidth }}>
        <header className="chat-heading"><Icon name="Windows document" /><h2>{chat.title}</h2></header>
        <ChatMessages key={chat.id} width={chatWidth} height={historyHeight} messages={chat.messages} pending={chat.pending} error={chat.error} onRetry={retry} onPrompt={send} />
        <form className="chat-composer" onSubmit={event => { event.preventDefault(); send() }}>
          <label htmlFor="chat-message">Message</label>
          <TextArea ref={composer} id="chat-message" aria-label="Message" placeholder="Ask anything..." width={chatWidth} height={55} maxLength={4000} value={chat.draft}
            onChange={event => updateDraft(event.target.value)} onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send() }
            }} />
          <div className="chat-composer-actions"><span>Enter to send · Shift+Enter for a new line</span>{chat.pending ? <Button type="button" onClick={stop} width={65}>Stop</Button> : <Button type="submit" defaultButton disabled={!chat.draft.trim()} width={65}>Send</Button>}</div>
        </form>
      </section>
      {showStatus && <StatusBar className="chat-status" fields={[{ id: 'status', content: chat.pending ? 'Thinking...' : chat.error ? 'Response interrupted' : 'Ready' }, { id: 'messages', content: `${chat.messages.length} messages`, width: 100 }, { id: 'mode', content: 'OpenRouter', width: 90 }]} />}
      </div>
      {browserWindow.error && <div className="chat-dialog-overlay">
        <Dialog title="Browser window" width={280} height={145} onClose={browserWindow.dismissError}
          actions={<Button data-dialog-default onClick={browserWindow.dismissError}>OK</Button>}>
          <p className="chat-browser-notice">{browserWindow.error}</p>
        </Dialog>
      </div>}
      {about && <div className="chat-dialog-overlay">
        <Dialog title="About Chat95" width={260} height={145} onClose={() => setAbout(false)}
          actions={<Button data-dialog-default onClick={() => setAbout(false)}>OK</Button>}>
          <div className="chat-about"><Icon name="My Computer" size={32} /><div><strong>Chat95</strong><p>A Windows 95-style chat.</p><p>Powered by OpenRouter.</p></div></div>
        </Dialog>
      </div>}
    </WindowFrame>
  </main>
}
