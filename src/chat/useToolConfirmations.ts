import { useState } from 'react'
import type { ToolConfirmation } from './localTools'

export type PendingToolApproval = ToolConfirmation & { id: string; conversation: string; respond: (approved: boolean) => void }
export function useToolConfirmations() {
  const [approvals, setApprovals] = useState<PendingToolApproval[]>([])
  function confirm(confirmation: ToolConfirmation, conversation: string, signal: AbortSignal): Promise<boolean> {
    signal.throwIfAborted()
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID()
      const cleanup = () => {
        signal.removeEventListener('abort', abort)
        setApprovals(items => items.filter(item => item.id !== id))
      }
      const abort = () => { cleanup(); reject(signal.reason) }
      signal.addEventListener('abort', abort, { once: true })
      setApprovals(items => [...items, { ...confirmation, conversation, id, respond: approved => { cleanup(); resolve(approved) } }])
    })
  }
  return { approval: approvals[0], confirm }
}
