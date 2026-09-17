import { useState } from 'react'
import { Button } from '../components/Button'
import { TextInput } from '../components/TextInput'
import { TreeView } from '../components/TreeView'
import { Icon } from '../components/Icon'
import type { Conversation } from './model'

export function ChatSidebar({ conversations, selected, onSelect, onNew, width, height }: {
  width: number; height: number; conversations: Conversation[]; selected: string; onSelect: (id: string) => void; onNew: () => void
}) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(['all-chats'])
  const [folderSelected, setFolderSelected] = useState(false)
  const filtered = conversations.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()))
  return <aside className="chat-sidebar" aria-label="Conversation sidebar" style={{ width }}>
    <Button width={width} onClick={() => { setSearch(''); setExpanded(['all-chats']); setFolderSelected(false); onNew() }}>New chat</Button>
    <TextInput width={width} aria-label="Search conversations" placeholder="Search chats..." value={search} onChange={event => { setSearch(event.target.value); setExpanded(['all-chats']) }} />
    <h2>Conversations</h2>
    <TreeView label="Conversations" width={width} height={height - 125}
      nodes={[{ id: 'all-chats', label: 'All chats', icon: expanded.includes('all-chats') ? 'Open folder' : 'Folder', children: filtered.map(chat => ({ id: chat.id, label: chat.title, icon: 'Windows document' })) }]}
      expanded={expanded} onExpandedChange={setExpanded} selected={folderSelected ? 'all-chats' : selected}
      onSelect={id => { setFolderSelected(id === 'all-chats'); if (id !== 'all-chats') onSelect(id) }} />
    {!filtered.length && <span className="chat-no-results">No chats found.</span>}
    <div className="chat-profile"><Icon name="My Computer" /><span>Local user</span><span className="chat-profile-note">Local</span></div>
  </aside>
}
