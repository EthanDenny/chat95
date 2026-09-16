import { useState } from 'react'
import type { ReactNode } from 'react'
import { createFormPainter } from './formControls'
import { PixelPreview } from './PixelPreview'
import { palette } from './win95'

export type FormPainter = ReturnType<typeof createFormPainter>
export function Demo({ title, controls, children }: { title: string; controls?: ReactNode; children: ReactNode }) {
  return <article className="interactive-demo"><h3>{title}</h3><div className="interactive-demo-body"><div className="sample-stage">{children}</div><div className="demo-options">{controls}</div></div></article>
}
export function Toggle({ title, label, value, onChange }: { title: string; label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label><input type="checkbox" aria-label={`${title}: ${label}`} checked={value} onChange={event => onChange(event.target.checked)} /> {label}</label>
}
export function Surface({ title, width, height, scale, draw, children }: { title: string; width: number; height: number; scale: number; draw: (p: FormPainter, context: CanvasRenderingContext2D) => void; children?: ReactNode }) {
  return <div className="demo-surface" style={{ width: width * scale, height: height * scale }}>
    <PixelPreview scale={scale} sample={{ id: title, title, detail: 'Interactive component', width, height, draw: context => {
      const p = createFormPainter(context)
      p.fill(0, 0, width, height, palette.silver)
      draw(p, context)
    } }} />{children}
  </div>
}
export function BitmapButton({ label, width, height, scale, disabled = false, draw, onClick }: { label: string; width: number; height: number; scale: number; disabled?: boolean; draw: (p: FormPainter, pressed: boolean, focused: boolean, context: CanvasRenderingContext2D) => void; onClick: () => void }) {
  const [pressed, setPressed] = useState(false)
  const [focused, setFocused] = useState(false)
  return <button className="live-button" disabled={disabled} aria-label={label} onClick={onClick}
    onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerLeave={() => setPressed(false)} onPointerCancel={() => setPressed(false)}
    onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setPressed(false) }}
    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') setPressed(true) }} onKeyUp={() => setPressed(false)}>
    <Surface title={label} width={width} height={height} scale={scale} draw={(p, ctx) => draw(p, pressed && !disabled, focused && !disabled, ctx)} />
  </button>
}
