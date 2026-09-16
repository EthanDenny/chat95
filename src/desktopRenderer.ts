import { measureBitmapText } from './bitmapFont'
import { captionRects, createPainter, metrics, palette } from './win95'
import type { Point, Rect } from './win95'
export type { Point, Rect } from './win95'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from './display'

export type ControlId = 'welcome' | 'title' | 'minimize' | 'maximize' | 'close' | 'ok' | 'start' | 'task' | 'menu-welcome' | 'show-desktop'
export type Control = Rect & { id: ControlId; label: string }
export type DesktopState = {
  position: Point
  open: boolean
  minimized: boolean
  maximized: boolean
  startOpen: boolean
  dragging: boolean
  pressed: ControlId | null
  focused: ControlId | null
  clock: string
}

export const TASKBAR_Y = 450
export const WINDOW_WIDTH = 500
export const WINDOW_HEIGHT = 340
const { silver, gray, navy } = palette

export function windowRect(state: DesktopState): Rect {
  return state.maximized
    ? { x: 0, y: 0, width: DISPLAY_WIDTH, height: TASKBAR_Y }
    : { ...state.position, width: WINDOW_WIDTH, height: WINDOW_HEIGHT }
}

// Drawing and native hit targets share the same geometry.
export function getControls(state: DesktopState): Control[] {
  const controls: Control[] = [{ id: 'welcome', label: 'Open Welcome', x: 16, y: 16, width: 70, height: 62 }]
  if (state.open && !state.minimized) {
    const r = windowRect(state)
    const { x, y, width, height } = r
    const captions = captionRects(r)
    controls.push(
      { id: 'title', label: 'Move window: drag or use arrow keys', x: x + 3, y: y + 3, width: width - 62, height: metrics.titleHeight },
      { id: 'minimize', label: 'Minimize', ...captions.minimize },
      { id: 'maximize', label: state.maximized ? 'Restore' : 'Maximize', ...captions.maximize },
      { id: 'close', label: 'Close', ...captions.close },
      { id: 'ok', label: 'OK', x: x + width - 93, y: y + height - 56, width: metrics.buttonWidth, height: metrics.buttonHeight },
    )
  }
  controls.push({ id: 'start', label: 'Start', x: 2, y: 454, width: metrics.startWidth, height: metrics.startHeight })
  if (state.open) controls.push({ id: 'task', label: 'Welcome to Windows 95', x: 64, y: 454, width: 190, height: 24 })
  if (state.startOpen) controls.push(
    { id: 'menu-welcome', label: 'Welcome', x: 28, y: 349, width: 162, height: 45 },
    { id: 'show-desktop', label: 'Show desktop', x: 28, y: 400, width: 162, height: 45 },
  )
  return controls
}

export function drawDesktop(context: CanvasRenderingContext2D, state: DesktopState) {
  context.imageSmoothingEnabled = false
  const { fill, text, bevel, windowFrame, recess, taskButton, computer, focus, captionButton, pushButton, titleBar, startButton } = createPainter(context)

  fill(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT, palette.desktop)
  computer(36, 20)
  text('Welcome', 25, 57, 8, palette.black); text('Welcome', 24, 56, 8, palette.white)

  if (state.open && !state.minimized) {
    const r = windowRect(state)
    const { x, y, width: w, height: h } = r
    windowFrame(r)
    titleBar(r, 'Welcome to Windows 95')
    fill(x + 4, y + 24, w - 8, 89, palette.white)
    computer(x + 26, y + 39, 2)
    text('Microsoft', x + 104, y + 38)
    text('Windows', x + 102, y + 53, 24, palette.black, true)
    text('95', x + 102 + measureBitmapText('Windows', 24, true) + 3, y + 53, 24, gray)
    fill(x + 4, y + 113, w - 8, 1, gray)
    text('Welcome to your desktop.', x + 26, y + 133, 10, palette.black, true)
    text('A familiar place to start.', x + 26, y + 157)
    bevel({ x: x + 26, y: y + 185, width: w - 52, height: 69 }, true)
    fill(x + 28, y + 187, w - 56, 65, palette.info)
    fill(x + 39, y + 200, 18, 18, navy)
    text('i', x + 45, y + 200, 8, palette.white, true)
    text('Make yourself at home.', x + 70, y + 198, 8, palette.black, true)
    text('Grab the blue title bar and move this window', x + 70, y + 218)
    text('anywhere on your desktop.', x + 70, y + 233)
    text('Tip: focus the title bar and use the arrow keys to move.', x + 26, y + 262, 8, '#404040')
    fill(x + 6, y + h - 65, w - 12, 1, gray)
    fill(x + 6, y + h - 64, w - 12, 1, palette.white)
    text("It's a good day to be back.", x + 18, y + h - 49)
    recess({ x: x + 4, y: y + h - 23, width: w - 109, height: 19 })
    recess({ x: x + w - 103, y: y + h - 23, width: 99, height: 19 })
    text(state.dragging ? 'Moving window...' : 'Ready', x + 8, y + h - 20)
    text('Windows 95', x + w - 97, y + h - 20)
  }

  fill(0, TASKBAR_Y, 640, 30, silver)
  fill(0, TASKBAR_Y, 640, 1, palette.light); fill(0, TASKBAR_Y + 1, 640, 1, palette.white)
  fill(59, 455, 1, 22, gray); fill(60, 455, 1, 22, palette.white)
  recess({ x: 548, y: 454, width: 89, height: 24 })
  text(state.clock, 562, 459)
  if (state.startOpen) {
    windowFrame({ x: 2, y: 346, width: 192, height: 106 })
    fill(5, 349, 22, 100, gray)
    text('95', 8, 427, 8, palette.white, true)
    fill(30, 397, 159, 1, gray); fill(30, 398, 159, 1, palette.white)
  }

  for (const control of getControls(state)) {
    const { id, x, y, width, height } = control
    const pressed = state.pressed === id
    const offset = pressed ? 1 : 0
    if (id === 'start') startButton(x, y, pressed || state.startOpen, state.focused === id)
    if (id === 'task') taskButton(control, !state.minimized, pressed)
    if (id === 'close' || id === 'minimize' || id === 'maximize') captionButton(control, id === 'maximize' && state.maximized ? 'restore' : id, pressed)
    if (id === 'ok') pushButton(control, 'OK', pressed ? 'pressed' : state.focused === id ? 'focused' : 'normal')
    if (id === 'task') text('Welcome to Windows 95', x + 8 + offset, y + 5 + offset, 8, palette.black, !state.minimized)
    if (id === 'menu-welcome' || id === 'show-desktop') {
      const selected = state.focused === id || pressed
      if (selected) fill(x, y, width, height, navy)
      if (id === 'menu-welcome') computer(x + 8, y + 7)
      else { fill(x + 8, y + 12, 28, 22, palette.black); fill(x + 10, y + 14, 24, 18, palette.desktop) }
      text(control.label, x + 46, y + 15, 8, selected ? palette.white : palette.black)
    }
    if (state.focused === id && id !== 'ok' && id !== 'start' && !id.startsWith('menu-')) {
      const color = id === 'title' || id === 'welcome' ? palette.white : palette.black
      focus(control, color)
    }
  }
}
