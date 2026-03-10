"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

/**
 * Web-side polling hook — detects remote changes and refreshes the page.
 * Used on cloud deployments when multiple devices might be editing.
 * Polls /api/sync/head to detect sequence number changes.
 */
export function useSyncPolling(options: {
  enabled?: boolean
  intervalMs?: number
} = {}) {
  const { enabled = true, intervalMs = 15000 } = options
  const router = useRouter()
  const lastSeqRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkForChanges = useCallback(async () => {
    try {
      const res = await fetch("/api/sync/head")
      if (!res.ok) return

      const data = await res.json()
      const serverSeq = data.serverSeq as number

      if (lastSeqRef.current !== null && serverSeq > lastSeqRef.current) {
        // Remote changes detected — refresh the page data
        router.refresh()
      }

      lastSeqRef.current = serverSeq
    } catch {
      // Network error — ignore, will retry on next interval
    }
  }, [router])

  useEffect(() => {
    if (!enabled) return

    // Initial check
    checkForChanges()

    // Poll on interval
    intervalRef.current = setInterval(checkForChanges, intervalMs)

    // Also check on window focus (user switches back to tab)
    const onFocus = () => checkForChanges()
    window.addEventListener("focus", onFocus)

    // Also check on visibility change (tab becomes visible)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForChanges()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [enabled, intervalMs, checkForChanges])
}
