import type { ComponentPropsWithRef } from 'react'
import { CaptionButton } from '../components/CaptionButton'
import { TitleBar, WindowFrame } from '../components/WindowChrome'
import { chromeControls } from './chromeLayout'
import { applications } from './model'
import type { AppWindow } from './model'

export function DesktopWindowChrome({ window: w, active, blocked, titleProps, onCaption }: {
  window: AppWindow; active: boolean; blocked: boolean; titleProps: ComponentPropsWithRef<'div'>; onCaption: (action: string) => void
}) {
  const inset = w.id === 'calculator' ? 3 : 4
  const title = w.id === 'browser' ? 'Microsoft Internet Explorer - Microsoft Internet Explorer' : applications[w.id].title
  return <>
    <WindowFrame className={`desktop-window-frame ${w.id === 'browser' ? 'desktop-browser-frame' : ''}`} aria-hidden="true" />
    <div className="desktop-title-background" aria-hidden="true" style={{ left: inset, top: inset, width: w.width - inset * 2, background: active ? '#000080' : '#808080' }} />
    <TitleBar {...titleProps} data-title="" title={title} icon={`/apps/${w.id}-small.png`} active={active} inert={blocked} tabIndex={blocked ? -1 : 0} role="group" aria-label={`Move ${applications[w.id].title}`}
      className={`desktop-title desktop-title-${w.id}`} style={{ position: 'absolute', left: inset, top: inset, width: w.width - inset - 59, paddingLeft: 20, zIndex: 2 }} />
    {chromeControls(w.id, w.width).filter(c => ['minimize', 'maximize', 'close'].includes(c.id)).map(c => <CaptionButton key={c.id}
      kind={c.id === 'maximize' && w.maximized ? 'restore' : c.id as 'minimize' | 'maximize' | 'close'} className={w.id === 'browser' ? 'w95-caption-browser' : ''}
      aria-label={c.id === 'maximize' && w.maximized ? `Restore ${applications[w.id].title}` : c.label} disabled={c.disabled || blocked}
      style={{ position: 'absolute', left: c.x, top: c.y, zIndex: 2 }} onClick={() => onCaption(c.id)} />)}
  </>
}
