'use client'

import { useEffect, useRef, useCallback } from 'react'

// How often to re-ping while the tab stays open (ms)
const INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

// Selectors whose clicks count as "meaningful activity"
// Add or remove selectors to match your nav / sidebar elements
const ACTIVITY_SELECTORS = [
  'a[href]',
  'button',
  '[data-track]',
]

async function ping() {
  try {
    await fetch('/api/ping', { method: 'POST' })
  } catch {
    // Silently swallow network errors — this is best-effort telemetry
  }
}

/**
 * Drop <ActivityTracker /> anywhere inside your authenticated layout.
 * It fires silently in the background and never renders anything visible.
 *
 * What it tracks:
 *   • Page load / mount
 *   • Every 5 minutes while the tab is open
 *   • Clicks on links, buttons, and [data-track] elements
 *   • Tab becoming visible again after being hidden
 */
export default function ActivityTracker() {
  const lastPing = useRef<number>(0)

  const maybePing = useCallback(() => {
    const now = Date.now()
    // Debounce: don't ping more than once per minute from click events
    if (now - lastPing.current < 60_000) return
    lastPing.current = now
    ping()
  }, [])

  useEffect(() => {
    // 1. Ping immediately on mount
    lastPing.current = Date.now()
    ping()

    // 2. Ping on a regular interval
    const interval = setInterval(ping, INTERVAL_MS)

    // 3. Ping when the tab comes back into focus
    const onVisible = () => {
      if (document.visibilityState === 'visible') maybePing()
    }
    document.addEventListener('visibilitychange', onVisible)

    // 4. Ping on meaningful clicks (bubbled up from anywhere in the doc)
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element
      const matched = ACTIVITY_SELECTORS.some(sel => target.closest(sel))
      if (matched) maybePing()
    }
    document.addEventListener('click', onClick, { passive: true })

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      document.removeEventListener('click', onClick)
    }
  }, [maybePing])

  // Renders nothing
  return null
}