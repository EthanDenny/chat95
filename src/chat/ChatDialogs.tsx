import { Button, Dialog, Icon } from '@ethandenny/win95-ui'

export type DeleteTarget = { id: string; title: string }

export function BrowserErrorDialog({ error, onClose }: { error: string; onClose: () => void }) {
  return (
    <div className="chat-dialog-overlay">
      <Dialog
        title="Browser window"
        width={280}
        height={145}
        onClose={onClose}
        actions={
          <Button data-dialog-default onClick={onClose}>
            OK
          </Button>
        }
      >
        <p className="chat-browser-notice">{error}</p>
      </Dialog>
    </div>
  )
}

export function DeleteConversationDialog({
  target,
  onDelete,
  onClose,
}: {
  target: DeleteTarget
  onDelete: () => void
  onClose: () => void
}) {
  return (
    <div className="chat-dialog-overlay">
      <Dialog
        title="Delete Conversation"
        width={290}
        height={184}
        onClose={onClose}
        actions={
          <>
            <Button onClick={onDelete}>Delete</Button>
            <Button data-dialog-default onClick={onClose}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="chat-delete-notice">
          <Icon name="Recycle Bin full" size={32} />
          <div>
            <p>Delete “{target.title}”?</p>
            <p>This removes the conversation from this browser. This cannot be undone.</p>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export function AboutChat95Dialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="chat-dialog-overlay">
      <Dialog
        title="About Chat95"
        width={280}
        height={178}
        onClose={onClose}
        actions={
          <Button data-dialog-default onClick={onClose}>
            OK
          </Button>
        }
      >
        <div className="chat-about">
          <Icon name="My Computer" size={32} />
          <div>
            <strong>Chat95</strong>
            <p>Version 1.0</p>
            <p>A conversational desktop companion.</p>
            <hr />
            <p>Conversations are stored on this computer.</p>
            <p>Response service: OpenRouter</p>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
