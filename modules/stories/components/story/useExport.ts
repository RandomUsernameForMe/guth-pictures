"use client";
import { useRef, useCallback } from 'react'
import html2canvas from 'html2canvas-pro'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export const FPS = 24
const BITRATE = 8_000_000
const FADE_FRAMES = Math.round(0.8 * FPS) // ~19 frames = 800ms

// cubic-bezier(0.25, 0.46, 0.45, 0.94) je standardní easeOutQuad — stejná
// křivka jako CSS transition v náhledu
const ease = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return 1 - (1 - t) * (1 - t)
}

export type ExportLayer = 'photo' | 'overlay' | 'word'

interface ExportOptions {
  element: HTMLElement
  width: number
  height: number
  slideCount: number
  slideDurationMs: number
  hasWordLayer?: boolean // true for Template D
  onProgress?: (pct: number) => void
  onLayerReady?: (slideIndex: number, layer: ExportLayer) => Promise<void>
}

function captureLayer(element: HTMLElement, width: number, height: number, transparent: boolean) {
  return html2canvas(element, {
    width,
    height,
    scale: 1,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: transparent ? null : '#0A0A0B',
  })
}

export function useExport() {
  const abortRef = useRef(false)

  const exportVideo = useCallback(async ({
    element,
    width,
    height,
    slideCount,
    slideDurationMs,
    hasWordLayer = false,
    onProgress,
    onLayerReady,
  }: ExportOptions): Promise<Blob> => {
    abortRef.current = false

    // Phase 1: pre-render each slide
    const photoCanvases: HTMLCanvasElement[] = []
    const overlayCanvases: HTMLCanvasElement[] = []
    const wordCanvases: HTMLCanvasElement[] = []

    const capturesPerSlide = hasWordLayer ? 3 : 2
    for (let i = 0; i < slideCount; i++) {
      if (abortRef.current) break
      onProgress?.(i / slideCount * 0.4)

      await onLayerReady?.(i, 'photo')
      photoCanvases.push(await captureLayer(element, width, height, false))

      await onLayerReady?.(i, 'overlay')
      overlayCanvases.push(await captureLayer(element, width, height, true))

      if (hasWordLayer) {
        await onLayerReady?.(i, 'word')
        wordCanvases.push(await captureLayer(element, width, height, true))
      }
    }

    // Phase 2: composite frames + encode
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width, height },
      fastStart: 'in-memory',
    })

    let encoderError: Error | null = null
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: e => { encoderError = e },
    })

    encoder.configure({
      codec: 'avc1.4d002a',
      width,
      height,
      bitrate: BITRATE,
      framerate: FPS,
    })

    const frameDuration = 1_000_000 / FPS
    const framesPerSlide = Math.round(slideDurationMs / 1000 * FPS)
    const totalFrames = Math.ceil((slideDurationMs * slideCount + 800) / 1000 * FPS)

    const offscreen = new OffscreenCanvas(width, height)
    const ctx = offscreen.getContext('2d')!

    for (let fi = 0; !abortRef.current && fi < totalFrames; fi++) {
      if (encoderError) throw encoderError
      onProgress?.(0.4 + fi / totalFrames * 0.6)

      const slide = Math.min(Math.floor(fi / framesPerSlide), slideCount - 1)
      const frameInSlide = fi - slide * framesPerSlide
      const prev = Math.max(slide - 1, 0)

      const fade = slide === 0 ? 1 : ease(frameInSlide / FADE_FRAMES)
      const kbScale = 1.00 + 0.04 * ease(frameInSlide / Math.max(framesPerSlide - 1, 1))

      // Black base
      ctx.fillStyle = '#0A0A0B'
      ctx.fillRect(0, 0, width, height)

      // Prev photo fading out at scale 1.04
      if (slide > 0 && fade < 1) {
        const s = 1.04
        ctx.globalAlpha = 1 - fade
        ctx.drawImage(photoCanvases[prev],
          -(width * (s - 1)) / 2, -(height * (s - 1)) / 2,
          width * s, height * s)
      }

      // Current photo with Ken Burns
      ctx.globalAlpha = fade
      ctx.drawImage(photoCanvases[slide],
        -(width * (kbScale - 1)) / 2, -(height * (kbScale - 1)) / 2,
        width * kbScale, height * kbScale)

      // Prev overlay fading out
      if (slide > 0 && fade < 1) {
        ctx.globalAlpha = 1 - fade
        ctx.drawImage(overlayCanvases[prev], 0, 0, width, height)
      }

      // Current overlay fading in
      ctx.globalAlpha = fade
      ctx.drawImage(overlayCanvases[slide], 0, 0, width, height)

      ctx.globalAlpha = 1

      // Word animation (Template D only)
      if (hasWordLayer && wordCanvases.length > 0) {
        const WORD_OFFSET = 28 // px, matches wordIn translateY

        // Prev word: fade out + move up
        if (slide > 0 && fade < 1) {
          const blur = (8 * fade).toFixed(1)
          ctx.filter = `blur(${blur}px)`
          ctx.save()
          ctx.globalAlpha = 1 - fade
          ctx.translate(0, -WORD_OFFSET * fade)
          ctx.drawImage(wordCanvases[prev], 0, 0, width, height)
          ctx.restore()
          ctx.filter = 'none'
        }

        // Current word: fade in + move up from below
        const blur = (8 * (1 - fade)).toFixed(1)
        ctx.filter = `blur(${blur}px)`
        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(0, WORD_OFFSET * (1 - fade))
        ctx.drawImage(wordCanvases[slide], 0, 0, width, height)
        ctx.restore()
        ctx.filter = 'none'
      }

      const bitmap = offscreen.transferToImageBitmap()
      const frame = new VideoFrame(bitmap, { timestamp: Math.round(fi * frameDuration) })
      encoder.encode(frame, { keyFrame: fi % (FPS * 2) === 0 })
      frame.close()
      bitmap.close()

      if (encoder.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 0))
    }

    await encoder.flush()
    if (encoderError) throw encoderError
    muxer.finalize()

    return new Blob([muxer.target.buffer], { type: 'video/mp4' })
  }, [])

  const abort = useCallback(() => { abortRef.current = true }, [])

  return { exportVideo, abort }
}
