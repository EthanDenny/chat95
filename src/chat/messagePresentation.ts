import { assistantReply } from './model'
import type { Message } from './model'

// Activity belongs to Chat95, even while its receipt is stored on an unfinished user turn.
export function presentMessages(messages: Message[], responseText?: string): { rows: Message[]; response: Message | undefined } {
  const last = messages.at(-1)
  const response = responseText && last?.role === 'user'
    ? { ...assistantReply(last, responseText), toolActivity: last.toolActivity } : undefined
  const rows = messages.flatMap(message => {
    if (message.role !== 'user' || !message.toolActivity?.length) return [message]
    const { toolActivity, ...user } = message
    return message === last && response ? [user] : [user, {
      id: `activity:${message.id}`, role: 'assistant' as const, text: '', toolActivity,
    }]
  })
  return { rows: response ? [...rows, response] : rows, response }
}
