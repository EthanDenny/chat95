import { useEffect, useRef, useState } from 'react'
import { initialConversations } from './model'
import type { Conversation, Message } from './model'

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selected, setSelected] = useState('welcome')
  const requests = useRef(new Map<string, AbortController>())
  const chat = conversations.find(item => item.id === selected)!
  useEffect(() => {
    const active = requests.current
    return () => { active.forEach(controller => controller.abort()); active.clear() }
  }, [])

  function update(id: string, patch: Partial<Conversation>) {
    setConversations(items => items.map(item => item.id === id ? { ...item, ...patch } : item))
  }
  async function request(id: string, messages: Message[]) {
    if (requests.current.has(id)) return
    const controller = new AbortController()
    requests.current.set(id, controller)
    update(id, { pending: true, error: undefined })
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.map(({ role, text }) => ({ role, content: text })) }),
      })
      const result = await response.json()
      controller.signal.throwIfAborted()
      if (!response.ok) throw new Error(result.error || 'The response failed. Please retry.')
      if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('No reply received. Please retry.')
      update(id, { messages: [...messages, { id: crypto.randomUUID(), role: 'assistant', text: result.text }] })
    } catch (error) {
      update(id, { error: controller.signal.aborted ? 'Response stopped.' : error instanceof Error ? error.message : 'Could not send your message. Please retry.' })
    } finally {
      requests.current.delete(id)
      update(id, { pending: false })
    }
  }
  function send(text = chat.draft) {
    const prompt = text.trim()
    if (!prompt || requests.current.has(chat.id)) return
    const messages: Message[] = [...chat.messages, { id: crypto.randomUUID(), role: 'user', text: prompt }]
    update(chat.id, { messages, draft: '', title: chat.messages.length ? chat.title : prompt.slice(0, 40) })
    void request(chat.id, messages)
  }
  function newChat() {
    const id = crypto.randomUUID()
    setConversations(items => [{ id, title: 'New conversation', messages: [], draft: '' }, ...items])
    setSelected(id)
  }
  return {
    conversations, selected, setSelected, chat, send, newChat,
    updateDraft: (draft: string) => update(chat.id, { draft }),
    stop: () => requests.current.get(chat.id)?.abort(),
    retry: () => { if (chat.messages.at(-1)?.role === 'user') void request(chat.id, chat.messages) },
  }
}
