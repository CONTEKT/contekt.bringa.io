"use client"

import { useEffect, useState } from "react"

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * has elapsed without a change. Used to avoid firing a query on every
 * keystroke in search inputs.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(timeout)
  }, [value, delayMs])

  return debouncedValue
}
