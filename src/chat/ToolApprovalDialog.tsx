import { Button, Dialog, Icon } from '@ethandenny/win95-ui'
import type { PendingToolApproval } from './useToolConfirmations'

export function ToolApprovalDialog({ approval }: { approval: PendingToolApproval }) {
  const action = { 'Create Folder': 'Create', 'Rename Folder': 'Rename', 'Move Conversation': 'Move', 'Delete Folder': 'Delete' }[approval.title] ?? 'OK'
  return <div className="chat-dialog-overlay">
    <Dialog title={`Chat95 - ${approval.title}`} width={300} height={190} onClose={() => approval.respond(false)}
      actions={<><Button width={80} onClick={() => approval.respond(true)}>{action}</Button><Button data-dialog-default onClick={() => approval.respond(false)}>Cancel</Button></>}>
      <div className="chat-tool-approval"><Icon name="Folder" size={32} /><div>
        <p>{approval.description}</p>
        <p className="chat-tool-source" title={approval.conversation}>Conversation: {approval.conversation}</p>
      </div></div>
    </Dialog>
  </div>
}
