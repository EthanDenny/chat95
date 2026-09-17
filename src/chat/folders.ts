import type { ChatHistory, ConversationFolder } from './model'

export function folderNameError(folders: ConversationFolder[], name: string, exceptId?: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) return 'Enter a folder name.'
  if (trimmed.length > 40) return 'Use 40 characters or fewer.'
  if (folders.some(folder => folder.id !== exceptId && folder.name.toLowerCase() === trimmed.toLowerCase())) return 'A folder with this name already exists.'
}

export function addFolder(history: ChatHistory, folder: ConversationFolder): ChatHistory {
  if (!folder.id || history.folders.some(item => item.id === folder.id) || folderNameError(history.folders, folder.name)) return history
  return { ...history, folders: [...history.folders, { id: folder.id, name: folder.name.trim() }] }
}

export function renameFolder(history: ChatHistory, id: string, name: string): ChatHistory {
  if (folderNameError(history.folders, name, id)) return history
  return { ...history, folders: history.folders.map(folder => folder.id === id ? { ...folder, name: name.trim() } : folder) }
}

export function moveConversation(history: ChatHistory, id: string, folderId: string | null): ChatHistory {
  if (folderId !== null && !history.folders.some(folder => folder.id === folderId)) return history
  return { ...history, conversations: history.conversations.map(chat => {
    if (chat.id !== id) return chat
    const { folderId: _previous, ...rest } = chat
    return folderId === null ? rest : { ...rest, folderId }
  }) }
}

export function removeFolder(history: ChatHistory, id: string): ChatHistory {
  return {
    ...history,
    folders: history.folders.filter(folder => folder.id !== id),
    conversations: history.conversations.map(chat => {
      if (chat.folderId !== id) return chat
      const { folderId: _removed, ...rest } = chat
      return rest
    }),
  }
}
