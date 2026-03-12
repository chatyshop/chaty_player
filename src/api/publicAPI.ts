/**
 * ChatyPlayer v1.0
 * Public API Wrapper (Production Ready)
 * ----------------------------------------
 * - Safe controlled interface
 * - Strong TypeScript typing
 * - Input validation
 * - No internal exposure
 * - Defensive feature checks
 * - Event subscription wrapper
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
  toggleTheater(): void
  togglePiP(): void

  setSpeed(rate: number): void
  setQuality(label: string): void

  enableSubtitle(lang: string): void
  disableSubtitles(): void

  captureScreenshot(): string | null
  downloadScreenshot(): void

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

  const safeNumber = (value: unknown, fallback = 0): number => {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
  }

  const callFeature = (method: string, ...args: unknown[]) => {
    const instance = player as unknown as Record<string, unknown>
    const fn = instance[method]

    if (typeof fn === 'function') {
      try {
        ;(fn as (...args: unknown[]) => unknown).apply(player, args)
      } catch {
        /* silent fail */
      }
    }
  }

  return {

    async play() {
      try {
        await player.play()
      } catch {
        /* autoplay restriction safe fail */
      }
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

    toggleFullscreen() {
      callFeature('toggleFullscreen')
    },

    toggleTheater() {
      callFeature('toggleTheater')
    },

    togglePiP() {
      callFeature('togglePiP')
    },

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

    enableSubtitle(lang: string) {
      if (typeof lang !== 'string') return
      callFeature('enableSubtitle', lang)
    },

    disableSubtitles() {
      callFeature('disableSubtitles')
    },

    captureScreenshot() {
      const instance = player as unknown as Record<string, unknown>

      const fn = instance['captureScreenshot']

      if (typeof fn === 'function') {
        try {
          const result = fn.call(player)
          return typeof result === 'string' ? result : null
        } catch {
          return null
        }
      }

      return null
    },

    downloadScreenshot() {
      callFeature('downloadScreenshot')
    },

    getTimestampLink() {
      const instance = player as unknown as Record<string, unknown>
      const fn = instance['getTimestampLink']

      if (typeof fn === 'function') {
        try {
          const result = fn.call(player)
          return typeof result === 'string' ? result : null
        } catch {
          return null
        }
      }

      return null
    },

    on(event, handler) {
      if (!events) return
      if (typeof handler !== 'function') return

      events.on(event, handler as any)
    },

    off(event, handler) {
      if (!events) return
      if (typeof handler !== 'function') return

      events.off(event, handler as any)
    }

  }
}