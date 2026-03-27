/**
 * ChatyPlayer v1.0
 * Fullscreen Feature (Production Ready - Clean Mode Sync)
 * ----------------------------------------
 * - Fully compatible with Player mode system
 * - No forced mode overrides
 * - Prevents infinite loops
 * - Safe cross-browser support
 * - Works with existing Player fullscreen logic
 */

import type { Player } from '../core/Player'
import type { EventEmitter } from '../core/events'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'

export function initFullscreenFeature(
  player: Player,
  lifecycle?: LifecycleManager,
  state?: StateManager,
  events?: EventEmitter
) {
  const container = player.getContainer()
  const doc: any = document

  let syncing = false

  const syncFullscreenState = (active: boolean) => {
    state?.set('fullscreen', active)
    events?.emit('fullscreenchange', active)
  }

  /* =========================================
     Fullscreen helpers (safe)
  ========================================= */

  const requestFullscreen = () => {
    const el: any = container
    if (el.requestFullscreen) return el.requestFullscreen()
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen()
    if (el.msRequestFullscreen) return el.msRequestFullscreen()
  }

  const exitFullscreen = () => {
    if (doc.exitFullscreen) return doc.exitFullscreen()
    if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen()
    if (doc.msExitFullscreen) return doc.msExitFullscreen()
  }

  const isFullscreen = () => {
    return (
      document.fullscreenElement === container ||
      doc.webkitFullscreenElement === container ||
      doc.msFullscreenElement === container
    )
  }

  /* =========================================
     MODE → FULLSCREEN (sync only)
  ========================================= */

  player.getEvents().on('modechange', ({ prev, next }) => {
    if (syncing) return

    // Only react to actual change
    if (prev === next) return

    if (next === 'fullscreen') {
      if (!isFullscreen()) {
        Promise.resolve(requestFullscreen()).catch(() => {
          if (player.getMode() !== 'fullscreen') return

          // Keep the class-based fullscreen fallback active on browsers that
          // cannot enter native fullscreen for a container element.
          syncFullscreenState(true)
        })
      }
    } else {
      if (isFullscreen()) {
        Promise.resolve(exitFullscreen()).catch(() => {
          if (!isFullscreen() || player.getMode() === 'fullscreen') return

          syncing = true
          try {
            player.setMode('fullscreen')
            syncFullscreenState(true)
          } finally {
            syncing = false
          }
        })
      }
    }
  })

  /* =========================================
     FULLSCREEN → MODE (no override)
  ========================================= */

  const onFullscreenChange = () => {
    if (syncing) return
    syncing = true

    try {
      const active = isFullscreen()
      syncFullscreenState(active)

      if (active && player.getMode() !== 'fullscreen') {
        player.setMode('fullscreen')
      }

      if (!active && player.getMode() === 'fullscreen') {
        player.setMode('normal')
      }

    } finally {
      syncing = false
    }
  }

  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
  document.addEventListener('msfullscreenchange', onFullscreenChange)

  /* =========================================
     Public API
  ========================================= */

  player.toggleFullscreen = () => {
    player.setMode(
      player.getMode() === 'fullscreen' ? 'normal' : 'fullscreen'
    )
  }

  /* =========================================
     Cleanup
  ========================================= */

  lifecycle?.registerCleanup(() => {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    document.removeEventListener('msfullscreenchange', onFullscreenChange)
  })

  return {
    isFullscreen
  }
}
