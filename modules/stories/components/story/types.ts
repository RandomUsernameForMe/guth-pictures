export interface Photo {
  url: string
  x: number // object-position x, 0-100
  y: number // object-position y, 0-100
}

export interface AppState {
  template: 'C' | 'D'
  lang: 'cs' | 'en'
  duration: number
  headline: string
  sub: string
  words: string[]
  subHeadline: string
  chrome: boolean
  photos: Photo[]
  paused: boolean
  exporting: boolean
}
