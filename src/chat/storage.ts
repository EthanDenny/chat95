import { initialConversations } from './model'
import type { ChatHistory, Conversation, ConversationFolder, Message } from './model'

const STORAGE_KEY = 'chat95.history.v2'
const LEGACY_KEY = 'chat95.history.v1'
type HistoryStorage = Pick<Storage, 'getItem' | 'setItem'>
const activity = (value: unknown) => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string').slice(0, 20).map(item => item.slice(0, 1000)) : []
function storedMessage({ id, role, text, toolActivity }: Message): Message {
  const notes = activity(toolActivity)
  return { id, role, text, ...(notes.length ? { toolActivity: notes } : {}) }
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<Message>
  return typeof message.id === 'string' && !!message.id &&
    (message.role === 'user' || message.role === 'assistant') && typeof message.text === 'string'
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false
  const chat = value as Partial<Conversation>
  return typeof chat.id === 'string' && !!chat.id && typeof chat.title === 'string' &&
    typeof chat.draft === 'string' && Array.isArray(chat.messages) && chat.messages.every(isMessage) &&
    new Set(chat.messages.map(message => message.id)).size === chat.messages.length
}

function isFolder(value: unknown): value is ConversationFolder {
  if (!value || typeof value !== 'object') return false
  const folder = value as Partial<ConversationFolder>
  return typeof folder.id === 'string' && !!folder.id && typeof folder.name === 'string' &&
    !!folder.name.trim() && folder.name.trim().length <= 40
}

export function loadChatHistory(storage?: HistoryStorage): ChatHistory {
  // Keep the old key intact as a migration backup. Older tabs cannot overwrite folders.
  for (const key of [STORAGE_KEY, LEGACY_KEY]) {
    try {
      const saved = JSON.parse((storage ?? window.localStorage).getItem(key) ?? 'null')
      if (![1, 2].includes(saved?.version) || !Array.isArray(saved.conversations)) continue
      const folders: ConversationFolder[] = []
      if (saved.version === 2 && Array.isArray(saved.folders)) {
        for (const folder of saved.folders.filter(isFolder)) {
          if (!folders.some(item => item.id === folder.id)) folders.push({ id: folder.id, name: folder.name.trim() })
        }
      }
      const folderIds = new Set(folders.map(folder => folder.id))
      const conversations: Conversation[] = saved.conversations.filter(isConversation).map(({ id, title, draft, messages, folderId }: Conversation) => ({
        id, title, draft, messages: messages.map(storedMessage),
        ...(folderId && folderIds.has(folderId) ? { folderId } : {}),
        ...(messages.at(-1)?.role === 'user' ? { error: 'No saved reply. Retry to continue this conversation.' } : {}),
      }))
      if (conversations.length && new Set(conversations.map(chat => chat.id)).size === conversations.length) {
        return { conversations, folders, selected: conversations.some(chat => chat.id === saved.selected) ? saved.selected : conversations[0].id }
      }
    } catch {
      // Try the migration backup before falling back to an empty history.
    }
  }
  return { conversations: initialConversations, folders: [], selected: initialConversations[0].id }
}

export function saveChatHistory(history: ChatHistory, storage?: HistoryStorage): boolean {
  try {
    const folders = history.folders.map(({ id, name }) => ({ id, name }))
    const folderIds = new Set(folders.map(folder => folder.id))
    const conversations = history.conversations.map(({ id, title, draft, messages, folderId }) => ({
      id, title, draft, messages: messages.map(storedMessage),
      ...(folderId && folderIds.has(folderId) ? { folderId } : {}),
    }))
    const target = storage ?? window.localStorage
    target.setItem(STORAGE_KEY, JSON.stringify({ version: 2, conversations, folders, selected: history.selected }))
    return true
  } catch {
    return false
  }
}
