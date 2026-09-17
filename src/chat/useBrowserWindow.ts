import { useEffect, useRef, useState } from 'react'

export function useBrowserWindow() {
  const [fullscreen, setFullscreen] = useState(() => !!document.fullscreenElement)
  const [error, setError] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    const update = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', update)
    return () => {
      document.removeEventListener('fullscreenchange', update)
      clearTimeout(closeTimer.current)
    }
  }, [])

  async function toggleFullscreen() {
    setError(null)
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      setError('This browser did not allow fullscreen. Use its own fullscreen command instead.')
    }
  }

  function closeTab() {
    setError(null)
    clearTimeout(closeTimer.current)
    window.close()
    // Browsers can silently refuse to close a tab that the page did not open.
    closeTimer.current = setTimeout(() => {
      if (!window.closed) setError('This browser blocked closing the tab. Use the browser’s Close Tab command instead.')
    }, 400)
  }

  return { fullscreen, fullscreenEnabled: document.fullscreenEnabled, toggleFullscreen, closeTab, error, dismissError: () => setError(null) }
}
