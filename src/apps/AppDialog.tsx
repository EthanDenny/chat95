import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { Button } from '../components/Button'
import { TitleBar, WindowFrame } from '../components/WindowChrome'
import { dialogRect, desktopColors } from './appCommands'
import { panelNames } from './model'
import type { AppId, AppWindow, DesktopApps } from './model'

export function AppDialog({ window: w, apps, activate, returnFocus }: { window: AppWindow; apps: DesktopApps; activate: (action: string) => void; returnFocus: RefObject<Partial<Record<AppId, HTMLElement>>> }) {
  const dialog = useRef<HTMLDivElement>(null)
  const r = dialogRect(w)
  const notice = apps.notice?.app === w.id ? apps.notice : null
  const index = apps.applet
  const title = notice?.title ?? `${panelNames[index!]} Properties`
  useEffect(() => {
    const previous = returnFocus.current[w.id]
    const fallback = dialog.current?.closest('section')?.querySelector<HTMLElement>('[data-title]')
    dialog.current?.querySelector<HTMLButtonElement>('[data-ok]')?.focus()
    return () => { queueMicrotask(() => { (previous?.isConnected ? previous : fallback)?.focus() }) }
  }, [returnFocus, w.id])
  const lines = notice?.lines ?? (index === 4 ? ['Background', 'Choose a color for your desktop.', 'Changes apply immediately.'] : index === 18 ? ['Microsoft Windows 95', '4.00.950', 'React desktop recreation · 640 x 480', 'Runs locally in your web browser.'] : index === 3 ? ['Date and time', new Date().toLocaleString(), 'The taskbar follows your system clock.', 'Change your clock in your computer settings.'] : [panelNames[index!], 'This applet is an informational preview.', 'Hardware and operating-system settings', 'are managed by your computer.'])
  return <WindowFrame ref={dialog} role="dialog" aria-modal="true" aria-label={title} className="w95-native-text" style={{ position: 'absolute', left: r.x, top: r.y, width: r.width, height: r.height, zIndex: 20 }}
    onKeyDown={event => {
      if (event.key === 'Escape' || event.altKey && event.key === 'F4') { event.preventDefault(); event.stopPropagation(); activate('dialog-close') }
      if (event.key === 'Tab') {
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
        event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
      }
    }}>
    <TitleBar title={title} style={{ position: 'absolute', left: 3, top: 3, width: r.width - 6 }} />
    {lines.map((line, i) => <span key={i} style={{ position: 'absolute', left: 18, top: 35 + i * 21, whiteSpace: 'nowrap' }}>{line}</span>)}
    {index === 4 && !notice && desktopColors.map((color, i) => <button key={color} type="button" className="w95-color-swatch w95-button" data-state={apps.background === color ? 'pressed' : 'normal'} aria-pressed={apps.background === color} aria-label={`Desktop color ${['Teal', 'Green', 'Blue', 'Purple', 'Black', 'Gray'][i]}`} style={{ position: 'absolute', left: 18 + i * 48, top: 108, width: 40, height: 30 }} onClick={() => activate(`color:${color}`)}><span className="w95-button-frame" /><span style={{ position: 'absolute', inset: 4, background: color }} /></button>)}
    <Button data-ok="" defaultButton style={{ position: 'absolute', right: 12, bottom: 13 }} onClick={() => activate('dialog-close')}>OK</Button>
  </WindowFrame>
}
