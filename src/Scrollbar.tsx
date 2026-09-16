import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { createCollectionPainter, scrollbarGeometry } from './collectionControls'
import type { Orientation, ScrollPart } from './collectionControls'
import { PixelPreview } from './PixelPreview'

export function Scrollbar({ orientation, length, total, page, value, scale, controls, onChange, disabled = false }: {
  orientation: Orientation; length: number; total: number; page: number; value: number
  scale: number; controls: string; onChange: (value: number) => void; disabled?: boolean
}) {
  const [pressed, setPressed] = useState<ScrollPart>()
  const drag = useRef<{ origin: number; value: number } | null>(null)
  const repeat = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const vertical = orientation === 'vertical'
  const width = vertical ? 16 : length
  const height = vertical ? length : 16
  const geometry = scrollbarGeometry({ x: 0, y: 0, width, height }, orientation, { value, total, page })
  const current = useRef(value)
  useEffect(() => { current.current = value }, [value])
  useEffect(() => () => clearTimeout(repeat.current), [])
  useEffect(() => { if (disabled) { clearTimeout(repeat.current); drag.current = null } }, [disabled])
  const change = (next: number) => {
    current.current = Math.max(0, Math.min(geometry.maximum, Math.round(next)))
    onChange(current.current)
  }
  const coordinate = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return (vertical ? event.clientY - bounds.top : event.clientX - bounds.left) / scale
  }
  const release = () => { clearTimeout(repeat.current); drag.current = null; setPressed(undefined) }
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || geometry.maximum === 0 || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    const position = coordinate(event)
    const thumbStart = vertical ? geometry.thumb.y : geometry.thumb.x
    const thumbLength = vertical ? geometry.thumb.height : geometry.thumb.width
    const part: ScrollPart = position < 16 ? 'start' : position >= length - 16 ? 'end'
      : position < thumbStart ? 'before' : position >= thumbStart + thumbLength ? 'after' : 'thumb'
    setPressed(part)
    if (part === 'thumb') drag.current = { origin: position, value }
    else {
      const delta = (part === 'start' || part === 'before' ? -1 : 1) * (part === 'start' || part === 'end' ? 16 : page)
      const step = () => {
        // A held track click stops when the thumb reaches the pointer.
        const updated = scrollbarGeometry({ x: 0, y: 0, width, height }, orientation, { value: current.current, total, page })
        const start = vertical ? updated.thumb.y : updated.thumb.x
        const end = start + (vertical ? updated.thumb.height : updated.thumb.width)
        if (part === 'before' && position >= start || part === 'after' && position < end) return
        change(current.current + delta)
        repeat.current = setTimeout(step, 60)
      }
      change(value + delta)
      repeat.current = setTimeout(step, 350)
    }
  }
  return <div className="bitmap-scrollbar" role="scrollbar" tabIndex={disabled ? -1 : 0} aria-disabled={disabled} aria-label={`${orientation} scrollbar`}
    aria-controls={controls} aria-orientation={orientation} aria-valuemin={0} aria-valuemax={geometry.maximum} aria-valuenow={value}
    style={{ width: width * scale, height: height * scale }}
    onPointerDown={pointerDown} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
    onPointerMove={event => {
      if (drag.current && geometry.travel) change(drag.current.value + (coordinate(event) - drag.current.origin) * geometry.maximum / geometry.travel)
    }}
    onKeyDown={event => {
      if (disabled) return
      const deltas: Record<string, number> = { ArrowUp: -16, ArrowLeft: -16, ArrowDown: 16, ArrowRight: 16, PageUp: -page, PageDown: page }
      if (event.key in deltas || event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        change(event.key === 'Home' ? 0 : event.key === 'End' ? geometry.maximum : value + deltas[event.key])
      }
    }}>
    <PixelPreview scale={scale} sample={{ id: orientation, title: orientation, detail: 'Interactive scrollbar', width, height,
      draw: context => createCollectionPainter(context).scrollbar({ x: 0, y: 0, width, height }, orientation, { value, total, page, pressed: disabled ? undefined : pressed, disabled }) }} />
  </div>
}
