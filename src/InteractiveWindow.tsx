import { hitStyle } from './hitStyle'
import { useRef, useState } from 'react'
import { BitmapButton, Demo, Surface, Toggle } from './InteractiveDemo'
import { captionRects, metrics, palette } from './win95'

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
  const captions = captionRects(r)
  return <Demo title="Window and taskbar" controls={<><Toggle title="Window" label="Inactive" value={inactive} onChange={setInactive} /><Toggle title="Window" label="Disable caption buttons" value={disabled} onChange={setDisabled} /><Toggle title="Window" label="Title icon" value={withIcon} onChange={setWithIcon} /><button onClick={() => { restore(); setMaximized(false); setPosition({ x: 20, y: 16 }) }}>Reset window</button><span aria-live="polite">{!open ? 'Closed' : minimized ? 'Minimized' : maximized ? 'Maximized' : 'Drag the title bar'}</span></>}>
    <Surface title="Window playground" width={400} height={234} scale={scale} draw={p => {
      p.fill(0, 0, 400, 204, palette.white)
      if (visible) {
        p.windowFrame(r); p.titleBar(r, withIcon ? '    My Computer' : 'My Computer', !inactive)
        if (withIcon) p.icon('My Computer', r.x + 6, r.y + 4, 16)
        p.text('Drag the title bar to move this window.', r.x + 12, r.y + 35)
        p.recess({ x: r.x + 4, y: r.y + r.height - 22, width: r.width - 8, height: 18 })
        p.text('Ready', r.x + 7, r.y + r.height - 20)
      }
      p.fill(0, 204, 400, 30, palette.silver); p.fill(0, 204, 400, 1, palette.white)
      p.recess({ x: 320, y: 208, width: 76, height: 23 }); p.text('12:00 PM', 332, 213)
      if (menu) { p.bevel({ x: 2, y: 155, width: 144, height: 49 }); p.text('Open window', 12, 162); p.text('Close window', 12, 183) }
    }}>
      {visible && <>
        <div className="window-drag-handle demo-overlay" role="button" aria-label="Move window" tabIndex={0} style={hitStyle(r.x + 3, r.y + 3, r.width - 62, 18, scale)} onDoubleClick={() => setMaximized(!maximized)}
          onPointerDown={event => { if (maximized || event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, left: r.x, top: r.y } }}
          onPointerMove={event => { if (drag.current) setPosition({ x: Math.max(0, Math.min(136, Math.round(drag.current.left + (event.clientX - drag.current.x) / scale))), y: Math.max(0, Math.min(54, Math.round(drag.current.top + (event.clientY - drag.current.y) / scale))) }) }}
          onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}
          onKeyDown={event => { if (!maximized && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); setPosition(value => ({ x: Math.max(0, Math.min(136, value.x + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0))), y: Math.max(0, Math.min(54, value.y + (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0))) })) } }} />
        {(['minimize', 'maximize', 'close'] as const).map(kind => <div key={kind} className="demo-overlay" style={hitStyle(captions[kind].x, captions[kind].y, 16, 14, scale)}><BitmapButton label={kind === 'maximize' && maximized ? 'Restore window' : `${kind[0].toUpperCase()}${kind.slice(1)} window`} width={16} height={14} scale={scale} disabled={disabled} onClick={() => kind === 'close' ? setOpen(false) : kind === 'minimize' ? setMinimized(true) : setMaximized(!maximized)} draw={(p, pressed) => p.captionButton({ x: 0, y: 0, width: 16, height: 14 }, kind === 'maximize' && maximized ? 'restore' : kind, pressed, disabled)} /></div>)}
      </>}
      <div className="demo-overlay" style={hitStyle(2, 208, metrics.startWidth, metrics.startHeight, scale)}><BitmapButton label="Start menu" width={metrics.startWidth} height={metrics.startHeight} scale={scale} onClick={() => setMenu(!menu)} draw={(p, pressed, focused) => p.startButton(0, 0, pressed || menu, focused)} /></div>
      {open && <div className="demo-overlay" style={hitStyle(60, 208, 150, 23, scale)}><BitmapButton label="My Computer task" width={150} height={23} scale={scale} onClick={() => setMinimized(!minimized)} draw={(p, pressed) => { p.taskButton({ x: 0, y: 0, width: 150, height: 23 }, !minimized, pressed); p.icon('My Computer', 4, 3, 16); p.text('My Computer', 24, 5, 8, palette.black, !minimized) }} /></div>}
      {menu && <>{['Open window', 'Close window'].map((label, index) => <button key={label} className="bitmap-hit" aria-label={`${label} from Start`} style={hitStyle(4, 157 + index * 21, 140, 21, scale)} onClick={() => { if (index === 0) restore(); else { setOpen(false); setMenu(false) } }} />)}</>}
    </Surface>
  </Demo>
}
