"use client";
import { useState, useEffect } from 'react'

export function useTick(count: number, duration: number, paused: boolean, forcedValue?: number): number {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (paused || forcedValue !== undefined) return
    const t = setInterval(() => setI(v => (v + 1) % count), duration)
    return () => clearInterval(t)
  }, [count, duration, paused, forcedValue])
  return forcedValue !== undefined ? forcedValue % Math.max(count, 1) : i
}
