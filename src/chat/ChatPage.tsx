import { useEffect, useRef, useState } from 'react'
import {
  Button,
  SplitPane,
  StatusBar,
  TextInput,
  WindowFrame,
  useWin95Cursors,
} from '@ethandenny/win95-ui'
import { ChatMenu, type ChatMenuGroup } from './ChatMenu'
import { ChatToolbar } from './ChatToolbar'
import { FolderDialog, type FolderAction } from './FolderDialog'
import { ToolApprovalDialog } from './ToolApprovalDialog'
import { ToolActivityDialog } from './ToolActivityDialog'
import type { FolderSelection } from './folderContents'
import { ChatSidebar } from './ChatSidebar'
import { ChatConversation } from './ChatConversation'
import {
  AboutChat95Dialog,
  BrowserErrorDialog,
  DeleteConversationDialog,
  type DeleteTarget,
} from './ChatDialogs'
import { ChatTitleBar } from './ChatTitleBar'
import { useChat } from './useChat'
import { useBrowserWindow } from './useBrowserWindow'
import './ChatPage.css'

const CHAT_SCALE = 2

function getDisplay() {
  return {
    width: Math.max(320, Math.floor(window.innerWidth / CHAT_SCALE)),
    height: Math.max(282, Math.floor(window.innerHeight / CHAT_SCALE)),
  }
}

function getStatus(historySaved: boolean, pending?: boolean, toolStatus?: string, error?: string) {
  if (!historySaved) return 'History could not be saved.'
  if (pending) return toolStatus || 'Receiving response...'
  if (error) return 'Response interrupted'
  return 'Ready'
}

export default function ChatPage() {
  const [display, setDisplay] = useState(getDisplay)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarSize, setSidebarSize] = useState(160)
  const [showStatus, setShowStatus] = useState(true)
  const [showFind, setShowFind] = useState(false)
  const [search, setSearch] = useState('')
  const [about, setAbout] = useState(false)
  const [operationDetails, setOperationDetails] = useState<string[] | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const browserWindow = useBrowserWindow()
  const {
    conversations,
    folders,
    selected,
    setSelected,
    chat,
    send,
    newChat,
    deleteChat,
    updateDraft,
    stop,
    retry,
    historySaved,
    createFolder,
    renameFolder,
    deleteFolder,
    moveChat,
    approval,
  } = useChat()
  const [folderLocation, setLocation] = useState<string | undefined>(chat.folderId)
  const location = folders.some(folder => folder.id === folderLocation) ? folderLocation : undefined
  const [selection, setSelection] = useState<FolderSelection | null>({
    kind: 'chat',
    id: selected,
  })
  const [folderAction, setFolderAction] = useState<FolderAction | null>(null)
  const selectedFolder =
    selection?.kind === 'folder' ? folders.find(folder => folder.id === selection.id) : undefined
  const selectedChat =
    selection?.kind === 'chat' ? conversations.find(chat => chat.id === selection.id) : undefined
  const composer = useRef<HTMLTextAreaElement>(null)
  const operationTrigger = useRef<HTMLElement | null>(null)
  const findInput = useRef<HTMLInputElement>(null)
  const workspaceWidth = display.width - 12
  const workspaceTop = showFind ? 106 : 78
  const workspaceHeight = display.height - workspaceTop - (showStatus ? 26 : 6)
  const sidebarWidth = Math.max(104, Math.min(sidebarSize, workspaceWidth - 188))
  const chatWidth = showSidebar ? workspaceWidth - sidebarWidth - 8 : workspaceWidth
  const modalOpen =
    about ||
    !!deleteTarget ||
    !!folderAction ||
    !!browserWindow.error ||
    !!approval ||
    !!operationDetails
  const visibleApproval =
    !folderAction && !deleteTarget && !about && !browserWindow.error && !operationDetails
      ? approval
      : undefined

  function navigateFolder(id?: string) {
    setLocation(id)
    setSearch('')
    setSelection(location && !id ? { kind: 'folder', id: location } : null)
  }
  function openItem(item: FolderSelection) {
    if (item.kind === 'folder') navigateFolder(item.id)
    else {
      setSelected(item.id)
      setSelection(item)
      setLocation(conversations.find(chat => chat.id === item.id)?.folderId)
      setSearch('')
      composer.current?.focus()
    }
  }
  function startChat() {
    setSearch('')
    setSelection({ kind: 'chat', id: newChat(location) })
    composer.current?.focus()
  }
  function saveFolderAction(value: string) {
    if (!folderAction) return
    if (folderAction.kind === 'create') {
      const id = createFolder(value)
      setLocation(undefined)
      setSelection({ kind: 'folder', id })
      setShowSidebar(true)
      setSearch('')
    } else if (folderAction.kind === 'rename') {
      renameFolder(folderAction.folder.id, value)
    } else if (folderAction.kind === 'delete') {
      deleteFolder(folderAction.folder.id)
      setSelection(null)
      if (location === folderAction.folder.id) setLocation(undefined)
    } else {
      moveChat(folderAction.chatId, value || null)
      setSelection({ kind: 'chat', id: folderAction.chatId })
      setLocation(value || undefined)
      setSearch('')
    }
    setFolderAction(null)
  }
  function deleteSelection() {
    if (selectedFolder) setFolderAction({ kind: 'delete', folder: selectedFolder })
    else if (selectedChat) setDeleteTarget({ id: selectedChat.id, title: selectedChat.title })
  }
  function renameSelection() {
    if (selectedFolder) setFolderAction({ kind: 'rename', folder: selectedFolder })
  }
  function findConversations() {
    setShowSidebar(true)
    setShowFind(true)
    findInput.current?.focus()
  }
  function closeFind() {
    setSearch('')
    setShowFind(false)
    setSelection(null)
    composer.current?.focus()
  }
  function saveConversation() {
    const text = chat.messages
      .map(message => `${message.role === 'user' ? 'You' : 'Chat95'}:\n${message.text}`)
      .join('\n\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'chat95-conversation.txt'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function openSelection() {
    if (selection) openItem(selection)
  }

  function newFolder() {
    setFolderAction({ kind: 'create' })
  }

  function selectDraft() {
    composer.current?.focus()
    composer.current?.select()
  }

  function clearDraft() {
    updateDraft('')
    composer.current?.focus()
  }

  function moveSelectedConversation() {
    if (!selectedChat) return
    setFolderAction({
      kind: 'move',
      chatId: selectedChat.id,
      chatTitle: selectedChat.title,
      folderId: selectedChat.folderId,
    })
  }

  function deleteCurrentConversation() {
    setDeleteTarget({ id: chat.id, title: chat.title })
  }

  function confirmConversationDelete() {
    if (!deleteTarget) return
    deleteChat(deleteTarget.id)
    setDeleteTarget(null)
    setSelection(null)
    setSearch('')
  }

  function showOperations(entries: string[], trigger: HTMLElement) {
    operationTrigger.current = trigger
    setOperationDetails(entries)
  }

  useWin95Cursors(CHAT_SCALE)
  useEffect(() => {
    const resize = () => setDisplay(getDisplay())
    let media: MediaQueryList
    const watch = () => {
      media?.removeEventListener('change', watch)
      resize()
      media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      media.addEventListener('change', watch)
    }
    watch()
    window.addEventListener('resize', resize)
    return () => {
      media.removeEventListener('change', watch)
      window.removeEventListener('resize', resize)
    }
  }, [])
  useEffect(() => {
    if (showFind) findInput.current?.focus()
  }, [showFind])
  useEffect(() => {
    document.title = `${chat.title} - Chat95`
  }, [chat.title])
  useEffect(() => {
    // Follow moves of the open document (including tool actions), not ordinary folder browsing.
    setLocation(chat.folderId)
    setSelection({ kind: 'chat', id: chat.id })
  }, [chat.id, chat.folderId])

  const menuGroups: ChatMenuGroup[] = [
    {
      label: 'File',
      items: [
        { label: 'Open', disabled: !selection, action: openSelection },
        { label: 'New Conversation', action: startChat },
        { label: 'New Folder...', action: newFolder },
        {
          label: 'Save Conversation...',
          action: saveConversation,
          disabled: !chat.messages.length,
        },
        'separator',
        { label: 'Delete Conversation...', action: deleteCurrentConversation },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Find Conversations...', action: findConversations },
        'separator',
        { label: 'Select All Message Text', action: selectDraft, disabled: !chat.draft },
        { label: 'Clear Message', action: clearDraft, disabled: !chat.draft },
      ],
    },
    {
      label: 'Folder',
      mnemonic: 'o',
      items: [
        { label: 'New Folder...', action: newFolder },
        { label: 'Rename Folder...', disabled: !selectedFolder, action: renameSelection },
        { label: 'Delete Folder...', disabled: !selectedFolder, action: deleteSelection },
        'separator',
        {
          label: 'Move Conversation...',
          disabled: !selectedChat,
          action: moveSelectedConversation,
        },
      ],
    },
    {
      label: 'View',
      items: [
        {
          label: 'Conversation Sidebar',
          checked: showSidebar,
          action: () => setShowSidebar(value => !value),
        },
        {
          label: 'Status Bar',
          checked: showStatus,
          action: () => setShowStatus(value => !value),
        },
      ],
    },
    {
      label: 'Help',
      items: [{ label: 'About Chat95...', action: () => setAbout(true) }],
    },
  ]

  const statusFields = [
    {
      id: 'status',
      content: getStatus(historySaved, chat.pending, chat.toolStatus, chat.error),
    },
    ...(display.width >= 500
      ? [
          {
            id: 'hint',
            content: 'Enter: Send   Shift+Enter: New line',
            width: 216,
          },
        ]
      : []),
    {
      id: 'messages',
      content: `${chat.messages.length} messages`,
      width: 84,
    },
  ]

  const conversation = (
    <ChatConversation
      ref={composer}
      chat={chat}
      width={chatWidth}
      height={workspaceHeight}
      onSend={send}
      onStop={stop}
      onRetry={retry}
      onDraftChange={updateDraft}
      onShowOperations={showOperations}
    />
  )
  return (
    <main className="chat-viewport" aria-label="Chat95">
      <WindowFrame
        className="chat-shell w95-native-text"
        style={{
          width: display.width,
          height: display.height,
          transform: `scale(${CHAT_SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        <div inert={modalOpen}>
          <ChatTitleBar
            title={`${chat.title} - Chat95`}
            fullscreen={browserWindow.fullscreen}
            fullscreenEnabled={browserWindow.fullscreenEnabled}
            onToggleFullscreen={browserWindow.toggleFullscreen}
            onClose={browserWindow.closeTab}
          />
          <ChatMenu groups={menuGroups} />
          <ChatToolbar
            onNew={startChat}
            onSave={saveConversation}
            onDelete={deleteSelection}
            onFind={findConversations}
            onStop={stop}
            canSave={!!chat.messages.length}
            canDelete={!!selectedFolder || !!selectedChat}
            pending={chat.pending}
          />
          {showFind && (
            <div className="chat-find">
              <label htmlFor="chat-find">Find:</label>
              <TextInput
                ref={findInput}
                id="chat-find"
                aria-label="Find conversations"
                width={display.width - 98}
                height={22}
                value={search}
                onChange={event => {
                  setSearch(event.target.value)
                  setSelection(null)
                }}
                onKeyDown={event => {
                  if (event.key === 'Escape') closeFind()
                }}
              />
              <Button width={48} height={22} onClick={closeFind}>
                Close
              </Button>
            </div>
          )}
          <div className="chat-workspace" style={{ top: workspaceTop }}>
            {showSidebar ? (
              <SplitPane
                width={workspaceWidth}
                height={workspaceHeight}
                split={sidebarWidth}
                onSplitChange={setSidebarSize}
                minPaneSize={104}
                minSecondPaneSize={184}
                label="Conversation pane width"
                first={
                  <ChatSidebar
                    width={sidebarWidth - 4}
                    height={workspaceHeight}
                    conversations={conversations}
                    folders={folders}
                    folderId={location}
                    selection={selection}
                    onSelect={setSelection}
                    onOpen={openItem}
                    onNavigate={navigateFolder}
                    search={search}
                    onRename={renameSelection}
                    onDelete={deleteSelection}
                    onNewFolder={newFolder}
                  />
                }
                second={<div style={{ paddingLeft: 4 }}>{conversation}</div>}
              />
            ) : (
              conversation
            )}
          </div>
          {showStatus && <StatusBar className="chat-status" fields={statusFields} />}
        </div>
        {folderAction && (
          <FolderDialog
            action={folderAction}
            folders={folders}
            onClose={() => setFolderAction(null)}
            onSave={saveFolderAction}
          />
        )}
        {operationDetails && (
          <ToolActivityDialog
            entries={operationDetails}
            width={Math.min(360, display.width - 20)}
            height={Math.min(290, display.height - 20)}
            onClose={() => setOperationDetails(null)}
            restoreFocus={() => operationTrigger.current}
          />
        )}
        {visibleApproval && (
          <ToolApprovalDialog key={visibleApproval.id} approval={visibleApproval} />
        )}
        {browserWindow.error && (
          <BrowserErrorDialog error={browserWindow.error} onClose={browserWindow.dismissError} />
        )}
        {deleteTarget && (
          <DeleteConversationDialog
            target={deleteTarget}
            onDelete={confirmConversationDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
        {about && <AboutChat95Dialog onClose={() => setAbout(false)} />}
      </WindowFrame>
    </main>
  )
}
