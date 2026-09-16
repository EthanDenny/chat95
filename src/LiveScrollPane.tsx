import { useEffect, useId, useRef, useState } from 'react'
import { createCollectionPainter } from './collectionControls'
import { Scrollbar } from './Scrollbar'
import { PixelPreview } from './PixelPreview'
import { palette } from './win95'


const names = ['Billboards', "Bobby's Stats", 'Business Unit', 'Color Samples', 'Extra Templates', 'Financial Statistics', 'Mailing Lists', 'Old Program Files', 'Quarterly Stats', 'Reviews', 'Rolling Account', 'Smith Project', 'Templates', 'Work in progress', 'Year-end reports']
const viewWidth = 220
const viewHeight = 128
const contentWidth = 340
const contentHeight = names.length * 16

export function LiveScrollPane({ scale }: { scale: number }) {
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const id = useId()
  const pane = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = pane.current!
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewHeight : 1 / scale
      setY(value => Math.max(0, Math.min(contentHeight - viewHeight, Math.round(value + (event.shiftKey ? 0 : event.deltaY) * unit))))
      setX(value => Math.max(0, Math.min(contentWidth - viewWidth, Math.round(value + (event.shiftKey ? event.deltaY : event.deltaX) * unit))))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [scale])
  return <article className="sample-card">
    <h3>Interactive · arrows, track and thumb</h3>
    <div className="sample-stage">
      <div ref={pane} className="live-scroll-pane" style={{ width: 240 * scale, height: 148 * scale }}>
        <div id={id}>
          <PixelPreview scale={scale} sample={{ id: 'live-scroll-content', title: 'Scrollable folder list', detail: `Horizontal position ${x}, vertical position ${y}`, width: 240, height: 148,
            draw: context => {
              const p = createCollectionPainter(context)
              p.pane({ x: 0, y: 0, width: 240, height: 148 })
              p.clip({ x: 2, y: 2, width: viewWidth, height: viewHeight }, () => names.forEach((name, index) => {
                const top = 2 + index * 16 - y
                p.icon('Folder', 4 - x, top, 16)
                p.text(name, 23 - x, top + 1)
                p.text('File Folder', 234 - x, top + 1)
              }))
              p.fill(222, 130, 16, 16, palette.silver)
            } }} />
        </div>
        <div style={{ position: 'absolute', left: 222 * scale, top: 2 * scale }}>
          <Scrollbar orientation="vertical" length={viewHeight} total={contentHeight} page={viewHeight} value={y} onChange={setY} scale={scale} controls={id} />
        </div>
        <div style={{ position: 'absolute', left: 2 * scale, top: 130 * scale }}>
          <Scrollbar orientation="horizontal" length={viewWidth} total={contentWidth} page={viewWidth} value={x} onChange={setX} scale={scale} controls={id} />
        </div>
      </div>
    </div>
    <div className="sample-caption"><span>Drag, click, use the wheel, or focus and use arrow keys.</span></div>
  </article>
}
