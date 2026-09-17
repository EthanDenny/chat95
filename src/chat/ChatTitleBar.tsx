import { CaptionButton, TitleBar, iconUrl } from '@ethandenny/win95-ui'

type Props = {
  title: string
  fullscreen: boolean
  fullscreenEnabled: boolean
  onToggleFullscreen: () => void
  onClose: () => void
}

export function ChatTitleBar({
  title,
  fullscreen,
  fullscreenEnabled,
  onToggleFullscreen,
  onClose,
}: Props) {
  const fullscreenLabel = fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
  const fullscreenTitle = fullscreenEnabled
    ? fullscreen
      ? 'Exit fullscreen'
      : 'Enter browser fullscreen'
    : 'This browser does not support webpage fullscreen.'

  return (
    <>
      <TitleBar title={title} icon={iconUrl('My Computer')} className="chat-titlebar" />
      <div className="chat-window-controls" role="group" aria-label="Chat95 window controls">
        <CaptionButton
          kind="minimize"
          aria-label="Minimize browser window (unavailable)"
          title="Webpages cannot minimize the browser window. Use the browser’s minimize control."
          data-window-control="minimize"
          disabled
        />
        <CaptionButton
          kind={fullscreen ? 'restore' : 'maximize'}
          aria-label={fullscreenLabel}
          title={fullscreenTitle}
          data-window-control="maximize"
          disabled={!fullscreenEnabled && !fullscreen}
          onClick={onToggleFullscreen}
        />
        <CaptionButton
          kind="close"
          aria-label="Close Chat95 tab"
          data-window-control="close"
          onClick={onClose}
        />
      </div>
    </>
  )
}
