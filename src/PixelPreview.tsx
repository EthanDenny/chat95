import { useLayoutEffect, useRef } from 'react'
import type { Sample } from './designSamples'
import { iconsReady } from './kitIcons'

export function PixelPreview({ sample, scale }: { sample: Sample; scale: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { width, height, draw } = sample
  useLayoutEffect(() => {
    const context = canvas.current!.getContext('2d', { alpha: false })!
    context.imageSmoothingEnabled = false
    draw(context)
    let mounted = true
    iconsReady.then(() => { if (mounted) draw(context) }).catch(console.error)
    return () => { mounted = false }
  }, [draw])
  useLayoutEffect(() => {
    const element = canvas.current!
    const align = () => {
      const bounds = element.parentElement!.getBoundingClientRect()
      const density = window.devicePixelRatio
      const x = Math.round(bounds.x * density) / density - bounds.x
      const y = Math.round(bounds.y * density) / density - bounds.y
      element.style.transform = `translate(${x}px, ${y}px)`
    }
    align()
    window.addEventListener('resize', align)
    return () => window.removeEventListener('resize', align)
  }, [width, height, scale])
  return <div className="pixel-preview" style={{ width: width * scale, height: height * scale }}>
    <canvas ref={canvas} width={width} height={height} style={{ width: width * scale, height: height * scale }} role="img" aria-label={`${sample.title}: ${sample.detail}`} />
  </div>
}
