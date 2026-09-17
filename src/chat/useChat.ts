import { useEffect, useRef, useState } from 'react'
import { assistantReply, removeConversation } from './model'
import type { ChatHistory, Conversation, Message } from './model'
import { executeLocalTool } from './localTools'
import { runChatTurn } from './toolRunner'
import type { ToolRun } from './toolRunner'
import { useToolConfirmations } from './useToolConfirmations'
import { loadChatHistory, saveChatHistory } from './storage'
import { addFolder, renameFolder, removeFolder, moveConversation } from './folders'

export function useChat() {
  const [history, setHistoryState] = useState(loadChatHistory)
  const historyRef = useRef(history)
  function setHistory(updater: ChatHistory | ((history: ChatHistory) => ChatHistory)) {
    const next = typeof updater === 'function' ? updater(historyRef.current) : updater
    historyRef.current = next
    setHistoryState(next)
  }
  const { conversations, selected, folders } = history
  const [historySaved, setHistorySaved] = useState(true)
  const setSelected = (selected: string) => setHistory(history => ({ ...history, selected }))
  const requests = useRef(new Map<string, AbortController>())
  const runs = useRef(new Map<string, { promptId: string; run: ToolRun }>())
  const { approval, confirm } = useToolConfirmations()
  const chat = conversations.find(item => item.id === selected)!
  useEffect(() => {
    // Report the result of syncing with external storage; writes cannot run during render.
    // oxlint-disable-next-line react/set-state-in-effect
    setHistorySaved(saveChatHistory(history))
  }, [history])
  useEffect(() => {
    const active = requests.current
    return () => { active.forEach(controller => controller.abort()); active.clear() }
  }, [])

  function update(id: string, patch: Partial<Conversation>) {
    setHistory(history => ({ ...history, conversations: history.conversations.map(item => item.id === id ? { ...item, ...patch } : item) }))
  }
  async function request(id: string, messages: Message[]) {
    if (requests.current.has(id)) return
    const controller = new AbortController()
    requests.current.set(id, controller)
    const prompt = messages.at(-1)!
    const previous = runs.current.get(id)
    const run: ToolRun = previous?.promptId === prompt.id ? previous.run : {
      messages: messages.map(({ role, text, toolActivity }) => ({ role, content: text + (role === 'user' && toolActivity?.length ? `\n\n[Local app activity already completed: ${toolActivity.join(' ')}]` : '') })),
      activity: [...(prompt.toolActivity ?? [])],
    }
    runs.current.set(id, { promptId: prompt.id, run })
    update(id, { pending: true, error: undefined, toolStatus: 'Thinking...' })
    try {
      const text = await runChatTurn(run, {
        signal: controller.signal,
        onActivity: (toolStatus, activity) => setHistory(history => ({ ...history, conversations: history.conversations.map(chat => chat.id !== id ? chat : {
          ...chat, toolStatus, messages: chat.messages.map(message => message.id === prompt.id ? { ...message, toolActivity: [...activity] } : message),
        }) })),
        execute: call => executeLocalTool(call, {
          currentChatId: id, signal: controller.signal, getHistory: () => historyRef.current,
          commit: next => { setHistory(next); const saved = saveChatHistory(next); setHistorySaved(saved); return saved },
          confirm: confirmation => {
            update(id, { toolStatus: 'Waiting for your permission...' })
            return confirm(confirmation, historyRef.current.conversations.find(chat => chat.id === id)?.title ?? 'Conversation', controller.signal)
          },
        }),
      })
      controller.signal.throwIfAborted()
      update(id, { messages: [...messages.map(message => message.id === prompt.id ? { ...message, toolActivity: undefined } : message),
        { ...assistantReply(prompt, text), ...(run.activity.length ? { toolActivity: [...run.activity] } : {}) }] })
      runs.current.delete(id)
    } catch (error) {
      update(id, { error: controller.signal.aborted ? 'Response stopped.' : error instanceof Error ? error.message : 'Could not send your message. Please retry.' })
    } finally {
      requests.current.delete(id)
      update(id, { pending: false, toolStatus: undefined })
    }
  }
  function send(text = chat.draft) {
    const prompt = text.trim()
    if (!prompt || requests.current.has(chat.id)) return
    const messages: Message[] = [...chat.messages, { id: crypto.randomUUID(), role: 'user', text: prompt }]
    update(chat.id, { messages, draft: '', title: chat.messages.length ? chat.title : prompt.slice(0, 40) })
    void request(chat.id, messages)
  }
  function newChat(folderId?: string | null) {
    const id = crypto.randomUUID()
    setHistory(history => ({ ...history, selected: id, conversations: [{ id, title: 'New conversation', messages: [], draft: '',
      ...(history.folders.some(folder => folder.id === folderId) ? { folderId: folderId! } : {}),
    }, ...history.conversations] }))
    return id
  }
  function deleteChat(id: string) {
    requests.current.get(id)?.abort()
    runs.current.delete(id)
    setHistory(history => removeConversation(history, id))
  }
  return {
    conversations, selected, setSelected, chat, send, newChat, deleteChat, historySaved, folders, approval,
    createFolder: (name: string) => {
      const id = crypto.randomUUID()
      setHistory(history => addFolder(history, { id, name }))
      return id
    },
    renameFolder: (id: string, name: string) => setHistory(history => renameFolder(history, id, name)),
    deleteFolder: (id: string) => setHistory(history => removeFolder(history, id)),
    moveChat: (id: string, folderId: string | null) => setHistory(history => moveConversation(history, id, folderId)),
    updateDraft: (draft: string) => update(chat.id, { draft }),
    stop: () => requests.current.get(chat.id)?.abort(),
    retry: () => { if (chat.messages.at(-1)?.role === 'user') void request(chat.id, chat.messages) },
  }
}
