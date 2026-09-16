import { useEffect, useId, useRef, useState } from 'react'
import { measureBitmapText } from './bitmapFont'
import { createCollectionPainter } from './collectionControls'
import { dialogFiles } from './fileListSamples'
import { PixelPreview } from './PixelPreview'
import { Scrollbar } from './Scrollbar'

const width = 380
const height = 128
const viewport = { x: 2, y: 2, width: width - 4, height: height - 20 }
const columnWidth = 244
const rows = Math.floor(viewport.height / 16)
const totalWidth = Math.ceil(dialogFiles.length / rows) * columnWidth
const maxOffset = totalWidth - viewport.width

export function FileListPreview({ scale, disabled = false }: { scale: number; disabled?: boolean }) {
  const [selected, setSelected] = useState(2)
  const [focused, setFocused] = useState(false)
  const [offset, setOffset] = useState(0)
  const id = useId()
  const list = useRef<HTMLDivElement>(null)
  const select = (index: number) => {
    const next = Math.max(0, Math.min(dialogFiles.length - 1, index))
    setSelected(next)
    const left = Math.floor(next / rows) * columnWidth
    const right = left + columnWidth
    setOffset(value => Math.max(0, Math.min(maxOffset, left < value ? left : right > value + viewport.width ? right - viewport.width : value)))
  }
  useEffect(() => {
    const element = list.current!
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || disabled) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.width : 1 / scale
      setOffset(value => Math.max(0, Math.min(maxOffset, Math.round(value + (event.deltaX || event.deltaY) * unit))))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [scale, disabled])
  return <article className="sample-card">
    <h3>File list · columns and horizontal scrolling</h3>
    <div className="sample-stage">
      <div className="file-list-preview" style={{ width: width * scale, height: height * scale }}>
        <div aria-hidden="true"><PixelPreview scale={scale} sample={{ id: 'dialog-column-list', title: 'File dialog list view',
          detail: 'Small icons, column-major layout and filename selection', width, height, draw: context => {
            const p = createCollectionPainter(context)
            p.pane({ x: 0, y: 0, width, height })
            p.columnList(viewport, dialogFiles, columnWidth, offset, selected, focused && !disabled, !disabled)
          } }} /></div>
        <div ref={list} id={id} role="listbox" className="file-list-hit-area" tabIndex={disabled ? -1 : 0} aria-disabled={disabled} aria-label="File dialog files"
          aria-activedescendant={`${id}-${selected}`} style={{ left: 2 * scale, top: 2 * scale, width: viewport.width * scale, height: viewport.height * scale }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onClick={event => {
            if (disabled) return
            const bounds = event.currentTarget.getBoundingClientRect()
            const x = (event.clientX - bounds.left) / scale + offset
            const row = Math.floor((event.clientY - bounds.top) / scale / 16)
            const column = Math.floor(x / columnWidth)
            const index = column * rows + row
            if (row < rows && dialogFiles[index] && x % columnWidth < measureBitmapText(dialogFiles[index].label) + 20) select(index)
            event.currentTarget.focus()
          }}
          onKeyDown={event => {
            if (disabled) return
            const movement: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -rows, ArrowRight: rows, PageUp: -rows, PageDown: rows }
            if (event.key in movement || event.key === 'Home' || event.key === 'End') {
              event.preventDefault()
              select(event.key === 'Home' ? 0 : event.key === 'End' ? dialogFiles.length - 1 : selected + movement[event.key])
            }
          }}>
          {dialogFiles.map((item, index) => <span key={item.label} id={`${id}-${index}`} className="visually-hidden" role="option" aria-selected={index === selected}>{item.label}</span>)}
        </div>
        <div style={{ position: 'absolute', left: 2 * scale, top: (height - 18) * scale }}>
          <Scrollbar orientation="horizontal" length={viewport.width} total={totalWidth} page={viewport.width} value={offset} onChange={setOffset} scale={scale} controls={id} disabled={disabled} />
        </div>
      </div>
    </div>
    <div className="sample-caption"><span>Click a file, use arrow keys, or scroll horizontally.</span></div>
  </article>
}
