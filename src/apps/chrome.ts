import { createPainter, palette } from '../win95'
import { measureBitmapText } from '../bitmapFont'
import { appSprite } from './assets'
import { applications } from './model'
import type { AppControl, AppId } from './model'
export const menus: Record<AppId, string[]> = { calculator: ['Edit', 'View', 'Help'], 'control-panel': ['File', 'Edit', 'View', 'Help'], browser: ['File', 'Edit', 'View', 'Go', 'Favorites', 'Help'] }
export function menuRects(id: AppId): AppControl[] {
  let x = id === 'calculator' ? 7 : 8
  return menus[id].map(label => {
    const width = measureBitmapText(label) + 12
    const r = { id: `menu:${label}`, label, x, y: id === 'calculator' ? 24 : 25, width, height: 18 }
    x += width
    return r
  })
}
export function chromeControls(id: AppId, width: number): AppControl[] {
  const inset = id === 'calculator' ? 0 : 1
  return [
    { id: 'title', label: `Move ${applications[id].title}`, kind: 'title', x: 3, y: 3, width: width - 61, height: 18 },
    { id: 'minimize', label: `Minimize ${applications[id].title}`, x: width - 55 - inset, y: 5 + inset, width: 16, height: 14 },
    { id: 'maximize', label: `Maximize ${applications[id].title}`, x: width - 39 - inset, y: 5 + inset, width: 16, height: 14, disabled: id === 'calculator' },
    { id: 'close', label: `Close ${applications[id].title}`, x: width - 21 - inset, y: 5 + inset, width: 16, height: 14 },
    ...menuRects(id),
  ]
}
export function paintChrome(ctx: CanvasRenderingContext2D, id: AppId, width: number, height: number, active: boolean, pressed: string | null, maximized = false) {
  const p = createPainter(ctx)
  p.windowFrame({ x: 0, y: 0, width, height })
  // IE 3 uses the face color on the outside of its sizing frame.
  if (id === 'browser') { p.fill(0, 0, width - 1, 1, palette.silver); p.fill(0, 0, 1, height - 1, palette.silver) }
  const inset = id === 'calculator' ? 3 : 4
  p.fill(inset, inset, width - inset * 2, 18, active ? palette.navy : palette.gray)
  appSprite(ctx, `${id}-small`, 5, id === 'calculator' ? 5 : 6)
  const title = id === 'browser' ? 'Microsoft Internet Explorer - Microsoft Internet Explorer' : applications[id].title
  ctx.save(); ctx.beginPath(); ctx.rect(23, inset, width - 82, 18); ctx.clip()
  p.text(title, id === 'calculator' ? 23 : 24, id === 'calculator' ? 5 : 6, 8, palette.white, true)
  ctx.restore()
  for (const r of chromeControls(id, width)) {
    if (r.id === 'minimize' || r.id === 'maximize' || r.id === 'close') p.captionButton(r, r.id === 'maximize' && maximized ? 'restore' : r.id, pressed === r.id, r.disabled)
  }
  if (id === 'browser') chromeControls(id, width).filter(r => ['minimize', 'maximize', 'close'].includes(r.id)).forEach(r => { p.fill(r.x + 1, r.y + 1, r.width - 3, 1, palette.silver); p.fill(r.x + 1, r.y + 1, 1, r.height - 3, palette.silver) })
  menuRects(id).forEach(r => {
    p.text(r.label, r.x + 2, r.y, 8)
    p.fill(r.x + 2 + (r.label === 'Favorites' ? measureBitmapText('F') : 0), r.y + 12, measureBitmapText(r.label[r.label === 'Favorites' ? 1 : 0]), 1, palette.black)
  })
}
