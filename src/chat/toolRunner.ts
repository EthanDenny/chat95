import { MAX_TOOL_ROUNDS, parseToolCalls } from './toolProtocol'
import type { ToolCall, WireMessage } from './toolProtocol'
import type { ToolResult } from './localTools'

export type ToolRun = { messages: WireMessage[]; activity: string[] }
export async function runChatTurn(run: ToolRun, options: {
  signal: AbortSignal; fetch?: typeof fetch; execute: (call: ToolCall) => Promise<ToolResult>
  onActivity: (status: string, activity: string[]) => void
}): Promise<string> {
  const { signal } = options
  for (;;) {
    signal.throwIfAborted()
    // Resume unresolved calls before requesting another response. Completed results survive Retry.
    const lastCall = run.messages.findLastIndex(message => message.role === 'assistant' && !!message.tool_calls)
    const assistant = run.messages[lastCall]
    if (assistant?.role === 'assistant' && assistant.tool_calls) {
      const completed = new Set(run.messages.slice(lastCall + 1).flatMap(message => message.role === 'tool' ? [message.tool_call_id] : []))
      for (const call of assistant.tool_calls) {
        if (completed.has(call.id)) continue
        signal.throwIfAborted()
        options.onActivity(call.function.name === 'search_conversations' ? 'Searching conversations...' : 'Organizing folders...', run.activity)
        const result = await options.execute(call)
        // Record an applied action even if Stop arrives immediately afterward; never replay it on Retry.
        const content = JSON.stringify(result)
        run.messages.push({ role: 'tool', tool_call_id: call.id, content: content.length <= 16000 ? content : JSON.stringify({
          ok: result.ok, summary: result.summary.slice(0, 1000), warning: 'Result details omitted because they were too large. Use a smaller result limit.',
        }) })
        run.activity.push(result.summary.slice(0, 1000) + (result.persisted === false ? ' Not saved to disk.' : ''))
        options.onActivity('Thinking...', run.activity)
      }
    }
    signal.throwIfAborted()
    const localNow = new Date()
    const response = await (options.fetch ?? fetch)('/api/chat', {
      method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: run.messages, toolsEnabled: true,
        localDate: { month: localNow.getMonth() + 1, day: localNow.getDate() } }),
    })
    const result = await response.json()
    signal.throwIfAborted()
    if (!response.ok) throw new Error(result.error || 'The response failed. Please retry.')
    if (result.toolCalls !== undefined) {
      const toolCalls = parseToolCalls(result.toolCalls)
      const rounds = run.messages.filter(message => message.role === 'assistant' && message.tool_calls).length
      const existing = new Set(run.messages.flatMap(message => message.role === 'assistant' ? message.tool_calls?.map(call => call.id) ?? [] : []))
      if (!toolCalls || toolCalls.some(call => existing.has(call.id))) throw new Error('Invalid tool request. Please retry.')
      if (rounds >= MAX_TOOL_ROUNDS) throw new Error('The tool step limit was reached. Completed changes are kept; ask me to continue in a new message.')
      run.messages.push({ role: 'assistant', content: typeof result.text === 'string' ? result.text : null, tool_calls: toolCalls })
    } else {
      if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('No reply received. Please retry.')
      return result.text
    }
  }
}
