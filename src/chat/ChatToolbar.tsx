import { Icon, Toolbar } from '@ethandenny/win95-ui'

export function ChatToolbar({ onNew, onSave, onDelete, onFind, onStop, canSave, canDelete = true, pending }: {
  onNew: () => void; onSave: () => void; onDelete: () => void; onFind: () => void; onStop: () => void
  canSave: boolean; canDelete?: boolean; pending?: boolean
}) {
  return <Toolbar aria-label="Conversation tools" className="chat-toolbar" style={{ height: 28 }}>
    <button type="button" title="New conversation" onClick={onNew}><Icon name="Windows document" />New</button>
    <button type="button" title="Save conversation as text" onClick={onSave} disabled={!canSave}><Icon name="Floppy drive" />Save</button>
    <span className="chat-tool-separator" aria-hidden="true" />
    <button type="button" title="Delete selected item" onClick={onDelete} disabled={!canDelete}><Icon name="Recycle Bin empty" />Delete</button>
    <button type="button" title="Find conversations" onClick={onFind}><Icon name="Find document" />Find</button>
    <span className="chat-tool-separator" aria-hidden="true" />
    <button type="button" title="Stop response" onClick={onStop} disabled={!pending}><span className="chat-stop-icon" aria-hidden="true" />Stop</button>
  </Toolbar>
}
