import { useEffect } from 'react'
import hotspots from './cursorHotspots.json'

const fallbacks = { arrow: 'default', ibeam: 'text', sizewe: 'ew-resize', sizens: 'ns-resize', sizenwse: 'nwse-resize', sizenesw: 'nesw-resize', no: 'not-allowed' }

export function useWin95Cursors(scale: number) {
  const density = window.devicePixelRatio
  useEffect(() => {
    // Whole physical pixels, within the browser's 128 CSS-pixel cursor limit.
    const pixelScale = Math.max(1, Math.min(16, Math.round(scale * density), Math.floor(128 * density / 32)))
    for (const name of Object.keys(fallbacks) as (keyof typeof fallbacks)[]) {
      const path = pixelScale === 1 ? `/cursors/${name}.png` : `/cursors/scaled/${name}-${pixelScale}.png`
      const x = hotspots[name].x * pixelScale / density
      const y = hotspots[name].y * pixelScale / density
      document.documentElement.style.setProperty(`--win95-${name}`, `image-set(url("${path}") ${density}x) ${x} ${y}, url("/cursors/${name}.cur"), ${fallbacks[name]}`)
    }
  }, [scale, density])
}
