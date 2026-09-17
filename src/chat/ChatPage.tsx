import { useEffect, useRef, useState } from 'react'
import { Button, CaptionButton, Dialog, Icon, SplitPane, StatusBar, TextArea, TextInput, TitleBar, WindowFrame, iconUrl, useWin95Cursors } from '@ethandenny/win95-ui'
import { ChatMenu } from './ChatMenu'
import { ChatToolbar } from './ChatToolbar'
import { FolderDialog } from './FolderDialog'
import { ToolApprovalDialog } from './ToolApprovalDialog'
import { ToolActivityDialog } from './ToolActivityDialog'
import type { FolderAction } from './FolderDialog'
import type { FolderSelection } from './folderContents'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessages } from './ChatMessages'
import { useChat } from './useChat'
import { useBrowserWindow } from './useBrowserWindow'
import './ChatPage.css'

const CHAT_SCALE = 2
const getDisplay = () => ({ width: Math.max(320, Math.floor(window.innerWidth / CHAT_SCALE)), height: Math.max(282, Math.floor(window.innerHeight / CHAT_SCALE)) })
export default function ChatPage() {
  const [display, setDisplay] = useState(getDisplay)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarSize, setSidebarSize] = useState(160)
  const [showStatus, setShowStatus] = useState(true)
  const [showFind, setShowFind] = useState(false)
  const [search, setSearch] = useState('')
  const [about, setAbout] = useState(false)
  const [operationDetails, setOperationDetails] = useState<string[] | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const browserWindow = useBrowserWindow()
  const { conversations, folders, selected, setSelected, chat, send, newChat, deleteChat, updateDraft, stop, retry, historySaved, createFolder, renameFolder, deleteFolder, moveChat, approval } = useChat()
  const [folderLocation, setLocation] = useState<string | undefined>(chat.folderId)
  const location = folders.some(folder => folder.id === folderLocation) ? folderLocation : undefined
  const [selection, setSelection] = useState<FolderSelection | null>({ kind: 'chat', id: selected })
  const [folderAction, setFolderAction] = useState<FolderAction | null>(null)
  const selectedFolder = selection?.kind === 'folder' ? folders.find(folder => folder.id === selection.id) : undefined
  const selectedChat = selection?.kind === 'chat' ? conversations.find(chat => chat.id === selection.id) : undefined
  const composer = useRef<HTMLTextAreaElement>(null)
  const operationTrigger = useRef<HTMLElement | null>(null)
  const findInput = useRef<HTMLInputElement>(null)
  const workspaceWidth = display.width - 12
  const workspaceTop = showFind ? 106 : 78
  const workspaceHeight = display.height - workspaceTop - (showStatus ? 26 : 6)
  const sidebarWidth = Math.max(104, Math.min(sidebarSize, workspaceWidth - 188))
  const chatWidth = showSidebar ? workspaceWidth - sidebarWidth - 8 : workspaceWidth
  const compactComposer = chatWidth < 240
  const modalOpen = about || !!deleteTarget || !!folderAction || !!browserWindow.error || !!approval || !!operationDetails
  function navigateFolder(id?: string) {
    setLocation(id); setSearch(''); setSelection(location && !id ? { kind: 'folder', id: location } : null)
  }
  function openItem(item: FolderSelection) {
    if (item.kind === 'folder') navigateFolder(item.id)
    else {
      setSelected(item.id); setSelection(item); setLocation(conversations.find(chat => chat.id === item.id)?.folderId); setSearch('')
      composer.current?.focus()
    }
  }
  function startChat() {
    setSearch(''); setSelection({ kind: 'chat', id: newChat(location) }); composer.current?.focus()
  }
  function saveFolderAction(value: string) {
    if (!folderAction) return
    if (folderAction.kind === 'create') {
      const id = createFolder(value)
      setLocation(undefined); setSelection({ kind: 'folder', id }); setShowSidebar(true); setSearch('')
    } else if (folderAction.kind === 'rename') {
      renameFolder(folderAction.folder.id, value)
    } else if (folderAction.kind === 'delete') {
      deleteFolder(folderAction.folder.id); setSelection(null)
      if (location === folderAction.folder.id) setLocation(undefined)
    } else {
      moveChat(folderAction.chatId, value || null); setSelection({ kind: 'chat', id: folderAction.chatId }); setLocation(value || undefined); setSearch('')
    }
    setFolderAction(null)
  }
  function deleteSelection() {
    if (selectedFolder) setFolderAction({ kind: 'delete', folder: selectedFolder })
    else if (selectedChat) setDeleteTarget({ id: selectedChat.id, title: selectedChat.title })
  }
  function renameSelection() { if (selectedFolder) setFolderAction({ kind: 'rename', folder: selectedFolder }) }
  function findConversations() { setShowSidebar(true); setShowFind(true); findInput.current?.focus() }
  function closeFind() { setSearch(''); setShowFind(false); setSelection(null); composer.current?.focus() }
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
  useEffect(() => { if (showFind) findInput.current?.focus() }, [showFind])
  useEffect(() => { document.title = `${chat.title} - Chat95` }, [chat.title])
  useEffect(() => {
    // Follow moves of the open document (including tool actions), not ordinary folder browsing.
    setLocation(chat.folderId)
    setSelection({ kind: 'chat', id: chat.id })
  }, [chat.id, chat.folderId])
  const conversation = <section className="chat-main" aria-label="Chat" style={{ width: chatWidth, height: workspaceHeight }}>
    <div className="chat-pane-label">Conversation</div>
    <ChatMessages key={chat.id} width={chatWidth} height={workspaceHeight - (compactComposer ? 80 : 62)} messages={chat.messages} pending={chat.pending} error={chat.error} toolStatus={chat.toolStatus} onRetry={retry}
      onShowOperations={(entries, trigger) => { operationTrigger.current = trigger; setOperationDetails(entries) }} />
    <form className="chat-composer" data-compact={compactComposer} onSubmit={event => { event.preventDefault(); send() }}>
      <label htmlFor="chat-message">Message:</label>
      <TextArea ref={composer} id="chat-message" aria-label="Message" placeholder="Type a message" width={chatWidth - (compactComposer ? 54 : 110)} height={36} maxLength={4000} value={chat.draft}
        onChange={event => updateDraft(event.target.value)} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send() }
        }} />
      {chat.pending ? <Button type="button" onClick={stop} width={48}>Stop</Button> : <Button type="submit" defaultButton disabled={!chat.draft.trim()} width={48}>Send</Button>}
    </form>
  </section>
  return <main className="chat-viewport" aria-label="Chat95">
    <WindowFrame className="chat-shell w95-native-text" style={{ width: display.width, height: display.height, transform: `scale(${CHAT_SCALE})`, transformOrigin: 'top left' }}>
      <div inert={modalOpen}>
        <TitleBar title={`${chat.title} - Chat95`} icon={iconUrl('My Computer')} className="chat-titlebar" />
        <div className="chat-window-controls" role="group" aria-label="Chat95 window controls">
          <CaptionButton kind="minimize" aria-label="Minimize browser window (unavailable)" title="Webpages cannot minimize the browser window. Use the browser’s minimize control." data-window-control="minimize" disabled />
          <CaptionButton kind={browserWindow.fullscreen ? 'restore' : 'maximize'} aria-label={browserWindow.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={browserWindow.fullscreenEnabled ? browserWindow.fullscreen ? 'Exit fullscreen' : 'Enter browser fullscreen' : 'This browser does not support webpage fullscreen.'}
            data-window-control="maximize" disabled={!browserWindow.fullscreenEnabled && !browserWindow.fullscreen} onClick={browserWindow.toggleFullscreen} />
          <CaptionButton kind="close" aria-label="Close Chat95 tab" data-window-control="close" onClick={browserWindow.closeTab} />
        </div>
        <ChatMenu groups={[
          { label: 'File', items: [
            { label: 'Open', disabled: !selection, action: () => { if (selection) openItem(selection) } },
            { label: 'New Conversation', action: startChat },
            { label: 'New Folder...', action: () => setFolderAction({ kind: 'create' }) },
            { label: 'Save Conversation...', action: saveConversation, disabled: !chat.messages.length },
            'separator',
            { label: 'Delete Conversation...', action: () => setDeleteTarget({ id: chat.id, title: chat.title }) },
          ] },
          { label: 'Edit', items: [
            { label: 'Find Conversations...', action: findConversations },
            'separator',
            { label: 'Select All Message Text', action: () => { composer.current?.focus(); composer.current?.select() }, disabled: !chat.draft },
            { label: 'Clear Message', action: () => { updateDraft(''); composer.current?.focus() }, disabled: !chat.draft },
          ] },
          { label: 'Folder', mnemonic: 'o', items: [
            { label: 'New Folder...', action: () => setFolderAction({ kind: 'create' }) },
            { label: 'Rename Folder...', disabled: !selectedFolder, action: renameSelection },
            { label: 'Delete Folder...', disabled: !selectedFolder, action: deleteSelection },
            'separator',
            { label: 'Move Conversation...', disabled: !selectedChat, action: () => { if (selectedChat) setFolderAction({ kind: 'move', chatId: selectedChat.id, chatTitle: selectedChat.title, folderId: selectedChat.folderId }) } },
          ] },
          { label: 'View', items: [
            { label: 'Conversation Sidebar', checked: showSidebar, action: () => setShowSidebar(value => !value) },
            { label: 'Status Bar', checked: showStatus, action: () => setShowStatus(value => !value) },
          ] },
          { label: 'Help', items: [{ label: 'About Chat95...', action: () => setAbout(true) }] },
        ]} />
        <ChatToolbar onNew={startChat} onSave={saveConversation} onDelete={deleteSelection}
          onFind={findConversations} onStop={stop} canSave={!!chat.messages.length} canDelete={!!selectedFolder || !!selectedChat} pending={chat.pending} />
        {showFind && <div className="chat-find">
          <label htmlFor="chat-find">Find:</label>
          <TextInput ref={findInput} id="chat-find" aria-label="Find conversations" width={display.width - 98} height={22} value={search}
            onChange={event => { setSearch(event.target.value); setSelection(null) }} onKeyDown={event => { if (event.key === 'Escape') closeFind() }} />
          <Button width={48} height={22} onClick={closeFind}>Close</Button>
        </div>}
        <div className="chat-workspace" style={{ top: workspaceTop }}>
          {showSidebar ? <SplitPane width={workspaceWidth} height={workspaceHeight} split={sidebarWidth} onSplitChange={setSidebarSize} minPaneSize={104} minSecondPaneSize={184} label="Conversation pane width"
            first={<ChatSidebar width={sidebarWidth - 4} height={workspaceHeight} conversations={conversations} folders={folders}
              folderId={location} selection={selection} onSelect={setSelection} onOpen={openItem} onNavigate={navigateFolder} search={search}
              onRename={renameSelection} onDelete={deleteSelection} onNewFolder={() => setFolderAction({ kind: 'create' })} />}
            second={<div style={{ paddingLeft: 4 }}>{conversation}</div>} /> : conversation}
        </div>
        {showStatus && <StatusBar className="chat-status" fields={[
          { id: 'status', content: !historySaved ? 'History could not be saved.' : chat.pending ? chat.toolStatus || 'Receiving response...' : chat.error ? 'Response interrupted' : 'Ready' },
          ...(display.width >= 500 ? [{ id: 'hint', content: 'Enter: Send   Shift+Enter: New line', width: 216 }] : []),
          { id: 'messages', content: `${chat.messages.length} messages`, width: 84 },
        ]} />}
      </div>
      {folderAction && <FolderDialog action={folderAction} folders={folders} onClose={() => setFolderAction(null)} onSave={saveFolderAction} />}
      {operationDetails && <ToolActivityDialog entries={operationDetails} width={Math.min(360, display.width - 20)} height={Math.min(290, display.height - 20)} onClose={() => setOperationDetails(null)} restoreFocus={() => operationTrigger.current} />}
      {approval && !folderAction && !deleteTarget && !about && !browserWindow.error && !operationDetails && <ToolApprovalDialog key={approval.id} approval={approval} />}
      {browserWindow.error && <div className="chat-dialog-overlay">
        <Dialog title="Browser window" width={280} height={145} onClose={browserWindow.dismissError}
          actions={<Button data-dialog-default onClick={browserWindow.dismissError}>OK</Button>}>
          <p className="chat-browser-notice">{browserWindow.error}</p>
        </Dialog>
      </div>}
      {deleteTarget && <div className="chat-dialog-overlay">
        <Dialog title="Delete Conversation" width={290} height={184} onClose={() => setDeleteTarget(null)}
          actions={<><Button onClick={() => { deleteChat(deleteTarget.id); setDeleteTarget(null); setSelection(null); setSearch('') }}>Delete</Button><Button data-dialog-default onClick={() => setDeleteTarget(null)}>Cancel</Button></>}>
          <div className="chat-delete-notice"><Icon name="Recycle Bin full" size={32} /><div><p>Delete “{deleteTarget.title}”?</p><p>This removes the conversation from this browser. This cannot be undone.</p></div></div>
        </Dialog>
      </div>}
      {about && <div className="chat-dialog-overlay">
        <Dialog title="About Chat95" width={280} height={178} onClose={() => setAbout(false)}
          actions={<Button data-dialog-default onClick={() => setAbout(false)}>OK</Button>}>
          <div className="chat-about"><Icon name="My Computer" size={32} /><div><strong>Chat95</strong><p>Version 1.0</p><p>A conversational desktop companion.</p><hr /><p>Conversations are stored on this computer.</p><p>Response service: OpenRouter</p></div></div>
        </Dialog>
      </div>}
    </WindowFrame>
  </main>
}
