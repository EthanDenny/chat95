import { drawBitmapText, measureBitmapText, fontRoles } from './bitmapFont'
import type { FontRequest } from './bitmapFont'
import { drawKitIcon, drawStartFlag } from './kitIcons'

export type Point = { x: number; y: number }
export type Rect = Point & { width: number; height: number }
export type CaptionKind = 'minimize' | 'maximize' | 'restore' | 'close'
export type ButtonState = 'normal' | 'pressed' | 'focused' | 'preferred' | 'disabled'

export const palette = {
  desktop: '#008080', silver: '#c0c0c0', gray: '#808080', navy: '#000080',
  white: '#ffffff', light: '#dfdfdf', black: '#000000', info: '#ffffe1',
} as const
export const metrics = { titleHeight: 18, captionWidth: 16, captionHeight: 14, buttonWidth: 75, buttonHeight: 23, startWidth: 54, startHeight: 22 } as const
// Original Windows 95 caption glyph; see public/reference/README.md.
export const CLOSE_PIXELS = ['11000011', '01100110', '00111100', '00011000', '00111100', '01100110', '11000011']

export function captionRects(r: Rect) {
  return {
    minimize: { x: r.x + r.width - 55, y: r.y + 5, width: metrics.captionWidth, height: metrics.captionHeight },
    maximize: { x: r.x + r.width - 39, y: r.y + 5, width: metrics.captionWidth, height: metrics.captionHeight },
    close: { x: r.x + r.width - 21, y: r.y + 5, width: metrics.captionWidth, height: metrics.captionHeight },
  }
}

export function createPainter(context: CanvasRenderingContext2D) {
  context.imageSmoothingEnabled = false
  const { silver, gray } = palette
  const fill = (x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color
    context.fillRect(x, y, width, height)
  }
  const text = (value: string, x: number, y: number, size: FontRequest = fontRoles.ui, color: string = palette.black, bold = false) => drawBitmapText(context, value, x, y, size, color, bold)
  const frame = (r: Rect, outerTop: string, outerBottom: string, innerTop?: string, innerBottom?: string) => {
    const { x, y, width: w, height: h } = r
    fill(x, y, w, h, outerBottom)
    fill(x, y, w - 1, h - 1, outerTop)
    fill(x + 1, y + 1, w - 2, h - 2, silver)
    if (innerTop && innerBottom) {
      fill(x + 1, y + 1, w - 2, h - 2, innerBottom)
      fill(x + 1, y + 1, w - 3, h - 3, innerTop)
      fill(x + 2, y + 2, w - 4, h - 4, silver)
    }
  }
  const bevel = (r: Rect, inset = false) => inset
    ? frame(r, gray, palette.white, palette.black, palette.light)
    : frame(r, palette.white, palette.black, palette.light, gray)
  const windowFrame = (r: Rect) => frame(r, palette.light, palette.black, palette.white, gray)
  const buttonFrame = (r: Rect, pressed = false) => pressed
    ? frame(r, palette.black, palette.white, gray, palette.light)
    : bevel(r)
  const recess = (r: Rect) => frame(r, gray, palette.light)
  const taskButton = (r: Rect, selected = false, pressed = false) => {
    buttonFrame(r, selected || pressed)
    if (selected) {
      for (let y = 2; y < r.height - 2; y++) {
        for (let x = 2 + y % 2; x < r.width - 2; x += 2) fill(r.x + x, r.y + y, 1, 1, palette.white)
      }
    }
  }
  const mask = (rows: string[], x: number, y: number, color: string = palette.black) => {
    rows.forEach((row, dy) => [...row].forEach((pixel, dx) => { if (pixel === '1') fill(x + dx, y + dy, 1, 1, color) }))
  }
  const computer = (x: number, y: number, scale = 1) => drawKitIcon(context, 'My Computer', x, y, 32, scale)
  const flag = (x: number, y: number) => drawStartFlag(context, x, y)

  const focus = (r: Rect, color: string = palette.black) => {
    for (let dx = 3; dx < r.width - 3; dx += 2) { fill(r.x + dx, r.y + 2, 1, 1, color); fill(r.x + dx, r.y + r.height - 3, 1, 1, color) }
    for (let dy = 3; dy < r.height - 3; dy += 2) { fill(r.x + 2, r.y + dy, 1, 1, color); fill(r.x + r.width - 3, r.y + dy, 1, 1, color) }
  }
  const captionButton = (r: Rect, kind: CaptionKind, pressed = false, disabled = false) => {
    buttonFrame(r, pressed)
    const glyphs: Record<CaptionKind, { rows: string[]; x: number; y: number }> = {
      close: { rows: CLOSE_PIXELS, x: 4, y: 3 },
      minimize: { rows: ['111111', '111111'], x: 4, y: r.height - 5 },
      maximize: { rows: ['111111111', '111111111', '100000001', '100000001', '100000001', '100000001', '100000001', '100000001', '111111111'], x: 3, y: 2 },
      restore: { rows: ['00111111', '00111111', '00100001', '11111101', '11111101', '10000111', '10000100', '10000100', '11111100'], x: 3, y: 2 },
    }
    const glyph = glyphs[kind]
    const x = r.x + glyph.x + Number(pressed)
    const y = r.y + glyph.y + Number(pressed)
    if (disabled) mask(glyph.rows, x + 1, y + 1, palette.white)
    mask(glyph.rows, x, y, disabled ? gray : palette.black)
  }

  const pushButton = (r: Rect, label: string, state: ButtonState = 'normal') => {
    if (state === 'preferred' || state === 'focused') {
      fill(r.x, r.y, r.width, r.height, palette.black)
      bevel({ x: r.x + 1, y: r.y + 1, width: r.width - 2, height: r.height - 2 })
    } else buttonFrame(r, state === 'pressed')
    const offset = Number(state === 'pressed')
    const x = r.x + Math.floor((r.width - measureBitmapText(label)) / 2) + offset
    const y = r.y + Math.floor((r.height - 13) / 2) + offset
    if (state === 'disabled') text(label, x + 1, y + 1, 8, palette.white)
    text(label, x, y, 8, state === 'disabled' ? gray : palette.black)
    if (state === 'focused') focus({ x: r.x + 2, y: r.y + 2, width: r.width - 4, height: r.height - 4 })
  }
  const titleBar = (r: Rect, label: string, active = true) => {
    fill(r.x + 3, r.y + 3, r.width - 6, metrics.titleHeight, active ? palette.navy : gray)
    text(label, r.x + 8, r.y + 5, fontRoles.uiBold, active ? palette.white : silver)
  }
  const startButton = (x: number, y: number, pressed = false, focused = false) => {
    const r = { x, y, width: metrics.startWidth, height: metrics.startHeight }
    const offset = Number(pressed)
    buttonFrame(r, pressed)
    flag(x + 4 + offset, y + 4 + offset)
    text('Start', x + 23 + offset, y + 4 + offset, fontRoles.uiBold, palette.black)
    if (focused) focus(r)
  }
  const icon = (name: string, x: number, y: number, size: 16 | 32 = 32, scale = 1) => drawKitIcon(context, name, x, y, size, scale)
  return { fill, text, bevel, windowFrame, buttonFrame, recess, taskButton, mask, computer, flag, focus, captionButton, pushButton, titleBar, startButton, icon }
}
