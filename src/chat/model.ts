export type Message = { id: string; role: 'user' | 'assistant'; text: string }
export type Conversation = {
  id: string
  title: string
  messages: Message[]
  draft: string
  pending?: boolean
  error?: string
}

export const initialConversations: Conversation[] = [
  { id: 'welcome', title: 'New conversation', messages: [], draft: '' },
]
