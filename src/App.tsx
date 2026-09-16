import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, fitDisplay, toDesktopPoint } from './display'
import { iconsReady } from './kitIcons'
import { useWin95Cursors } from './useWin95Cursors'
import { appAssetsReady } from './apps/assets'
import { drawDesktop } from './apps/desktop'
import { useDesktop } from './apps/useDesktop'
import { scrollbarGeometry } from './collectionControls'
import { appControls } from './apps/render'
import { calculatorKey } from './apps/calculator'
import { applications, appIds } from './apps/model'
import type { AppId, AppWindow } from './apps/model'
import { WindowResizeHandles } from './apps/WindowResizeHandles'
import { panelLayout } from './apps/panelLayout'
import type { Rect } from './win95'
import './App.css'
const getDisplay = () => fitDisplay(window.innerWidth, window.innerHeight, window.devicePixelRatio)
const bounds = (w: AppWindow, x: number, y: number) => ({ x: Math.max(0, Math.min(Math.round(x), 640 - w.width)), y: Math.max(0, Math.min(Math.round(y), 450 - w.height)) })
function App() {
  const { state, setState, focus, open, activate, getClock } = useDesktop()
  const [tracking, setTracking] = useState<Rect | null>(null)
  const [display, setDisplay] = useState(getDisplay)
  const canvas = useRef<HTMLCanvasElement>(null)
  const addressInput = useRef<HTMLInputElement>(null)
  const scrollDrag = useRef<{ pointer: number; y: number; value: number; travel: number; maximum: number } | null>(null)
  const drag = useRef<{ id: AppId; pointer: number; dx: number; dy: number; window: AppWindow; bounds: Rect } | null>(null)
  useWin95Cursors(display.scale)
  useLayoutEffect(() => {
    const ctx = canvas.current!.getContext('2d', { alpha: false })!
    drawDesktop(ctx, state, tracking)
    let mounted = true
    Promise.all([iconsReady, appAssetsReady]).then(() => { if (mounted) drawDesktop(ctx, state, tracking) }).catch(console.error)
    return () => { mounted = false }
  }, [state, tracking])
  useEffect(() => {
    const timer = window.setInterval(() => setState(s => { const clock = getClock(); return clock === s.clock ? s : { ...s, clock } }), 1000)
    const resize = () => setDisplay(getDisplay())
    let density: MediaQueryList
    const watch = () => { density?.removeEventListener('change', watch); resize(); density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`); density.addEventListener('change', watch) }
    watch(); window.addEventListener('resize', resize)
    return () => { clearInterval(timer); window.removeEventListener('resize', resize); density.removeEventListener('change', watch) }
  }, [setState, getClock])
  const pressed = (app: AppId | null, id: string) => setState(s => ({ ...s, pressed: { app, id } }))
  const release = () => setState(s => s.pressed ? { ...s, pressed: null } : s)
  const point = (event: PointerEvent) => toDesktopPoint({ x: event.clientX, y: event.clientY }, canvas.current!.getBoundingClientRect())
  function startDrag(event: PointerEvent<HTMLDivElement>, w: AppWindow) {
    if (event.button !== 0 || w.maximized) return
    event.preventDefault()
    const p = point(event)
    drag.current = { id: w.id, pointer: event.pointerId, dx: p.x - w.x, dy: p.y - w.y, window: w, bounds: w }
    event.currentTarget.focus()
    setTracking(w)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    const p = point(event)
    d.bounds = { ...d.window, ...bounds(d.window, p.x - d.dx, p.y - d.dy) }
    setTracking(d.bounds)
  }
  const cancelDrag = () => { drag.current = null; setTracking(null) }
  const stop = () => {
    const d = drag.current
    if (d) setState(s => ({ ...s, windows: s.windows.map(w => w.id === d.id ? { ...w, ...d.bounds } : w) }))
    cancelDrag()
  }
  useEffect(() => {
    const cancelOnBlur = () => { drag.current = null; setTracking(null) }
    window.addEventListener('blur', cancelOnBlur)
    return () => window.removeEventListener('blur', cancelOnBlur)
  }, [])
  const taskIds = appIds.filter(id => state.windows.some(w => w.id === id))
  return <main className="display-viewport" aria-label="Windows 95 desktop">
    <div className="desktop-shell" style={{ left: display.left, top: display.top, transform: `scale(${display.scale})` }} onPointerDownCapture={event => {
      if (!(event.target as Element).closest('[data-app-menu]')) setState(s => s.apps.menu ? { ...s, apps: { ...s.apps, menu: null } } : s)
      if (!(event.target as Element).closest('[data-start-control]')) setState(s => s.startOpen ? { ...s, startOpen: false } : s)
    }} onKeyDown={event => {
      if (event.key === 'Escape') { cancelDrag(); setState(s => ({ ...s, startOpen: false, apps: { ...s.apps, menu: null, notice: null, applet: null } })); return }
    }}>
      <canvas ref={canvas} width={DISPLAY_WIDTH} height={DISPLAY_HEIGHT} aria-hidden="true" />
      <p className="sr-only">Windows 95 desktop. Double-click a desktop icon to open an app. Drag a title bar, or focus it and use arrow keys to move its window. Drag window borders or the bottom-right grip to resize; release to apply or press Escape to cancel. Calculator is fixed-size. Start also opens apps.</p>
      {appIds.map((id, i) => <button key={id} className="hit-target shortcut-hit-target" aria-label={`Open ${applications[id].title}`} style={{ left: 8, top: 16 + i * 78, width: 74, height: 68 }} onDoubleClick={() => open(id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(id) } }} />)}
      {state.windows.filter(w => !w.minimized).map((w, index) => <section key={w.id} role="dialog" aria-label={applications[w.id].title} className="app-hit-surface" style={{ left: w.x, top: w.y, width: w.width, height: w.height, zIndex: 10 + index }}
        onPointerDownCapture={() => focus(w.id)} onFocusCapture={() => focus(w.id)}
        onWheel={event => { if (w.id !== 'calculator') void activate(w.id, event.deltaY > 0 ? 'scroll-down' : 'scroll-up') }}
        onKeyDown={event => {
          if (event.altKey && event.key === 'F4') { event.preventDefault(); void activate(w.id, 'close'); return }
          if (event.target instanceof HTMLInputElement || (event.target as HTMLElement).dataset.title !== undefined || event.ctrlKey || event.metaKey || event.altKey) return
          if (w.id === 'calculator') { const key = calculatorKey(event.key); if (key) { event.preventDefault(); void activate(w.id, `key:${key}`) } }
          if (w.id === 'control-panel' && event.key.startsWith('Arrow')) {
            event.preventDefault(); const { columns, maximum, page } = panelLayout(w.width, w.height)
            const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowDown' ? columns : -columns
            setState(s => {
              const selection = Math.max(0, Math.min(18, s.apps.selection + offset))
              const top = Math.floor(selection / columns) * 75 + 1
              const panelScroll = Math.max(0, Math.min(maximum, top < s.apps.panelScroll ? top : top + 66 > s.apps.panelScroll + page ? top + 66 - page : s.apps.panelScroll))
              return { ...s, apps: { ...s.apps, selection, panelScroll } }
            })
          }
        }}>
        {!state.apps.notice && state.apps.applet === null && <WindowResizeHandles window={w} point={point} onPreview={setTracking} onResize={rect => setState(s => ({ ...s, windows: s.windows.map(current => current.id === w.id ? { ...current, ...rect } : current), apps: { ...s.apps, panelScroll: w.id === 'control-panel' ? Math.min(s.apps.panelScroll, panelLayout(rect.width, rect.height).maximum) : s.apps.panelScroll, browser: w.id === 'browser' ? { ...s.apps.browser, scroll: Math.min(s.apps.browser.scroll, 480 - (rect.height - 144)) } : s.apps.browser } }))} />}
        {w.id === 'calculator' && <output className="sr-only" aria-label="Calculator display" aria-live="polite">{state.apps.calculator.display}</output>}
        {appControls(w, state.apps).map(c => {
          const style = { left: c.x, top: c.y, width: c.width, height: c.height, zIndex: c.id.startsWith('command:') ? 4 : 2 }
          if (c.kind === 'title') return <div key={c.id} data-title="" className="hit-target title-hit-target" style={style} tabIndex={0} role="group" aria-label={c.label} onPointerDown={e => startDrag(e, w)} onPointerMove={move} onPointerUp={stop} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag} onDoubleClick={() => void activate(w.id, 'maximize')} onKeyDown={event => {
            const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
            const d = directions[event.key]
            if (!d || w.maximized) return
            event.preventDefault(); const step = event.shiftKey ? 10 : 1
            setState(s => ({ ...s, windows: s.windows.map(current => current.id === w.id ? { ...current, ...bounds(current, current.x + d[0] * step, current.y + d[1] * step) } : current) }))
          }} />
          if (c.kind === 'scroll-thumb') {
            const panel = panelLayout(w.width, w.height)
            const scrollValue = w.id === 'browser' ? state.apps.browser.scroll : state.apps.panelScroll
            const page = w.id === 'browser' ? w.height - 144 : panel.page
            const total = w.id === 'browser' ? 480 : panel.total
            const scrollRect = w.id === 'browser' ? { x: w.width - 22, y: 119, width: 16, height: page } : panel.bar
            return <div key={c.id} className="hit-target" style={{ ...style, touchAction: 'none' }} role="slider" tabIndex={0} aria-label={c.label} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={Math.max(0, total - page)} aria-valuenow={scrollValue}
            onPointerDown={event => {
              const geometry = scrollbarGeometry(scrollRect, 'vertical', { value: scrollValue, total, page })
              scrollDrag.current = { pointer: event.pointerId, y: point(event).y, value: scrollValue, travel: geometry.travel, maximum: geometry.maximum }
              event.currentTarget.setPointerCapture(event.pointerId)
            }} onPointerMove={event => {
              const d = scrollDrag.current
              if (!d || d.pointer !== event.pointerId || !d.travel) return
              const value = Math.max(0, Math.min(d.maximum, Math.round(d.value + (point(event).y - d.y) * d.maximum / d.travel)))
              setState(s => ({ ...s, apps: { ...s.apps, ...(w.id === 'browser' ? { browser: { ...s.apps.browser, scroll: value } } : { panelScroll: value }) } }))
            }} onPointerUp={() => { scrollDrag.current = null }} onPointerCancel={() => { scrollDrag.current = null }} onLostPointerCapture={() => { scrollDrag.current = null }} onKeyDown={event => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); void activate(w.id, event.key === 'ArrowDown' ? 'scroll-down' : 'scroll-up') }
            }} />
          }
          if (c.kind === 'address') return <input key={c.id} ref={addressInput} className="hit-target desktop-address" style={style} aria-label={c.label} value={c.value} spellCheck={false} autoComplete="off" onSelect={event => { const input = event.currentTarget; const selection: [number, number] = [input.selectionStart ?? 0, input.selectionEnd ?? 0]; setState(s => ({ ...s, apps: { ...s.apps, browser: { ...s.apps.browser, selection } } })) }} onFocus={event => { event.currentTarget.select(); setState(s => ({ ...s, editingAddress: true })) }} onBlur={() => setState(s => ({ ...s, editingAddress: false }))} onChange={event => { const address = event.target.value; setState(s => ({ ...s, apps: { ...s.apps, browser: { ...s.apps.browser, address } } })) }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void activate(w.id, 'navigate'); event.currentTarget.blur() } }} />
          return <button key={c.id} data-app-menu={c.id.startsWith('menu:') || c.id.startsWith('command:') ? '' : undefined} className="hit-target" style={style} aria-label={c.label} disabled={c.disabled} onPointerDown={() => pressed(w.id, c.id)} onPointerUp={release} onPointerLeave={release} onPointerCancel={release} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setState(s => ({ ...s, apps: { ...s.apps, focused: { app: w.id, id: c.id } } })) }} onBlur={() => { release(); setState(s => ({ ...s, apps: { ...s.apps, focused: null } })) }}
            onClick={() => { if (c.id === 'command:Open address') addressInput.current?.focus(); void activate(w.id, c.id) }}
            onDoubleClick={() => { if (c.id.startsWith('applet:')) void activate(w.id, `launch-applet:${c.id.slice(7)}`) }}
            onKeyDown={event => { if (c.id.startsWith('applet:') && event.key === 'Enter') { event.preventDefault(); void activate(w.id, `launch-applet:${c.id.slice(7)}`) } }} />
        })}
      </section>)}
      <div className="taskbar-hit-surface" style={{ left: 0, top: 450, width: 640, height: 30 }}>
        <button className="hit-target" style={{ left: 2, top: 4, width: 54, height: 22 }} data-start-control="" aria-label="Start" aria-expanded={state.startOpen} onClick={() => void activate(null, 'start')} />
        {taskIds.map((id, i) => <button key={id} className="hit-target" style={{ left: 64 + i * 157, top: 4, width: 153, height: 22 }} aria-label={`Task: ${applications[id].title}`} onClick={() => void activate(null, `task:${id}`)} />)}
      </div>
      {state.startOpen && <nav className="start-hit-surface" aria-label="Start menu" data-start-control="" style={{ left: 2, top: 285, width: 199, height: 165 }}>
        {appIds.map((id, i) => <button key={id} className="hit-target" style={{ left: 26, top: 7 + i * 37, width: 169, height: 36 }} aria-label={applications[id].title} onPointerEnter={() => pressed(null, `open:${id}`)} onPointerLeave={release} onClick={() => open(id)} />)}
        <button className="hit-target" style={{ left: 26, top: 130, width: 169, height: 33 }} aria-label="Show Desktop" onClick={() => void activate(null, 'show-desktop')} />
      </nav>}
    </div>
  </main>
}
export default App
