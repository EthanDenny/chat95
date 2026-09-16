import { createPainter, palette } from '../win95'
import { measureBitmapText, fontRoles } from '../bitmapFont'
import type { AppControl } from './model'
import type { CalculatorState } from './calculator'
export const calculatorButtons: AppControl[] = [
  ...['Back', 'CE', 'C'].map((label, i) => ({ id: `key:${label}`, label, x: 107 + i * 53, y: 93, width: 49, height: 28 })),
  ...['MC', 'MR', 'MS', 'M+'].map((label, i) => ({ id: `key:${label}`, label, x: 14, y: 127 + i * 34, width: 36, height: 28 })),
  ...['7', '8', '9', '/', 'sqrt', '4', '5', '6', '*', '%', '1', '2', '3', '-', '1/x', '0', '+/-', '.', '+', '='].map((label, i) => ({ id: `key:${label}`, label, x: 66 + i % 5 * 40, y: 127 + Math.floor(i / 5) * 34, width: 36, height: 28 })),
]
export function paintCalculator(ctx: CanvasRenderingContext2D, state: CalculatorState, pressed: string | null) {
  const p = createPainter(ctx)
  p.fill(4, 46, 268, 1, palette.gray); p.fill(4, 47, 268, 1, palette.white)
  p.bevel({ x: 14, y: 61, width: 249, height: 26 }, true)
  p.fill(16, 63, 245, 22, palette.white)
  const label = state.display === 'Error' || state.display.includes('.') || /e/i.test(state.display) ? state.display : `${state.display}.`
  p.text(label, 255 - measureBitmapText(label), 67)
  p.bevel({ x: 14, y: 93, width: 36, height: 26 }, true)
  if (state.memory) p.text('M', 25, 99)
  calculatorButtons.forEach(r => {
    const down = pressed === r.id
    p.buttonFrame(r, down)
    const red = ['Back', 'CE', 'C', 'MC', 'MR', 'MS', 'M+', '/', '*', '-', '+', '='].includes(r.label)
    p.text(r.label, r.x + Math.floor((r.width - measureBitmapText(r.label, fontRoles.systemControl)) / 2) + Number(down), r.y + 6 + Number(down), fontRoles.systemControl, ['Back', 'CE', 'C'].includes(r.label) ? '#800000' : ['sqrt', '%', '1/x'].includes(r.label) ? '#000080' : red ? '#ff0000' : '#0000ff')
  })
}
