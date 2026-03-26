/**
 * ChatyPlayer v1.0
 * Public API Wrapper (Production Ready - Subtitles Integrated)
 * publicAPI.ts
 */

import type { Player } from '../core/Player'
import type { EventEmitter, PlayerEventMap } from '../core/events'

type EventKey = keyof PlayerEventMap

export interface ChatyPlayerAPI {
  play(): Promise<void>
  pause(): void
  seek(time: number): void
  setVolume(volume: number): void
  mute(): void
  unmute(): void

  toggleFullscreen(): void
  toggleTheatre(): void
  toggleMini(): void
  togglePiP(): void

  setSpeed(rate: number): void
  setQuality(label: string): void

  enableSubtitle(lang: string): void
  disableSubtitles(): void
  getAvailableSubtitles(): string[] // ✅ NEW
  getCurrentSubtitle?: () => string | null

  getTimestampLink(): string | null

  on<K extends EventKey>(
    event: K,
    handler: PlayerEventMap[K] extends void
      ? () => void
      : (payload: PlayerEventMap[K]) => void
  ): void

  off<K extends EventKey>(
    event: K,
    handler: PlayerEventMap[K] extends void
      ? () => void
      : (payload: PlayerEventMap[K]) => void
  ): void
}

export function createPublicAPI(
  player: Player,
  events?: EventEmitter
): ChatyPlayerAPI {

  const video = player.getVideo()

  /* =========================================
     Safe Helpers
  ========================================= */

  const safeNumber = (value: unknown, fallback = 0): number => {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
  }

  const getFeatureMethod = (method: string) => {
    const instance = player as unknown as Record<string, unknown>
    const fn = instance[method]
    return typeof fn === 'function' ? fn : null
  }

  const callFeature = (method: string, ...args: unknown[]) => {
    const fn = getFeatureMethod(method)
    if (!fn) return

    try {
      fn.apply(player, args)
    } catch {
      /* silent fail */
    }
  }

  /* ========================================= */

  return {

    async play() {
      try {
        await player.play()
      } catch {}
    },

    pause() {
      player.pause()
    },

    seek(time: number) {
      const duration = video.duration || 0

      const safeTime = Math.min(
        Math.max(0, safeNumber(time)),
        duration
      )

      player.seek(safeTime)
    },

    setVolume(volume: number) {
      const safeVol = Math.min(
        Math.max(0, safeNumber(volume)),
        1
      )

      video.volume = safeVol
    },

    mute() {
      video.muted = true
    },

    unmute() {
      video.muted = false
    },

    /* =========================================
       MODE SYSTEM
    ========================================= */

    toggleFullscreen() {
      callFeature('toggleFullscreen')
    },

    toggleTheatre() {
      callFeature('toggleTheatre')
    },

    toggleMini() {
      callFeature('toggleMini')
    },

    togglePiP() {
      callFeature('togglePiP')
    },

    /* ========================================= */

    setSpeed(rate: number) {
      const safeRate = Math.min(
        Math.max(0.25, safeNumber(rate)),
        4
      )

      callFeature('setSpeed', safeRate)
    },

    setQuality(label: string) {
      if (typeof label !== 'string') return
      callFeature('setQuality', label)
    },

    /* =========================================
       SUBTITLES (FIXED + SAFE)
    ========================================= */

    enableSubtitle(lang: string) {
      if (typeof lang !== 'string' || !lang) return
      callFeature('enableSubtitle', lang)
    },

    disableSubtitles() {
      callFeature('disableSubtitles')
    },

    getAvailableSubtitles(): string[] {
      const fn = getFeatureMethod('getAvailableSubtitles')

      if (!fn) return []

      try {
        const result = fn.call(player)
        return Array.isArray(result) ? result.filter(Boolean) : []
      } catch {
        return []
      }
    },

    getTimestampLink() {
      const fn = getFeatureMethod('getTimestampLink')

      if (!fn) return null

      try {
        const result = fn.call(player)
        return typeof result === 'string' ? result : null
      } catch {
        return null
      }
    },

    /* =========================================
       EVENTS
    ========================================= */

    on(event, handler) {
      if (!events || typeof handler !== 'function') return
      events.on(event, handler as never)
    },

    off(event, handler) {
      if (!events || typeof handler !== 'function') return
      events.off(event, handler as never)
    }

  }
}
