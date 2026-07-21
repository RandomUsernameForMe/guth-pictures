"use client";
import { useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export const FPS = 24
const BITRATE = 8_000_000
const TAIL_MS = 800
const FADE_MS = 800
const ZOOM = 0.04

// cubic-bezier(0.25, 0.46, 0.45, 0.94) je standardní easeOutQuad
const ease = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return 1 - (1 - t) * (1 - t)
}

export interface ExportOptions {
  slideCount: number
  photoCount: number
  slideDurationMs: number
  /** Přepne skrytý export DOM na daný slide a počká na paint. */
  setSlide: (i: number) => Promise<void>
  onProgress?: (pct: number) => void
}

export function useExport() {
  const abortRef = useRef(false)

  const exportVideo = useCallback(async (
    element: HTMLElement,
    { slideCount, photoCount, slideDurationMs, setSlide, onProgress }: ExportOptions,
  ): Promise<Blob> => {
    abortRef.current = false

    const width = element.offsetWidth
    const height = element.offsetHeight

    // ── Fáze 1: html2canvas jen slideCount× (fotka + overlay zvlášť),
    // animace se pak interpolují na canvasu — ne per-frame capture DOM.
    const photoSnaps: HTMLCanvasElement[] = []
    const overlaySnaps: HTMLCanvasElement[] = []
    for (let i = 0; i < slideCount && !abortRef.current; i++) {
      await setSlide(i)
      const photoLayer = element.querySelector<HTMLElement>('[data-photo-layer]')
      if (!photoLayer) throw new Error('Missing [data-photo-layer] in export DOM')

      photoSnaps.push(await html2canvas(photoLayer, {
        width, height, scale: 1, useCORS: true, allowTaint: true, logging: false,
        backgroundColor: '#0A0A0B',
      }))

      // overlay (scrim, texty, grain) s průhledným pozadím — fotka skrytá.
      // Úpravy jen v klonu: skrýt fotku a zprůhlednit opaque pozadí template
      // rootu, jinak by overlay v kompozici překryl fotky.
      overlaySnaps.push(await html2canvas(element, {
        width, height, scale: 1, useCORS: true, allowTaint: true, logging: false,
        backgroundColor: null,
        onclone: (doc, cloned) => {
          // Zmrazit CSS animace (wordIn ap.) — jinak se zachytí rozjetý
          // stav s poloprůhledným textem místo ustáleného.
          const freeze = doc.createElement('style')
          freeze.textContent = '* { animation: none !important; transition: none !important; }'
          doc.head.appendChild(freeze)
          const layer = cloned.querySelector<HTMLElement>('[data-photo-layer]')
          if (layer) {
            layer.style.visibility = 'hidden'
            if (layer.parentElement) layer.parentElement.style.background = 'transparent'
          }
        },
      }))

      onProgress?.((i + 1) / slideCount * 0.5)
    }

    // ── Fáze 2: kompozice framů na canvasu + encode
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
      codec: 'avc1.4d002a', // H.264 Main Profile level 4.2
      width,
      height,
      bitrate: BITRATE,
      framerate: FPS,
    })

    // Když po sobě jdoucí slidy sdílí stejnou fotku (šablona D, míň fotek než
    // slov), zoom pokračuje plynule — stejně jako CSS transition v náhledu.
    const zoomStart: number[] = []
    const photoIdx = (s: number) => s % photoCount
    for (let s = 0; s < slideCount; s++) {
      const samePhotoAsPrev = s > 0 && photoIdx(s) === photoIdx(s - 1)
      zoomStart[s] = samePhotoAsPrev ? zoomStart[s - 1] : s * slideDurationMs
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    const draw = (img: CanvasImageSource, scale: number, alpha: number) => {
      ctx.globalAlpha = alpha
      const dw = width * scale
      const dh = height * scale
      ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh)
    }

    const frameDuration = 1_000_000 / FPS // mikrosekundy na frame
    const totalMs = slideDurationMs * slideCount + TAIL_MS
    const totalFrames = Math.ceil(totalMs / 1000 * FPS)

    for (let frameIndex = 0; frameIndex < totalFrames && !abortRef.current; frameIndex++) {
      if (encoderError) throw encoderError

      const t = frameIndex / FPS * 1000
      const active = Math.min(Math.floor(t / slideDurationMs), slideCount - 1)
      const tSince = t - active * slideDurationMs
      const samePhoto = active > 0 && photoIdx(active) === photoIdx(active - 1)
      const fade = active === 0 || samePhoto ? 1 : ease(tSince / FADE_MS)

      ctx.globalAlpha = 1
      ctx.fillStyle = '#0A0A0B'
      ctx.fillRect(0, 0, width, height)
      if (fade < 1) draw(photoSnaps[active - 1], 1, 1 - fade)
      const zoom = 1 + ZOOM * ease((t - zoomStart[active]) / (slideDurationMs + TAIL_MS))
      draw(photoSnaps[active], zoom, fade)
      ctx.globalAlpha = 1
      ctx.drawImage(overlaySnaps[active], 0, 0)

      const frame = new VideoFrame(canvas, { timestamp: Math.round(frameIndex * frameDuration) })
      encoder.encode(frame, { keyFrame: frameIndex % (FPS * 2) === 0 })
      frame.close()

      if (encoder.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 0))
      onProgress?.(0.5 + 0.5 * (frameIndex + 1) / totalFrames)
    }

    await encoder.flush()
    if (encoderError) throw encoderError
    muxer.finalize()

    const { buffer } = muxer.target
    return new Blob([buffer], { type: 'video/mp4' })
  }, [])

  const abort = useCallback(() => { abortRef.current = true }, [])

  return { exportVideo, abort }
}
