import { useState } from 'react'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { TextInput } from '../components/TextInput'
import { Dropdown } from '../components/Dropdown'
import { folderNameError } from './folders'
import type { ConversationFolder } from './model'

export type FolderAction = { kind: 'create' } | { kind: 'rename'; folder: ConversationFolder } | { kind: 'delete'; folder: ConversationFolder } |
  { kind: 'move'; chatId: string; chatTitle: string; folderId?: string }

export function FolderDialog({ action, folders, onClose, onSave }: {
  action: FolderAction; folders: ConversationFolder[]; onClose: () => void; onSave: (value: string) => void
}) {
  const [name, setName] = useState(action.kind === 'rename' ? action.folder.name : '')
  const [destination, setDestination] = useState(action.kind === 'move' ? action.folderId ?? '' : '')
  const naming = action.kind === 'create' || action.kind === 'rename'
  const error = naming ? folderNameError(folders, name, action.kind === 'rename' ? action.folder.id : undefined) : undefined
  const title = { create: 'New Folder', rename: 'Rename Folder', delete: 'Delete Folder', move: 'Move Conversation' }[action.kind]
  const choices = [{ id: '', name: 'Conversations' }, ...folders]
  const submit = () => { if (!error) onSave(naming ? name.trim() : destination) }
  return <div className="chat-dialog-overlay">
    <Dialog title={title} width={290} height={190} onClose={onClose}
      actions={<><Button width={90} disabled={!!error} onClick={submit}>{action.kind === 'delete' ? 'Delete Folder' : action.kind === 'move' ? 'Move' : 'OK'}</Button><Button data-dialog-default={action.kind === 'delete' || undefined} onClick={onClose}>Cancel</Button></>}>
      <form className="chat-folder-form" onSubmit={event => { event.preventDefault(); submit() }}>
        {naming ? <>
          <label htmlFor="folder-name">Folder name:</label>
          <TextInput data-dialog-default id="folder-name" aria-label="Folder name" width={258} maxLength={40} value={name}
            onFocus={event => event.currentTarget.select()} onChange={event => setName(event.target.value)} aria-describedby="folder-name-error" />
          <p id="folder-name-error" role="status">{name && error ? error : 'Choose a name for this conversation folder.'}</p>
        </> : action.kind === 'move' ? <>
          <p className="chat-folder-subject">Move “{action.chatTitle}” to:</p>
          <Dropdown label="Destination folder" width={258} options={choices.map(folder => folder.name)} value={Math.max(0, choices.findIndex(folder => folder.id === destination))}
            onChange={index => setDestination(choices[index].id)} />
        </> : <>
          <p>Delete the folder “{action.folder.name}”?</p>
          <p>Its conversations will be moved to Conversations. No conversations will be deleted.</p>
        </>}
      </form>
    </Dialog>
  </div>
}
