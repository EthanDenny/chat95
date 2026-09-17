import { useLayoutEffect, useRef, useState } from 'react'
import { ListView } from '../components/ListView'
import { Dropdown } from '../components/Dropdown'
import { Icon } from '../components/Icon'
import { folderContents } from './folderContents'
import type { FolderSelection } from './folderContents'
import type { Conversation, ConversationFolder } from './model'

export function ChatSidebar({ conversations, folders, folderId, selection, onSelect, onOpen, onNavigate, onNewFolder, onRename, onDelete, search, width, height }: {
  width: number; height: number; conversations: Conversation[]; folders: ConversationFolder[]; folderId: string | undefined; selection: FolderSelection | null
  onSelect: (item: FolderSelection) => void; onOpen: (item: FolderSelection) => void; onNavigate: (id?: string) => void
  onNewFolder: () => void; onRename: () => void; onDelete: () => void; search: string
}) {
  const items = folderContents(conversations, folders, folderId, search)
  const locations = [{ id: undefined, name: 'Conversations' }, ...folders]
  const selected = items.findIndex(item => item.id === selection?.id && item.kind === selection.kind)
  const list = useRef<HTMLDivElement>(null)
  const [listFocused, setListFocused] = useState(false)
  useLayoutEffect(() => {
    list.current?.querySelector('[role="listbox"]')?.scrollTo(0, 0)
  }, [folderId, search])
  return <aside className="chat-sidebar" aria-label="Conversation browser" style={{ width, height }}
    onKeyDown={event => {
      if (!(event.target instanceof Element) || !event.target.closest('.w95-list-viewport')) return
      if (event.key === 'Backspace' && folderId) { event.preventDefault(); onNavigate() }
      if (event.key === 'F2' && selection?.kind === 'folder') { event.preventDefault(); onRename() }
      if (event.key === 'Delete' && selected >= 0) { event.preventDefault(); onDelete() }
    }}>
    <div className="chat-sidebar-heading"><h2>Look in:</h2><div>
      <button type="button" aria-label="Up one level" title="Up one level (Backspace)" disabled={!folderId && !search} onClick={() => onNavigate()}><span className="chat-up-folder"><Icon name="Folder" /><span aria-hidden="true">↑</span></span></button>
      <button type="button" aria-label="New folder" title="New folder in Conversations" onClick={onNewFolder}><Icon name="Folder" /></button>
    </div></div>
    <Dropdown label="Look in" width={width} height={22} options={locations.map(folder => folder.name)}
      value={Math.max(0, locations.findIndex(folder => folder.id === folderId))} onChange={index => onNavigate(locations[index].id)} />
    <div ref={list} className="chat-folder-list" onFocusCapture={() => setListFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setListFocused(false) }}>
      <ListView active={listFocused} label={search.trim() ? 'Search results' : 'Folder contents'} width={width} height={height - 64}
        items={items} selected={selected} onSelect={index => onSelect(items[index])} onActivate={index => onOpen(items[index])} />
      {!items.length && <span className="chat-no-results">{search.trim() ? 'No matches.' : 'This folder is empty.'}</span>}
    </div>
    <div className="chat-folder-status" role="status">{items.length} object{items.length === 1 ? '' : 's'}{search.trim() ? ' found' : ''}</div>
  </aside>
}
