import { useEffect, useRef, useCallback } from 'react'

type EventType = 'tab_switch' | 'tab_return' | 'fullscreen_exit' | 'devtools_open'

export function useProctoring(
  onEvent: (type: EventType, detail?: string) => void,
  active: boolean = false
) {
  const wasHidden = useRef(false)
  const devtoolsOpen = useRef(false)

  const requestFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    if (!active) return

    // Tab visibility change
    const handleVisibility = () => {
      if (document.hidden) {
        wasHidden.current = true
        onEvent('tab_switch')
      } else if (wasHidden.current) {
        wasHidden.current = false
        onEvent('tab_return')
      }
    }

    // Fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onEvent('fullscreen_exit')
      }
    }

    // DevTools detection (resize-based heuristic)
    const handleResize = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160
      const heightThreshold = window.outerHeight - window.innerHeight > 160
      if ((widthThreshold || heightThreshold) && !devtoolsOpen.current) {
        devtoolsOpen.current = true
        onEvent('devtools_open')
      } else if (!widthThreshold && !heightThreshold) {
        devtoolsOpen.current = false
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('resize', handleResize)
    }
  }, [active, onEvent])

  return { requestFullscreen }
}
