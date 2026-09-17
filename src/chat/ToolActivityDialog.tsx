import { useState } from 'react'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { ListView } from '../components/ListView'
import { TextArea } from '../components/TextArea'

export function ToolActivityDialog({ entries, width, height, onClose, restoreFocus }: {
  entries: string[]; width: number; height: number; onClose: () => void; restoreFocus: () => HTMLElement | null
}) {
  const [selected, setSelected] = useState(0)
  const [listFocused, setListFocused] = useState(false)
  return <div className="chat-dialog-overlay">
    <Dialog title="Chat95 - Operation Details" width={width} height={height} onClose={onClose} restoreFocus={restoreFocus}
      actions={<Button data-dialog-default width={75} onClick={onClose}>Close</Button>}>
      <div className="chat-operations-heading"><Icon name="Documents" size={32} /><div>
        <p>Recorded operations</p><p>{entries.length} operation{entries.length === 1 ? '' : 's'} in this reply.</p>
      </div></div>
      <div className="chat-operations-list" onFocusCapture={() => setListFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setListFocused(false) }}>
        <ListView label="Recorded operations" items={entries.map(label => ({ label, icon: 'Windows document' }))}
          active={listFocused} selected={selected} onSelect={setSelected} width={width - 24} height={height - 178} />
      </div>
      <div className="chat-operation-description" style={{ top: height - 100 }}>
        <TextArea aria-label="Selected operation details" readOnly value={entries[selected] ?? ''} width={width - 24} height={48} />
      </div>
    </Dialog>
  </div>
}
