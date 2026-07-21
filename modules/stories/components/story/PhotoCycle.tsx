"use client";
import { useState, useEffect } from 'react'
import type { Photo } from './types'

interface Props {
  photos: Photo[]
  duration: number
  paused: boolean
  onTick?: (i: number) => void
  forceIndex?: number
  isExportCapture?: boolean
}

export function PhotoCycle({ photos, duration, paused, onTick, forceIndex, isExportCapture }: Props) {
  const [i, setI] = useState(0)

  useEffect(() => { setI(0) }, [photos.length])

  useEffect(() => {
    if (paused || photos.length < 2 || forceIndex !== undefined) return
    const t = setInterval(() => setI(v => {
      const next = (v + 1) % photos.length
      onTick?.(next)
      return next
    }), duration)
    return () => clearInterval(t)
  }, [photos.length, duration, paused, onTick, forceIndex])

  const activeIndex = forceIndex !== undefined ? forceIndex % Math.max(photos.length, 1) : i

  // Export mode: jediný statický slide bez animací — fade/zoom interpoluje
  // useExport na canvasu ze snapshotů. data-photo-layer = kotva pro capture.
  if (forceIndex !== undefined && photos.length > 0) {
    const photo = photos[activeIndex]
    return (
      <div data-photo-layer="" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            width: '100%', height: '100%',
            backgroundImage: `url(${photo.url})`,
            backgroundSize: 'cover',
            backgroundPosition: `${photo.x}% ${photo.y}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: '#1E1E23',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(242,240,235,0.30)',
        fontFamily: 'var(--story-font-mono)',
        fontSize: 28,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        textAlign: 'center',
        padding: '0 80px',
      }}>
        Přidej<br />fotky
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {photos.map((photo, idx) => {
        const active = idx === activeIndex

        const opacity = active ? 1 : 0
        // Export capture: scale 1.00 (canvas compositing handles Ken Burns)
        // Normal: active photo zooms to 1.04 via CSS transition
        const transform = (isExportCapture || !active) ? 'scale(1.00)' : 'scale(1.04)'
        const transition = isExportCapture
          ? 'none'
          : active
            ? `opacity 800ms cubic-bezier(0.25,0.46,0.45,0.94), transform ${duration + 800}ms cubic-bezier(0.25,0.46,0.45,0.94)`
            : 'opacity 800ms cubic-bezier(0.25,0.46,0.45,0.94), transform 0ms'

        return (
          <div
            key={photo.url}
            style={{
              position: 'absolute', inset: 0,
              opacity,
              transform,
              transition,
              willChange: 'opacity, transform',
            }}
          >
            {/* div + background instead of img: html2canvas ignores object-fit, but honors background-size/position */}
            <div
              style={{
                width: '100%', height: '100%',
                backgroundImage: `url(${photo.url})`,
                backgroundSize: 'cover',
                backgroundPosition: `${photo.x}% ${photo.y}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
