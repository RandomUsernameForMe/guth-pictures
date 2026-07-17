"use client";
import { useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export const FPS = 24
const BITRATE = 8_000_000

export function useExport() {
  const abortRef = useRef(false)

  const exportVideo = useCallback(async (
    element: HTMLElement,
    durationMs: number,
    onProgress?: (pct: number) => void,
    onFrameStart?: (frameIndex: number) => Promise<void>,
  ): Promise<Blob> => {
    abortRef.current = false

    const width = element.offsetWidth
    const height = element.offsetHeight

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width, height },
      fastStart: 'in-memory',
    })

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: e => { throw e },
    })

    encoder.configure({
      codec: 'avc1.4d002a', // H.264 High Profile level 4.2
      width,
      height,
      bitrate: BITRATE,
      framerate: FPS,
    })

    const frameDuration = 1_000_000 / FPS // microseconds per frame
    const totalFrames = Math.ceil(durationMs / 1000 * FPS)
    let frameIndex = 0

    while (!abortRef.current && frameIndex < totalFrames) {
      onProgress?.(frameIndex / totalFrames)

      await onFrameStart?.(frameIndex)

      const snap = await html2canvas(element, {
        width,
        height,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#0A0A0B',
      })

      const timestamp = Math.round(frameIndex * frameDuration)
      const frame = new VideoFrame(snap, { timestamp })
      encoder.encode(frame, { keyFrame: frameIndex % (FPS * 2) === 0 })
      frame.close()

      frameIndex++
    }

    await encoder.flush()
    muxer.finalize()

    const { buffer } = muxer.target
    return new Blob([buffer], { type: 'video/mp4' })
  }, [])

  const abort = useCallback(() => { abortRef.current = true }, [])

  return { exportVideo, abort }
}
