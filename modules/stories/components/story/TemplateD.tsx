"use client";
import { AScrim, AGrain, AMono, ARule } from './primitives'
import { PhotoCycle } from './PhotoCycle'
import { useTick } from './useTick'
import type { Photo } from './types'

interface Props {
  photos: Photo[]
  duration: number
  paused: boolean
  lang: 'cs' | 'en'
  words: string[]
  subHeadline: string
  chrome?: boolean
  scale?: number
  exportTick?: number
}

export function TemplateD({ photos, duration, paused, lang, words, subHeadline, chrome = false, scale = 1, exportTick }: Props) {
  const cs = lang === 'cs'
  const count = Math.max(words.length, 1)
  const tick = useTick(count, duration, paused || photos.length < 1, exportTick)

  const px = (n: number) => n * scale

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#0A0A0B',
      overflow: 'hidden',
      fontFamily: 'var(--story-font-sans)',
    }}>
      <PhotoCycle photos={photos} duration={duration} paused={paused} forceIndex={exportTick} />
      <AScrim topOpacity={0.65} bottomOpacity={0.92} />

      {chrome && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: `${px(32)}px ${px(36)}px 0` }}>
          <div style={{ display: 'flex', gap: px(6), marginBottom: px(24) }}>
            {Array.from({ length: count }).map((_, idx) => (
              <div key={idx} style={{ flex: 1, height: px(4), borderRadius: px(2), background: 'rgba(255,255,255,0.30)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,255,255,0.95)',
                  transform: `scaleX(${idx < tick ? 1 : idx === tick ? 1 : 0})`,
                  transformOrigin: 'left',
                  transition: idx === tick ? `transform ${duration}ms linear` : 'transform 200ms',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: px(14) }}>
            <div style={{ width: px(56), height: px(56), borderRadius: 999, background: 'linear-gradient(180deg,#1E1E23,#0A0A0B)', border: `${px(1.5)}px solid rgba(255,255,255,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2F0EB', fontSize: px(22), fontWeight: 700 }}>G</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: px(2) }}>
              <span style={{ color: '#F2F0EB', fontSize: px(20), fontWeight: 600 }}>guthpictures</span>
              <span style={{ color: 'rgba(242,240,235,0.7)', fontSize: px(16) }}>1h</span>
            </div>
          </div>
        </div>
      )}

      {/* Top brand cluster */}
      <div style={{
        position: 'absolute',
        left: px(80), right: px(80),
        top: chrome ? px(200) : px(140),
        zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: px(22),
      }}>
        <AMono size={px(24)} tracking="0.34em" color="#F2F0EB" weight={500}>GUTH&nbsp;&nbsp;PICTURES</AMono>
        <ARule w={px(72)} color="#C8A96E" />
      </div>

      {/* Center flashing word */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <h1
          key={tick}
          style={{
            margin: 0,
            fontSize: px(216), fontWeight: 700, lineHeight: 0.9,
            letterSpacing: '-0.04em', color: '#F2F0EB',
            textAlign: 'center', padding: `0 ${px(60)}px`,
            animation: 'wordIn 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {words[tick % words.length] || (cs ? 'Portréty.' : 'Portraits.')}
        </h1>
      </div>

      {/* Bottom block */}
      <div style={{
        position: 'absolute',
        left: px(80), right: px(80),
        bottom: px(200),
        zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(24),
      }}>
        <h2 style={{
          margin: 0,
          fontSize: px(44), fontWeight: 500,
          color: 'rgba(242,240,235,0.90)',
          textAlign: 'center', lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          {subHeadline || (cs ? 'Silná atmosféra. Osobité portréty.' : 'Strong atmosphere. Distinctive portraits.')}
        </h2>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: px(14),
          padding: `${px(24)}px ${px(36)}px`,
          background: '#C8A96E', color: '#0A0A0B',
          borderRadius: px(14),
          fontSize: px(24), fontWeight: 600,
        }}>
          {cs ? 'Chci fotky' : 'Book a shoot'} →
        </div>
        <AMono size={px(16)} color="rgba(242,240,235,0.55)">guthpictures.eu</AMono>
      </div>

      <AGrain />
    </div>
  )
}
