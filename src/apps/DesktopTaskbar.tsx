import { useEffect, useRef } from 'react'
import { TaskbarButton } from '../components/TaskbarButton'
import { WindowFrame } from '../components/WindowChrome'
import { kitIconNames } from '../icons'
import { appIds, applications } from './model'
import type { AppId } from './model'
import type { DesktopState } from './desktopState'

function iconPath(id: AppId, size: 16 | 32) {
  return id === 'calculator' ? '/apps/calculator-small.png' : `/icons/${kitIconNames.indexOf(applications[id].icon as typeof kitIconNames[number])}-${size}.png`
}
export function DesktopTaskbar({ state, activate, open }: { state: DesktopState; activate: (app: AppId | null, action: string) => Promise<void>; open: (app: AppId) => void }) {
  const start = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const keyboardOpen = useRef(false)
  const active = state.windows.findLast(w => !w.minimized)?.id
  const taskIds = appIds.filter(id => state.windows.some(w => w.id === id))
  useEffect(() => {
    if (state.startOpen) (keyboardOpen.current ? menu.current?.querySelector('button') : menu.current)?.focus()
  }, [state.startOpen])
  const dismiss = () => { void activate(null, 'start'); start.current?.focus() }
  return <>
    <div className="desktop-taskbar-layer w95-desktop-taskbar" style={{ left: 0, top: 450, width: 640, height: 30 }}>
      <TaskbarButton ref={start} start icon="/icons/start-flag.png" selected={state.startOpen} data-start-control="" aria-label="Start" aria-expanded={state.startOpen} aria-haspopup="menu"
        style={{ position: 'absolute', left: 2, top: 4 }} onClick={event => { keyboardOpen.current = event.detail === 0; void activate(null, 'start') }}>Start</TaskbarButton>
      <span className="w95-taskbar-separator" aria-hidden="true" />
      {taskIds.map((id, i) => <TaskbarButton key={id} icon={iconPath(id, 16)} selected={active === id} style={{ position: 'absolute', left: 64 + i * 157, top: 4 }} aria-label={`Task: ${applications[id].title}`} onClick={() => void activate(null, `task:${id}`)}>{applications[id].title}</TaskbarButton>)}
      <div className="w95-status-field w95-native-text w95-taskbar-clock" aria-label="Clock">{state.clock}</div>
    </div>
    {state.startOpen && <WindowFrame ref={menu} className="desktop-start-layer w95-start-menu w95-native-text" role="menu" tabIndex={-1} aria-label="Start menu" data-start-control="" style={{ left: 2, top: 285, width: 199, height: 165 }}
      onKeyDown={event => {
        const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
        const index = items.indexOf(document.activeElement as HTMLButtonElement)
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index < 0 ? (event.key === 'ArrowUp' ? items.length - 1 : 0) : (index + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length; items[next]?.focus()
        }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss() }
        if (event.key === 'Tab') dismiss()
      }}>
      <span className="w95-start-rail" aria-hidden="true">95</span>
      {appIds.map((id, i) => <button key={id} type="button" role="menuitem" className="w95-start-item" style={{ top: 7 + i * 37 }} onClick={() => open(id)}>
        <img src={iconPath(id, 32)} width={32} height={32} alt="" draggable={false} /><span>{applications[id].title}</span>
      </button>)}
      <span className="w95-start-separator" aria-hidden="true" />
      <button type="button" role="menuitem" className="w95-start-item w95-show-desktop" style={{ top: 130 }} onClick={() => { void activate(null, 'show-desktop'); start.current?.focus() }}>Show Desktop</button>
    </WindowFrame>}
  </>
}
