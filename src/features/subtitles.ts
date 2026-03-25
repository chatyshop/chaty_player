/**
 * ChatyPlayer v2.0
 * Subtitles Feature (Production Ready - Final Stable)
 * subtitles.ts
 */

import type { Player } from '../core/Player'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'
import type { EventEmitter } from '../core/events'

export interface SubtitleTrackConfig {
  src: string
  label: string
  srclang: string
  default?: boolean
}

/* =========================================
   Safe URL Sanitizer
========================================= */

function sanitizeURL(url: string): string | null {
  try {
    const base =
      typeof window !== 'undefined'
        ? window.location.href
        : 'http://localhost'

    const parsed = new URL(url, base)

    if (!['http:', 'https:', 'blob:'].includes(parsed.protocol)) {
      console.warn('[ChatyPlayer] Blocked unsafe subtitle URL:', parsed.protocol)
      return null
    }

    return parsed.href
  } catch {
    return null
  }
}

/* ========================================= */

interface Cue {
  start: number
  end: number
  text: string
}

function parseVTT(data: string): Cue[] {
  const cues: Cue[] = []

  if (!data || typeof data !== 'string') return cues

  const normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalized.split(/\n{2,}/)

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    if (lines.length === 0) continue

    // 🔥 Find timeline safely (handles index + malformed blocks)
    const timeLine = lines.find(l => l.includes('-->'))
    if (!timeLine) continue

    // Skip WEBVTT header
    if (timeLine.toUpperCase() === 'WEBVTT') continue

    const parts = timeLine.split('-->')
    if (parts.length < 2) continue

    const startRaw = parts[0]?.trim()
    const endRawFull = parts[1]?.trim()

    if (!startRaw || !endRawFull) continue

    // Remove positioning (e.g. align:start)
    const endStr = endRawFull.split(' ')[0]?.trim()
    if (!endStr) continue

    /* =========================================
       Robust Time Parser
    ========================================= */

    const toSeconds = (t: string): number => {
  if (!t) return 0

  const clean = t.replace(',', '.').trim()
  const parts = clean.split(':')

  // mm:ss.mmm
  if (parts.length === 2) {
    const m = Number(parts[0] ?? 0)
    const s = parseFloat(parts[1] ?? '0')
    return m * 60 + s
  }

  // hh:mm:ss.mmm
  if (parts.length === 3) {
    const h = Number(parts[0] ?? 0)
    const m = Number(parts[1] ?? 0)
    const s = parseFloat(parts[2] ?? '0')
    return h * 3600 + m * 60 + s
  }

  return 0
}

    const start = toSeconds(startRaw)
    const end = toSeconds(endStr)

    // 🔥 Validate timing
    if (end <= start) continue

    // Extract subtitle text (skip timeline line)
    const timeIndex = lines.findIndex(l => l.includes('-->'))
if (timeIndex === -1) continue

const textLines = lines.slice(timeIndex + 1)
if (textLines.length === 0) continue

const text = escapeHTML(textLines.join('\n'))

    cues.push({
      start,
      end,
      text
    })
  }

  return cues
}
/* =========================================
   XSS Safe Text
========================================= */

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/* =========================================
   Init Feature
========================================= */

export function initSubtitlesFeature(
  player: Player,
  _tracks?: SubtitleTrackConfig[],
  lifecycle?: LifecycleManager,
  state?: StateManager,
  events?: EventEmitter
) {

  const video = player.getVideo()
  const container = player.getContainer()

  /* 🔥 FIX: Read from config */
  const config = player.getConfig()
  const tracks: SubtitleTrackConfig[] = config.subtitles || []

  /* ========================================= */

  const subtitleLayer = document.createElement('div')
  subtitleLayer.className = 'chatyplayer-subtitle-layer'

  const subtitleText = document.createElement('div')
  subtitleText.className = 'chatyplayer-subtitle-text'

  subtitleLayer.appendChild(subtitleText)
  container.appendChild(subtitleLayer)

  /* ========================================= */

  let cues: Cue[] = []
  let activeLang: string | null = null
  let currentIndex = -1
  let destroyed = false

  const getCurrentSubtitle = (): string | null => {
  return activeLang
  }

  /* ========================================= */

  const loadSubtitles = async (lang: string) => {
    const track = tracks.find(t => t.srclang === lang)
    if (!track) return

    const safeURL = sanitizeURL(track.src)
    if (!safeURL) return

    try {
      const res = await fetch(safeURL, { credentials: 'same-origin' })
      if (!res.ok) throw new Error('Failed to fetch subtitles')

      const text = await res.text()

      cues = parseVTT(text)
      currentIndex = -1
    } catch (err) {
      console.warn('[ChatyPlayer] Failed to load subtitles', err)
    }
  }

  /* ========================================= */

  const updateSubtitles = () => {
    if (destroyed || !activeLang) return

    const time = video.currentTime

    const index = cues.findIndex(
      c => time >= c.start && time < c.end
    )

    if (index === currentIndex) return
    currentIndex = index

    if (index === -1) {
      subtitleText.innerHTML = ''
      return
    }

    const cue = cues[index]
    if (!cue) return

    subtitleText.innerHTML = cue.text
  }

  /* ========================================= */

  const updatePosition = () => {
  const controls =
    container.querySelector('.chatyplayer-controls-layer') as HTMLElement | null

  const settingsPanel =
    container.querySelector('.chatyplayer-settings-panel') as HTMLElement | null

  const subtitleMenu =
    container.querySelector('.chatyplayer-subtitle-menu') as HTMLElement | null

  const isHidden = container.classList.contains('hide-ui')

  let offset = isHidden ? 10 : (controls?.offsetHeight || 50) + 10

  // ✅ SETTINGS PANEL (correct class + visibility check)
  if (settingsPanel && settingsPanel.classList.contains('is-open')) {
    offset += settingsPanel.offsetHeight
  }

  // ✅ SUBTITLE MENU (your existing one)
  if (subtitleMenu && subtitleMenu.offsetParent !== null) {
    offset += subtitleMenu.offsetHeight
  }

  subtitleLayer.style.bottom = `${offset}px`
}
/* ========================================= */

const enableSubtitle = async (srclang: string) => {
  if (!srclang || destroyed) return

  const track = tracks.find(t => t.srclang === srclang)
  if (!track) return

  activeLang = srclang

  // ✅ Update state FIRST (UI reacts immediately)
  state?.set?.('subtitle', srclang)
  events?.emit('subtitlechange', srclang)

  // ✅ Load subtitles safely
  await loadSubtitles(srclang)

  // ✅ Force render after async load
  updateSubtitles()
}

const disableSubtitles = () => {
  if (destroyed) return

  activeLang = null
  currentIndex = -1
  subtitleText.innerHTML = ''

  state?.set?.('subtitle', null)
  events?.emit('subtitlechange', null)
}

const getAvailableSubtitles = (): string[] => {
  return tracks.map(t => t.srclang).filter(Boolean)
}

/* =========================================
   🔥 PRODUCTION SAFE: Attach to Player (NOT api)
========================================= */

;(player as any).enableSubtitle = enableSubtitle
;(player as any).disableSubtitles = disableSubtitles
;(player as any).getAvailableSubtitles = getAvailableSubtitles
;(player as any).getCurrentSubtitle = getCurrentSubtitle

  /* ========================================= */

  const defaultTrack = tracks.find(t => t.default)
  if (defaultTrack) {
    enableSubtitle(defaultTrack.srclang)
  }

  /* ========================================= */
  container.addEventListener('chatyplayer-ui-update', updatePosition)
  video.addEventListener('timeupdate', updateSubtitles)
  video.addEventListener('timeupdate', updatePosition)

  container.addEventListener('mousemove', updatePosition)
  container.addEventListener('mouseenter', updatePosition)

  const observer = new MutationObserver(() => {
  requestAnimationFrame(updatePosition)
})

  observer.observe(container, {
    attributes: true,
    attributeFilter: ['class']
  })

  /* ========================================= */

  lifecycle?.registerCleanup(() => {
    destroyed = true

    video.removeEventListener('timeupdate', updateSubtitles)
    video.removeEventListener('timeupdate', updatePosition)

    container.removeEventListener('mousemove', updatePosition)
    container.removeEventListener('mouseenter', updatePosition)

    observer.disconnect()

    if (subtitleLayer.parentNode === container) {
      container.removeChild(subtitleLayer)
    }
  })

  return {
    enableSubtitle,
    disableSubtitles,
    getAvailableSubtitles
  }
}