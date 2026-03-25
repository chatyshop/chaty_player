/**
 * ChatyPlayer v1.0
 * Secure Config Parser (Production Ready)
 * ----------------------------------------
 * - Strict TypeScript safe
 * - SSR safe
 * - Sanitized inputs
 * - XSS safe URL handling
 * - Defaults applied
 * - Optional plugin support
 * - Thumbnail sprite support
 * - Multi-quality source support
 * - Chapter support
 */

import type { PlayerFeature } from '../types/Feature'

/* =========================================
   Video Source Definition
========================================= */

export interface VideoSource {
  src: string
  label: string
  type?: string
}

/* =========================================
   Thumbnail Sprite Configuration
========================================= */

export interface ThumbnailConfig {
  src: string
  width: number
  height: number
  columns: number
  rows: number
  interval: number
}

/* =========================================
   Chapter Definition
========================================= */

export interface Chapter {
  time: number
  title: string
}


export interface SubtitleTrack {
  src: string
  label: string
  srclang: string
  default?: boolean
}

/* =========================================
   Player Configuration
========================================= */

export interface PlayerConfig {

  src?: string
  mp4?: string
  webm?: string
  ogg?: string

  sources?: VideoSource[]

  subtitles?: SubtitleTrack[]

  poster?: string

  autoplay: boolean
  loop: boolean
  muted: boolean
  preload: 'none' | 'metadata' | 'auto'

  accentColor?: string

  thumbnails?: ThumbnailConfig

  features?: PlayerFeature[]

  chapters?: Chapter[]
}

/* =========================================
   Defaults
========================================= */

const DEFAULT_CONFIG: Omit<
  PlayerConfig,
  | 'src'
  | 'mp4'
  | 'webm'
  | 'ogg'
  | 'sources'
  | 'poster'
  | 'accentColor'
  | 'features'
  | 'thumbnails'
  | 'chapters'
> = {
  autoplay: false,
  loop: false,
  muted: false,
  preload: 'metadata'
}

/* =========================================
   Boolean Parser
========================================= */

function parseBoolean(value?: string): boolean {
  return value === 'true' || value === '1'
}

/* =========================================
   Number Parser
========================================= */

function parseNumber(value?: string): number | undefined {

  if (!value) return undefined

  const num = Number(value)

  if (!Number.isFinite(num)) return undefined

  return num
}

/* =========================================
   Preload Validator
========================================= */

function parsePreload(value?: string): 'none' | 'metadata' | 'auto' {

  if (value === 'none' || value === 'auto') return value

  return 'metadata'
}

/* =========================================
   Safe URL Sanitizer
========================================= */

function sanitizeURL(url?: string): string | undefined {

  if (!url) return undefined

  try {

    const base =
      typeof window !== 'undefined'
        ? window.location.href
        : 'http://localhost'

    const parsed = new URL(url, base)

    const allowedProtocols = ['http:', 'https:', 'blob:', 'data:']

    if (!allowedProtocols.includes(parsed.protocol)) {

      console.warn(
        '[ChatyPlayer] Blocked unsafe URL protocol:',
        parsed.protocol
      )

      return undefined
    }

    return parsed.href

  } catch {

    return undefined

  }

}

/* =========================================
   Safe CSS Color Validation
========================================= */

function sanitizeColor(value?: string): string | undefined {

  if (!value) return undefined

  const isHex = /^#([0-9A-Fa-f]{3}){1,2}$/.test(value)
  const isRgb = /^rgba?\((\s*\d+\s*,){2,3}\s*[\d\.]+\s*\)$/.test(value)

  return isHex || isRgb ? value : undefined
}

/* =========================================
   Thumbnail Parser
========================================= */

function parseThumbnails(dataset: DOMStringMap): ThumbnailConfig | undefined {

  const src = sanitizeURL(dataset.thumbnails)

  if (!src) return undefined

  const width = parseNumber(dataset.thumbWidth)
  const height = parseNumber(dataset.thumbHeight)
  const columns = parseNumber(dataset.thumbColumns)
  const rows = parseNumber(dataset.thumbRows)
  const interval = parseNumber(dataset.thumbInterval)

  if (!width || !height || !columns || !rows || !interval) {

    console.warn('[ChatyPlayer] Invalid thumbnail configuration.')

    return undefined
  }

  return {
    src,
    width,
    height,
    columns,
    rows,
    interval
  }
}

/* =========================================
   Multi-Quality Sources Parser
========================================= */

function parseSources(dataset: DOMStringMap): VideoSource[] | undefined {

  if (!dataset.sources) return undefined

  try {

    const raw = JSON.parse(dataset.sources)

    if (!Array.isArray(raw)) return undefined

    const sources: VideoSource[] = []

    for (const item of raw) {

      if (!item || typeof item !== 'object') continue

      const src = sanitizeURL(item.src)

      if (!src) continue

      const label =
        typeof item.label === 'string'
          ? item.label
          : ''

      if (!label) continue

      const type =
        typeof item.type === 'string'
          ? item.type
          : undefined

      sources.push({ src, label, type })

    }

    return sources.length ? sources : undefined

  } catch {

    console.warn('[ChatyPlayer] Invalid sources configuration.')

    return undefined

  }

}

/* =========================================
   Chapters Parser
========================================= */

function parseChapters(dataset: DOMStringMap): Chapter[] | undefined {

  if (!dataset.chapters) return undefined

  try {

    const raw = JSON.parse(dataset.chapters)

    if (!Array.isArray(raw)) return undefined

    const chapters: Chapter[] = []

    for (const item of raw) {

      if (!item || typeof item !== 'object') continue

      const time =
        typeof item.time === 'number'
          ? item.time
          : undefined

      const title =
        typeof item.title === 'string'
          ? item.title
          : ''

      if (time === undefined || !title) continue

      chapters.push({ time, title })

    }

    return chapters.length ? chapters : undefined

  } catch {

    console.warn('[ChatyPlayer] Invalid chapters configuration.')

    return undefined

  }

}


/* =========================================
   Subtitle Parser
========================================= */

function parseSubtitles(dataset: DOMStringMap): SubtitleTrack[] | undefined {
  if (!dataset.subtitles) return undefined

  try {
    const raw = JSON.parse(dataset.subtitles)
    if (!Array.isArray(raw)) return undefined

    const tracks = raw
      .map((item: any): SubtitleTrack | null => {
        const src = sanitizeURL(item?.src)
        if (!src) return null

        const label =
          typeof item?.label === 'string' ? item.label : ''

        const srclang =
          typeof item?.srclang === 'string' ? item.srclang : ''

        if (!label || !srclang) return null

        return {
          src,
          label,
          srclang,
          default: Boolean(item?.default)
        }
      })
      // 🔥 Type-safe filter (fixes your error)
      .filter((item): item is SubtitleTrack => item !== null)

    return tracks.length ? tracks : undefined

  } catch {
    console.warn('[ChatyPlayer] Invalid subtitles config')
    return undefined
  }
}

/* =========================================
   Parse Config From Dataset
========================================= */

export function parseConfig(container: HTMLElement): PlayerConfig {

  if (!(container instanceof HTMLElement)) {

    throw new Error('[ChatyPlayer] Invalid container element.')

  }

  const dataset = Object.assign({}, container.dataset)

  const thumbnails = parseThumbnails(dataset)
  const subtitles = parseSubtitles(dataset)
  const sources = parseSources(dataset)
  const chapters = parseChapters(dataset)

  const config: PlayerConfig = {

    ...DEFAULT_CONFIG,

    src: sanitizeURL(dataset.src),
    mp4: sanitizeURL(dataset.mp4),
    webm: sanitizeURL(dataset.webm),
    ogg: sanitizeURL(dataset.ogg),

    sources,
    subtitles,
    poster: sanitizeURL(dataset.poster),

    autoplay: parseBoolean(dataset.autoplay),
    loop: parseBoolean(dataset.loop),
    muted: parseBoolean(dataset.muted),

    preload: parsePreload(dataset.preload),

    accentColor: sanitizeColor(dataset.color),

    thumbnails,

    chapters

  }

  if (
    !config.src &&
    !config.mp4 &&
    !config.webm &&
    !config.ogg &&
    !config.sources
  ) {

    console.warn('[ChatyPlayer] No valid video source provided.')

  }

  return config

}