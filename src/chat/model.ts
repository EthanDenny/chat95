export type Message = { id: string; role: 'user' | 'assistant'; text: string; toolActivity?: string[] }
export function assistantReply(prompt: Message, text: string): Message {
  return { id: `reply:${prompt.id}`, role: 'assistant', text }
}

export type Conversation = {
  id: string
  title: string
  messages: Message[]
  draft: string
  folderId?: string
  pending?: boolean
  error?: string
  toolStatus?: string
}

export const initialConversations: Conversation[] = [
  { id: 'welcome', title: 'New conversation', messages: [], draft: '' },
]

export type ConversationFolder = { id: string; name: string }
export type ChatHistory = { conversations: Conversation[]; selected: string; folders: ConversationFolder[] }

export function removeConversation(history: ChatHistory, id: string): ChatHistory {
  if (!history.conversations.some(chat => chat.id === id)) return history
  const remaining = history.conversations.filter(chat => chat.id !== id)
  const conversations = remaining.length ? remaining : [{ id: crypto.randomUUID(), title: 'New conversation', messages: [], draft: '' }]
  return { ...history, conversations, selected: history.selected === id ? conversations[0].id : history.selected }
}
