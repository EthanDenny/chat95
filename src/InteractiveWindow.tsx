import { useRef, useState } from 'react'
import { Demo, Toggle } from './InteractiveDemo'
import { PixelScale } from './components/PixelScale'
import { CaptionButton } from './components/CaptionButton'
import { TaskbarButton } from './components/TaskbarButton'
import { TitleBar, WindowFrame } from './components/WindowChrome'
import { captionRects } from './theme'

export function WindowDemo({ scale }: { scale: number }) {
  const [inactive, setInactive] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [withIcon, setWithIcon] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 16 })
  const [open, setOpen] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [menu, setMenu] = useState(false)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const r = maximized ? { x: 0, y: 0, width: 400, height: 204 } : { ...position, width: 264, height: 150 }
  const visible = open && !minimized
  const restore = () => { setOpen(true); setMinimized(false); setMenu(false) }
  const captions = captionRects({ x: 0, y: 0, width: r.width, height: r.height })
  return <Demo title="Window and taskbar" controls={<><Toggle title="Window" label="Inactive" value={inactive} onChange={setInactive} /><Toggle title="Window" label="Disable caption buttons" value={disabled} onChange={setDisabled} /><Toggle title="Window" label="Title icon" value={withIcon} onChange={setWithIcon} /><button onClick={() => { restore(); setMaximized(false); setPosition({ x: 20, y: 16 }) }}>Reset window</button><span aria-live="polite">{!open ? 'Closed' : minimized ? 'Minimized' : maximized ? 'Maximized' : 'Drag the title bar'}</span></>}>
    <PixelScale scale={scale} width={400} height={234}>
      <div className="w95-native-text" style={{ position: 'relative', width: 400, height: 234, background: '#fff' }}>
        {visible && <WindowFrame style={{ position: 'absolute', left: r.x, top: r.y, width: r.width, height: r.height }}>
          <div aria-hidden="true" style={{ position: 'absolute', left: 3, top: 3, width: r.width - 6, height: 18, background: inactive ? '#808080' : '#000080' }} />
          <TitleBar title="My Computer" icon={withIcon ? '/icons/0-16.png' : undefined} active={!inactive} role="group" aria-label="Move window" tabIndex={0} style={{ position: 'absolute', left: 3, top: 3, width: r.width - 62 }} onDoubleClick={() => setMaximized(!maximized)}
            onPointerDown={event => { if (maximized || event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, left: r.x, top: r.y } }}
            onPointerMove={event => { if (drag.current) setPosition({ x: Math.max(0, Math.min(136, Math.round(drag.current.left + (event.clientX - drag.current.x) / scale))), y: Math.max(0, Math.min(54, Math.round(drag.current.top + (event.clientY - drag.current.y) / scale))) }) }}
            onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}
            onKeyDown={event => { if (!maximized && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); setPosition(value => ({ x: Math.max(0, Math.min(136, value.x + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0))), y: Math.max(0, Math.min(54, value.y + (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0))) })) } }} />
          {(['minimize', 'maximize', 'close'] as const).map(kind => <CaptionButton key={kind} kind={kind === 'maximize' && maximized ? 'restore' : kind} aria-label={kind === 'maximize' && maximized ? 'Restore window' : `${kind[0].toUpperCase()}${kind.slice(1)} window`} disabled={disabled} style={{ position: 'absolute', left: captions[kind].x, top: captions[kind].y }} onClick={() => kind === 'close' ? setOpen(false) : kind === 'minimize' ? setMinimized(true) : setMaximized(!maximized)} />)}
          <span style={{ position: 'absolute', left: 12, top: 35 }}>Drag the title bar to move this window.</span>
          <div className="w95-status-field" style={{ position: 'absolute', left: 4, bottom: 4, width: r.width - 8, height: 18 }}>Ready</div>
        </WindowFrame>}
        <div style={{ position: 'absolute', left: 0, top: 204, width: 400, height: 30, background: '#c0c0c0', borderTop: '1px solid #fff' }}>
          <TaskbarButton start icon="/icons/start-flag.png" selected={menu} aria-label="Start menu" aria-expanded={menu} style={{ position: 'absolute', left: 2, top: 3 }} onClick={() => setMenu(!menu)}>Start</TaskbarButton>
          {open && <TaskbarButton icon="/icons/0-16.png" selected={!minimized} aria-label="My Computer task" style={{ position: 'absolute', left: 60, top: 3, width: 150, height: 23 }} onClick={() => setMinimized(!minimized)}>My Computer</TaskbarButton>}
          <div className="w95-status-field" style={{ position: 'absolute', left: 320, top: 3, width: 76, height: 23, padding: '5px 12px' }}>12:00 PM</div>
        </div>
        {menu && <WindowFrame className="w95-demo-start-menu" style={{ position: 'absolute', left: 2, top: 155, width: 144, height: 49 }}>{['Open window', 'Close window'].map((label, index) => <button key={label} aria-label={`${label} from Start`} onClick={() => { if (index === 0) restore(); else { setOpen(false); setMenu(false) } }}>{label}</button>)}</WindowFrame>}
      </div>
    </PixelScale>
  </Demo>
}
