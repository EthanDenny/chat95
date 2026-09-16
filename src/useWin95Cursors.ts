import { useEffect } from 'react'
import hotspots from './cursorHotspots.json'

const names = ['arrow', 'ibeam', 'sizewe', 'sizens', 'sizenwse', 'sizenesw', 'no'] as const
let images: Promise<HTMLImageElement[]> | undefined

export function useWin95Cursors(scale: number) {
  const density = window.devicePixelRatio
  useEffect(() => {
    let mounted = true
    images ??= Promise.all(names.map(async name => {
      const image = new Image()
      image.src = `/cursors/${name}.png`
      await image.decode()
      return image
    }))
    // Keep source pixels whole and stay within the browser's 128 CSS-pixel limit.
    const pixelScale = Math.max(1, Math.min(Math.round(scale * density), Math.floor(128 * density / 32)))
    images.then(loaded => {
      if (!mounted) return
      loaded.forEach((image, index) => {
        const name = names[index]
        const cursor = document.createElement('canvas')
        cursor.width = image.width * pixelScale
        cursor.height = image.height * pixelScale
        const context = cursor.getContext('2d')!
        context.imageSmoothingEnabled = false
        context.drawImage(image, 0, 0, cursor.width, cursor.height)
        const x = hotspots[name].x * pixelScale / density
        const y = hotspots[name].y * pixelScale / density
        const fallback = { arrow: 'default', ibeam: 'text', sizewe: 'ew-resize', sizens: 'ns-resize', sizenwse: 'nwse-resize', sizenesw: 'nesw-resize', no: 'not-allowed' }[name]
        // Supply an image at physical resolution so Retina never smooths the bitmap.
        document.documentElement.style.setProperty(`--win95-${name}`, `image-set(url("${cursor.toDataURL()}") ${density}x) ${x} ${y}, url("/cursors/${name}.cur"), ${fallback}`)
      })
    }).catch(console.error)
    return () => { mounted = false }
  }, [scale, density])
}
