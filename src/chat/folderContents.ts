import type { ListEntry } from '@ethandenny/win95-ui'
import type { Conversation, ConversationFolder } from './model'

export type FolderItem = ListEntry & { id: string; kind: 'folder' | 'chat' }
export type FolderSelection = Pick<FolderItem, 'id' | 'kind'>

export function folderContents(conversations: Conversation[], folders: ConversationFolder[], folderId: string | undefined, search: string): FolderItem[] {
  const query = search.trim().toLowerCase()
  const matches = (value: string) => value.toLowerCase().includes(query)
  const directories: FolderItem[] = folderId && !query ? [] : folders.filter(folder => matches(folder.name))
    .map(folder => ({ id: folder.id, kind: 'folder', label: folder.name, icon: 'Folder' }))
  const documents: FolderItem[] = conversations
    .filter(chat => query ? matches(chat.title) || folders.some(folder => folder.id === chat.folderId && matches(folder.name)) : chat.folderId === folderId)
    .map(chat => ({ id: chat.id, kind: 'chat', label: chat.title, icon: 'Windows document' }))
  const byName = (a: FolderItem, b: FolderItem) => a.label.localeCompare(b.label)
  return [...directories.sort(byName), ...documents.sort(byName)]
}
