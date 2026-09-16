import { createPainter, palette } from './win95'
import type { Rect } from './win95'

export type FieldState = 'normal' | 'disabled'
export type ChoiceOptions = { checked?: boolean; disabled?: boolean; label?: string; focused?: boolean }

export function createFormPainter(context: CanvasRenderingContext2D) {
  const p = createPainter(context)
  const { fill, text, mask, bevel, buttonFrame, focus } = p
  const { black, white, gray, silver } = palette
  const checkbox = (x: number, y: number, { checked = false, disabled = false, label, focused = false }: ChoiceOptions = {}) => {
    bevel({ x, y, width: 13, height: 13 }, true)
    fill(x + 2, y + 2, 9, 9, disabled ? silver : white)
    if (checked) mask(['0000001', '0000011', '1000111', '1101110', '1111100', '0111000', '0010000'], x + 3, y + 3, disabled ? gray : black)
    if (label) text(label, x + 18, y, 8, disabled ? gray : black)
    if (focused) focus({ x: x + 14, y: y - 3, width: 75, height: 19 })
  }
  const radio = (x: number, y: number, { checked = false, disabled = false, label, focused = false }: ChoiceOptions = {}) => {
    const rows = ['    gggg    ', '  ggkkkkgg  ', ' gkkffffkkw ', ' gkfffffflw ', 'gkfffffffflw', 'gkfffffffflw', 'gkfffffffflw', 'gkfffffffflw', ' gkfffffflw ', ' gllffffllw ', '  wwllllww  ', '    wwww    ']
    const colors: Record<string, string> = { g: gray, k: black, w: white, l: palette.light, f: disabled ? silver : white }
    rows.forEach((row, dy) => [...row].forEach((key, dx) => { if (colors[key]) fill(x + dx, y + dy, 1, 1, colors[key]) }))
    if (checked) mask(['0110', '1111', '1111', '0110'], x + 4, y + 4, disabled ? gray : black)
    if (label) text(label, x + 17, y - 1, 8, disabled ? gray : black)
    if (focused) focus({ x: x + 13, y: y - 4, width: 75, height: 19 })
  }
  const arrowButton = (r: Rect, direction: 'up' | 'down', disabled = false, pressed = false) => {
    buttonFrame(r, pressed)
    const rows = direction === 'up' ? ['00100', '01110', '11111'] : ['11111', '01110', '00100']
    mask(rows, r.x + Math.floor((r.width - 5) / 2) + Number(pressed), r.y + Math.floor((r.height - 3) / 2) + Number(pressed), disabled ? gray : black)
  }
  const input = (r: Rect, value = '', state: FieldState = 'normal', dropdown = false) => {
    const disabled = state === 'disabled'
    bevel(r, true)
    fill(r.x + 2, r.y + 2, r.width - 4, r.height - 4, disabled ? silver : white)
    context.save()
    context.beginPath()
    context.rect(r.x + 3, r.y + 2, r.width - (dropdown ? 21 : 6), r.height - 4)
    context.clip()
    text(value, r.x + 4, r.y + Math.floor((r.height - 13) / 2), 8, disabled ? gray : black)
    context.restore()
    if (dropdown) arrowButton({ x: r.x + r.width - 18, y: r.y + 2, width: 16, height: r.height - 4 }, 'down', disabled)
  }
  const spinner = (r: Rect, upDisabled = false, downDisabled = false) => {
    const height = Math.floor(r.height / 2)
    arrowButton({ ...r, height }, 'up', upDisabled)
    arrowButton({ ...r, y: r.y + height, height: r.height - height }, 'down', downDisabled)
  }
  const numberInput = (r: Rect, value = '', disabled = false) => {
    input(r, value, disabled ? 'disabled' : 'normal')
    spinner({ x: r.x + r.width - 18, y: r.y + 2, width: 16, height: r.height - 4 }, disabled, disabled)
  }
  return { ...p, checkbox, radio, arrowButton, input, spinner, numberInput }
}
