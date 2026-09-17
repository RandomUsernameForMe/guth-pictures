"use client";
import React, { type CSSProperties } from 'react'

export const AScrim = ({ topOpacity = 0.55, bottomOpacity = 0.92 }: { topOpacity?: number; bottomOpacity?: number }) => (
  <>
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
      background: `linear-gradient(180deg, rgba(0,0,0,${topOpacity}) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.25) 65%, rgba(10,10,11,${bottomOpacity}) 100%)`,
    }} />
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, mixBlendMode: 'multiply',
      background: 'linear-gradient(0deg, rgba(90,48,25,0.10), rgba(90,48,25,0.10))',
    }} />
  </>
)

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`

export const AGrain = ({ opacity = 0.06 }: { opacity?: number }) => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity, zIndex: 5,
    backgroundImage: GRAIN_SVG,
    backgroundSize: '220px 220px',
  }} />
)

export const AMono = ({
  children,
  color = 'rgba(242,240,235,0.65)',
  size = 18,
  tracking = '0.22em',
  weight = 400,
  style,
}: {
  children: React.ReactNode
  color?: string
  size?: number
  tracking?: string
  weight?: number
  style?: CSSProperties
}) => (
  <span style={{
    fontFamily: 'var(--story-font-mono)',
    fontSize: size,
    letterSpacing: tracking,
    textTransform: 'uppercase',
    color,
    fontWeight: weight,
    ...style,
  }}>{children}</span>
)

export const ARule = ({ w = 80, color = 'rgba(242,240,235,0.35)', style }: { w?: number; color?: string; style?: CSSProperties }) => (
  <div style={{ width: w, height: 1, background: color, flexShrink: 0, ...style }} />
)
