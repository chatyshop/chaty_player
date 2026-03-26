/**
 * ChatyPlayer v1.0
 * Quality Switching Feature (Production Ready - Optimized)
 */

import type { Player } from '../core/Player'
import type { PlayerConfig, VideoSource } from '../core/config'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'
import type { EventEmitter } from '../core/events'

export type QualityLabel = string | 'auto'

export function initQualityFeature(
  player: Player,
  config: PlayerConfig,
  lifecycle?: LifecycleManager,
  state?: StateManager,
  events?: EventEmitter
) {

  const video = player.getVideo()

  const sources: VideoSource[] =
    Array.isArray(config.sources) ? config.sources : []

  /* =========================================
     STATE
  ========================================= */

  let currentQuality: QualityLabel = 'auto'
  let autoMode = true
  let switching = false

  let lastAutoSwitch = 0
  const AUTO_SWITCH_COOLDOWN = 8000

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Mobi|Android|iPhone/i.test(navigator.userAgent)

  /* =========================================
     HELPERS
  ========================================= */

  const getAvailableQualities = (): QualityLabel[] => {
    if (!sources.length) return []
    return ['auto', ...sources.map(s => s.label)]
  }

  const getCurrentQuality = (): QualityLabel => currentQuality

  const getCurrentSourceIndex = (): number => {
    const activeSrc = video.currentSrc || video.src
    const directIndex = sources.findIndex(s => s.src === activeSrc)
    if (directIndex >= 0) return directIndex

    if (currentQuality === 'auto') return 0

    return sources.findIndex(s => s.label === currentQuality)
  }

  /* =========================================
     SWITCH SOURCE (SAFE)
  ========================================= */

  const switchSource = (source: VideoSource): void => {

    if (!source || switching) return

    // Prevent switching to same source (safe check)
    if (video.currentSrc === source.src) return

    switching = true

    const currentTime = Number.isFinite(video.currentTime)
      ? video.currentTime
      : 0

    const wasPlaying = !video.paused

    video.pause()

    // Only reload if different
    if (video.src !== source.src) {
      video.src = source.src
      video.load()
    }

    const restorePlayback = () => {

      try {
        video.currentTime = currentTime
      } catch {}

      if (wasPlaying) {
        video.play().catch(() => {})
      }

      state?.update?.({
        playing: wasPlaying
      })

      currentQuality = source.label
      events?.emit?.('qualitychange', source.label)

      video.removeEventListener('loadedmetadata', restorePlayback)

      // release lock safely
      setTimeout(() => {
        switching = false
      }, 2000)
    }

    video.addEventListener('loadedmetadata', restorePlayback)
  }

  /* =========================================
     MANUAL QUALITY
  ========================================= */

  const setQuality = (label: QualityLabel): void => {

    if (label === 'auto') {
      autoMode = true
      const currentIndex = getCurrentSourceIndex()
      currentQuality =
        currentIndex >= 0 && sources[currentIndex]
          ? sources[currentIndex]!.label
          : 'auto'
      return
    }

    const source = sources.find(s => s.label === label)
    if (!source) return

    autoMode = false
    currentQuality = label

    switchSource(source)
  }

  /* =========================================
     AUTO QUALITY (SMART + MOBILE SAFE)
  ========================================= */

  const handleBuffering = (): void => {

    if (!autoMode) return
    if (switching) return
    if (sources.length < 2) return
    if (!video.buffered || video.buffered.length === 0) return

    const now = Date.now()

    // prevent aggressive switching
    if (now - lastAutoSwitch < AUTO_SWITCH_COOLDOWN) return

    const buffer =
      video.buffered.end(video.buffered.length - 1) - video.currentTime

    if (isMobile) {
      if (buffer > 25) {
        increaseQuality()
        lastAutoSwitch = now
      }
      if (buffer < 5) {
        decreaseQuality()
        lastAutoSwitch = now
      }
    } else {
      if (buffer > 15) {
        increaseQuality()
        lastAutoSwitch = now
      }
      if (buffer < 3) {
        decreaseQuality()
        lastAutoSwitch = now
      }
    }
  }

  /* =========================================
     QUALITY STEPS
  ========================================= */

  const increaseQuality = (): void => {

    const index = getCurrentSourceIndex()
    if (index < 0) return

    const next = sources[index + 1]
    if (!next) return

    currentQuality = next.label
    switchSource(next)
  }

  const decreaseQuality = (): void => {

    const index = getCurrentSourceIndex()
    if (index <= 0) return

    const prev = sources[index - 1]
    if (!prev) return

    currentQuality = prev.label
    switchSource(prev)
  }

  /* =========================================
     EVENTS
  ========================================= */

  video.addEventListener('timeupdate', handleBuffering)

  /* =========================================
     CLEANUP
  ========================================= */

  lifecycle?.registerCleanup(() => {
    video.removeEventListener('timeupdate', handleBuffering)
  })

  ;(player as any).setQuality = (label: QualityLabel) => {
    setQuality(label)
  }

  /* =========================================
     PUBLIC API
  ========================================= */

  return {
    getAvailableQualities,
    getCurrentQuality,
    setQuality
  }
}
