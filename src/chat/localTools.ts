import { record } from './toolProtocol'
import type { ToolCall } from './toolProtocol'
import { addFolder, folderNameError, moveConversation, removeFolder, renameFolder } from './folders'
import type { ChatHistory } from './model'

export type ToolResult = { ok: boolean; summary: string; [key: string]: unknown }
export type ToolConfirmation = { title: string; description: string }
type ToolContext = {
  currentChatId: string; signal: AbortSignal; getHistory: () => ChatHistory
  commit: (history: ChatHistory) => boolean
  confirm: (confirmation: ToolConfirmation) => Promise<boolean>
}
const fail = (summary: string): ToolResult => ({ ok: false, summary })
const id = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 200
const pageOffset = (value: unknown) => value === undefined || Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100000
const only = (args: Record<string, unknown>, keys: string[]) => Object.keys(args).every(key => keys.includes(key))

function search(history: ChatHistory, args: Record<string, unknown>): ToolResult {
  if (!only(args, ['query', 'folder_id', 'offset', 'limit']) || typeof args.query !== 'string' || args.query.length > 200 || !pageOffset(args.offset) ||
    args.limit !== undefined && (!Number.isInteger(args.limit) || Number(args.limit) < 1 || Number(args.limit) > 10) ||
    args.folder_id !== undefined && args.folder_id !== null && !id(args.folder_id)) return fail('Invalid search arguments.')
  if (typeof args.folder_id === 'string' && !history.folders.some(folder => folder.id === args.folder_id)) return fail('Folder not found.')
  const query = args.query.trim().toLowerCase(), offset = Number(args.offset ?? 0), limit = Number(args.limit ?? 5)
  const matches = history.conversations.filter(chat => {
    if (args.folder_id !== undefined && (chat.folderId ?? null) !== args.folder_id) return false
    return !query || chat.title.toLowerCase().includes(query) || chat.messages.some(message => message.text.toLowerCase().includes(query))
  })
  const results = matches.slice(offset, offset + limit).map(chat => {
    const message = query ? chat.messages.find(message => message.text.toLowerCase().includes(query)) : undefined
    const start = message ? Math.max(0, message.text.toLowerCase().indexOf(query) - 80) : 0
    return { id: chat.id, title: chat.title.slice(0, 200), folder_id: chat.folderId ?? null,
      folder_name: history.folders.find(folder => folder.id === chat.folderId)?.name ?? null,
      ...(message ? { excerpt: message.text.slice(start, start + 400), role: message.role } : {}) }
  })
  return { ok: true, summary: `Found ${matches.length} matching conversation${matches.length === 1 ? '' : 's'}.`, results,
    total: matches.length, next_offset: offset + limit < matches.length ? offset + limit : null }
}

type FolderPlan = ToolConfirmation & { apply: (history: ChatHistory) => ChatHistory; result: ToolResult }
const isPlan = (value: FolderPlan | ToolResult): value is FolderPlan => typeof value.apply === 'function'
function planFolderChange(history: ChatHistory, args: Record<string, unknown>, currentChatId: string, newId: string): FolderPlan | ToolResult {
  const action = args.action
  const allowed: Record<string, string[]> = { create: ['action', 'name'], rename: ['action', 'folder_id', 'name'],
    delete: ['action', 'folder_id'], move: ['action', 'folder_id', 'conversation_id'] }
  if (typeof action !== 'string' || !Object.hasOwn(allowed, action) || !only(args, allowed[action])) return fail('Invalid folder action or arguments.')
  const folder = history.folders.find(folder => folder.id === args.folder_id)
  if (action === 'rename' || action === 'delete' || action === 'move') {
    if (!(action === 'move' && args.folder_id === null) && (!id(args.folder_id) || !folder)) return fail('Folder not found. List folders to get its exact ID.')
  }
  if (action === 'create' || action === 'rename') {
    if (typeof args.name !== 'string') return fail('A folder name is required.')
    const error = folderNameError(history.folders, args.name, action === 'rename' ? folder!.id : undefined)
    if (error) return fail(error)
    const name = args.name.trim()
    return { title: action === 'create' ? 'Create Folder' : 'Rename Folder',
      description: action === 'create' ? `Create the folder “${name}”?` : `Rename “${folder!.name}” to “${name}”?`,
      apply: latest => action === 'create' ? addFolder(latest, { id: newId, name }) : renameFolder(latest, folder!.id, name),
      result: { ok: true, summary: action === 'create' ? `Created folder “${name}”.` : `Renamed folder “${folder!.name}” to “${name}”.`, folder_id: action === 'create' ? newId : folder!.id, name } }
  }
  if (action === 'delete') return { title: 'Delete Folder', description: `Delete “${folder!.name}”? Its conversations will be kept in Conversations.`,
    apply: latest => removeFolder(latest, folder!.id), result: { ok: true, summary: `Deleted folder “${folder!.name}” and kept its conversations.` } }
  if (!id(args.conversation_id)) return fail('A conversation ID is required.')
  const chatId = args.conversation_id === 'current' ? currentChatId : args.conversation_id
  const chat = history.conversations.find(chat => chat.id === chatId)
  if (!chat) return fail('Conversation not found. Search conversations to get its exact ID.')
  const destination = folder?.name ?? 'Conversations', folderId = folder?.id ?? null
  if ((chat.folderId ?? null) === folderId) return { ok: true, summary: `“${chat.title}” is already in ${destination}.`, conversation_id: chat.id, folder_id: folderId }
  return { title: 'Move Conversation', description: `Move “${chat.title}” from “${history.folders.find(folder => folder.id === chat.folderId)?.name ?? 'Conversations'}” to “${destination}”?`,
    apply: latest => moveConversation(latest, chat.id, folderId), result: { ok: true, summary: `Moved “${chat.title}” to “${destination}”.`, conversation_id: chat.id, folder_id: folderId } }
}

export async function executeLocalTool(call: ToolCall, context: ToolContext): Promise<ToolResult> {
  context.signal.throwIfAborted()
  let args: Record<string, unknown>
  try {
    const parsed = JSON.parse(call.function.arguments)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fail('Tool arguments must be an object.')
    args = record(parsed)
  } catch { return fail('Tool arguments must be valid JSON.') }
  const history = context.getHistory()
  if (call.function.name === 'search_conversations') return search(history, args)
  if (call.function.name !== 'manage_folders') return fail('Unknown tool.')
  if (args.action === 'list') {
    if (!only(args, ['action', 'offset']) || !pageOffset(args.offset)) return fail('Invalid folder list arguments.')
    const offset = Number(args.offset ?? 0)
    return { ok: true, summary: `${history.folders.length} folders.`, folders: history.folders.slice(offset, offset + 50).map(folder => ({ ...folder,
      conversation_count: history.conversations.filter(chat => chat.folderId === folder.id).length })),
    next_offset: offset + 50 < history.folders.length ? offset + 50 : null }
  }
  const newId = crypto.randomUUID()
  const plan = planFolderChange(history, args, context.currentChatId, newId)
  if (!isPlan(plan)) return plan
  const approved = await context.confirm({ title: plan.title, description: plan.description })
  context.signal.throwIfAborted()
  if (!approved) return fail('The user cancelled this change. Nothing was changed.')
  // Revalidate after the dialog: another conversation or manual action may have changed the target.
  const latest = context.getHistory(), checked = planFolderChange(latest, args, context.currentChatId, newId)
  if (!isPlan(checked) || checked.description !== plan.description) return fail('The target changed while awaiting approval. Nothing was changed; check the current folders and try again.')
  const persisted = context.commit(checked.apply(latest))
  return { ...checked.result, persisted, ...(!persisted ? { warning: 'Changed for this session only. Browser storage failed; tell the user.' } : {}) }
}
