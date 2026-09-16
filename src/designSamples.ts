import { captionRects, createPainter, metrics, palette } from './win95'
import type { ButtonState, CaptionKind } from './win95'
import { getBitmapFont } from './bitmapFont'
import type { FontSpec } from './bitmapFont'

export type Sample = {
  id: string
  title: string
  detail: string
  width: number
  height: number
  draw: (context: CanvasRenderingContext2D) => void
}

export function typeSample(font: FontSpec, value: string): Sample {
  const native = getBitmapFont(font)
  const height = Math.max(44, native.height + 20)
  return {
    id: `type-${font.family}-${font.size}-${native.weight}`,
    title: `${native.family} · ${font.size} pt · ${native.weight === 'bold' ? 'Bold' : 'Regular'}`,
    detail: `${native.height} px cell · ${native.source}`,
    width: 310, height,
    draw: context => {
      const p = createPainter(context)
      p.fill(0, 0, 310, height, palette.white)
      p.text(value, 10, 10, font)
    },
  }
}

export const captionSamples: Sample[] = (['minimize', 'maximize', 'restore', 'close'] as CaptionKind[]).map(kind => ({
  id: kind, title: kind[0].toUpperCase() + kind.slice(1), detail: '16 × 14 px · normal / pressed', width: 64, height: 34,
  draw: context => {
    const p = createPainter(context)
    p.fill(0, 0, 64, 34, palette.navy)
    p.captionButton({ x: 10, y: 10, width: metrics.captionWidth, height: metrics.captionHeight }, kind)
    p.captionButton({ x: 38, y: 10, width: metrics.captionWidth, height: metrics.captionHeight }, kind, true)
  },
}))

export const titleSamples: Sample[] = [true, false].map(active => ({
  id: `title-${active}`, title: active ? 'Active window' : 'Inactive window', detail: '18 px title bar · 3 px frame inset', width: 260, height: 60,
  draw: context => {
    const p = createPainter(context)
    p.fill(0, 0, 260, 60, palette.desktop)
    const r = { x: 8, y: 8, width: 244, height: 44 }
    p.windowFrame(r)
    p.titleBar(r, 'Welcome to Windows 95', active)
    const captions = captionRects(r)
    p.captionButton(captions.minimize, 'minimize')
    p.captionButton(captions.maximize, 'maximize')
    p.captionButton(captions.close, 'close')
  },
}))

export function buttonSample(state: ButtonState): Sample {
  return {
    id: `button-${state}`, title: state[0].toUpperCase() + state.slice(1), detail: '75 × 23 px · centered 8 pt label', width: 95, height: 44,
    draw: context => {
      const p = createPainter(context)
      p.fill(0, 0, 95, 44, palette.silver)
      p.pushButton({ x: 10, y: 10, width: metrics.buttonWidth, height: metrics.buttonHeight }, 'Button', state)
    },
  }
}

export const surfaceSamples: Sample[] = [false, true].map(inset => ({
  id: `surface-${inset}`, title: inset ? 'Sunken border' : 'Raised border', detail: '2 px bevel · shared edge colors', width: 140, height: 56,
  draw: context => {
    const p = createPainter(context)
    p.fill(0, 0, 140, 56, palette.silver)
    p.bevel({ x: 10, y: 10, width: 120, height: 36 }, inset)
    p.text(inset ? 'Ready' : 'Raised surface', 20, 21)
  },
}))
export const borderSamples: Sample[] = [
  { id: 'window-frame', title: 'Window frame', detail: 'Window highlight order', width: 140, height: 56,
    draw: context => { const p = createPainter(context); p.fill(0, 0, 140, 56, palette.silver); p.windowFrame({ x: 10, y: 10, width: 120, height: 36 }); p.text('Window frame', 20, 21) } },
  { id: 'status-recess', title: 'Status bar recess', detail: 'One-pixel inset', width: 140, height: 56,
    draw: context => { const p = createPainter(context); p.fill(0, 0, 140, 56, palette.silver); p.recess({ x: 10, y: 10, width: 120, height: 36 }); p.text('Ready', 20, 21) } },
]
