/**
 * ChatyPlayer v1.0
 * Gesture Controls Feature (Production Ready - Final Stable)
 */

import type { Player } from '../core/Player'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'

const DOUBLE_TAP_DELAY = 220
const SEEK_STEP = 10
const SWIPE_SENSITIVITY = 300
const SWIPE_THRESHOLD = 20

export function initGesturesFeature(
  player: Player,
  lifecycle?: LifecycleManager,
  state?: StateManager
): void {

  const container = player.getContainer()
  const video = player.getVideo()

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  let lastTapTime = 0
  let clickTimer: number | null = null
  let tapTimer: number | null = null

  let touchStartY = 0
  let touchStartVolume = 0
  let isSwiping = false
  let touchStartedOnInteractiveUI = false

  /* =========================================
     Utility: detect UI interaction safely
  ========================================= */

  const isInteractiveEvent = (e: Event): boolean => {

    const path = (e.composedPath?.() ?? []) as EventTarget[]

    for (const el of path) {

      if (!(el instanceof HTMLElement)) continue

      if (
        el.classList.contains('chatyplayer-controls-layer') ||
        el.classList.contains('chatyplayer-timeline-layer') ||
        el.classList.contains('chatyplayer-settings-panel') ||
        el.classList.contains('chatyplayer-subtitle-menu')
      ) return true

      if (
        el.tagName === 'BUTTON' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'SELECT' ||
        el.tagName === 'TEXTAREA'
      ) return true
    }

    return false
  }

  /* =========================================
     Toggle Play/Pause
  ========================================= */

  const togglePlayback = () => {
    if (video.paused) {
      player.play().catch(() => {})
    } else {
      player.pause()
    }
  }

  /* =========================================
     Mouse Click (Desktop only)
  ========================================= */

  const onClick = (e: MouseEvent): void => {

    if (isTouchDevice) return
    if (isInteractiveEvent(e)) return

    const rect = container.getBoundingClientRect()
    const isLeft = e.clientX < rect.left + rect.width / 2

    if (clickTimer !== null) {

      window.clearTimeout(clickTimer)
      clickTimer = null

      if (isLeft) {
        player.seek(Math.max(0, video.currentTime - SEEK_STEP))
      } else {
        player.seek(video.currentTime + SEEK_STEP)
      }

      return
    }

    clickTimer = window.setTimeout(() => {
      togglePlayback()
      clickTimer = null
    }, DOUBLE_TAP_DELAY)
  }

  /* =========================================
     Touch Start
  ========================================= */

  const onTouchStart = (e: TouchEvent): void => {

    touchStartedOnInteractiveUI = isInteractiveEvent(e)
    if (touchStartedOnInteractiveUI) return
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    if (!touch) return

    touchStartY = touch.clientY
    touchStartVolume = video.volume
    isSwiping = false
  }

  /* =========================================
     Touch Move (Volume Swipe)
  ========================================= */

  const onTouchMove = (e: TouchEvent): void => {

    if (touchStartedOnInteractiveUI) return
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    if (!touch) return

    const deltaY = touchStartY - touch.clientY

    if (!isSwiping && Math.abs(deltaY) > SWIPE_THRESHOLD) {
      isSwiping = true
    }

    if (!isSwiping) return

    if (e.cancelable) {
     e.preventDefault()
     }

    const volumeChange = deltaY / SWIPE_SENSITIVITY

    const newVolume = Math.min(
      1,
      Math.max(0, touchStartVolume + volumeChange)
    )

    video.volume = newVolume
    video.muted = newVolume === 0
    state?.set('volume', newVolume)
    state?.set('muted', video.muted)
  }

  /* =========================================
     Touch End (FIXED LOGIC)
  ========================================= */

  const onTouchEnd = (e: TouchEvent): void => {

    if (touchStartedOnInteractiveUI) {
      touchStartedOnInteractiveUI = false
      return
    }
    if (isInteractiveEvent(e)) return
    if (isSwiping) return

    const now = Date.now()
    const delta = now - lastTapTime

    const touch = e.changedTouches[0]
    if (!touch) return

    const rect = container.getBoundingClientRect()
    const isLeft = touch.clientX < rect.left + rect.width / 2

    // DOUBLE TAP
    if (delta < DOUBLE_TAP_DELAY) {

      if (tapTimer !== null) {
        window.clearTimeout(tapTimer)
        tapTimer = null
      }

      if (isLeft) {
        player.seek(Math.max(0, video.currentTime - SEEK_STEP))
      } else {
        player.seek(video.currentTime + SEEK_STEP)
      }

    } else {

      // SINGLE TAP (DELAYED)
      tapTimer = window.setTimeout(() => {
        togglePlayback()
        tapTimer = null
      }, DOUBLE_TAP_DELAY)

    }

    lastTapTime = now
  }

  /* =========================================
     Touch Cancel
  ========================================= */

  const onTouchCancel = (): void => {
    isSwiping = false
    touchStartedOnInteractiveUI = false
  }

  /* =========================================
     Event Binding
  ========================================= */

  container.style.userSelect = 'none'
  container.style.touchAction = 'manipulation'

  container.addEventListener('click', onClick)

  container.addEventListener('touchstart', onTouchStart, { passive: true })
  container.addEventListener('touchmove', onTouchMove, { passive: false })
  container.addEventListener('touchend', onTouchEnd)
  container.addEventListener('touchcancel', onTouchCancel)

  /* =========================================
     Cleanup
  ========================================= */

  lifecycle?.registerCleanup(() => {

    if (clickTimer !== null) {
      window.clearTimeout(clickTimer)
      clickTimer = null
    }

    if (tapTimer !== null) {
      window.clearTimeout(tapTimer)
      tapTimer = null
    }

    container.removeEventListener('click', onClick)
    container.removeEventListener('touchstart', onTouchStart)
    container.removeEventListener('touchmove', onTouchMove)
    container.removeEventListener('touchend', onTouchEnd)
    container.removeEventListener('touchcancel', onTouchCancel)

    container.style.userSelect = ''
    container.style.touchAction = ''

  })
}
