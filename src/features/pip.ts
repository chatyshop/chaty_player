/**
 * ChatyPlayer v1.0
 * Picture-in-Picture Feature (Production Ready)
 * ----------------------------------------
 * - Safe PiP handling
 * - Browser capability checks
 * - Auto PiP on tab switch
 * - User interaction tracking
 * - State sync
 * - Event emission
 * - Lifecycle safe cleanup
 * - SSR safe
 */

import type { Player } from '../core/Player'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'
import type { EventEmitter } from '../core/events'

export function initPiPFeature(
  player: Player,
  lifecycle?: LifecycleManager,
  state?: StateManager,
  events?: EventEmitter
) {

  /* SSR protection */
  if (typeof document === 'undefined') return

  const video = player.getVideo()
  const doc: any = document

  let autoPiPTriggered = false
  let lastUserInteraction = Date.now()

  /* =========================================
     Track user interaction
  ========================================= */

  const recordInteraction = (): void => {
    lastUserInteraction = Date.now()
  }

  document.addEventListener('pointerdown', recordInteraction)
  document.addEventListener('keydown', recordInteraction)

  /* =========================================
     Check PiP support
  ========================================= */

  const isSupported = (): boolean => {

    return (
      'pictureInPictureEnabled' in document &&
      (document as any).pictureInPictureEnabled === true &&
      typeof video.requestPictureInPicture === 'function' &&
      !(video as HTMLVideoElement & {
        disablePictureInPicture?: boolean
      }).disablePictureInPicture
    )

  }

  /* =========================================
     Check if PiP is active
  ========================================= */

  const isActive = (): boolean => {

    return doc.pictureInPictureElement === video

  }

  /* =========================================
     Enter PiP safely
  ========================================= */

  const enterPiP = async (): Promise<void> => {

    if (!isSupported()) return
    if (isActive()) return

    try {

      await video.requestPictureInPicture()

    } catch {

      /* Browser gesture restriction or failure */

    }

  }

  /* =========================================
     Exit PiP safely
  ========================================= */

  const exitPiP = async (): Promise<void> => {

    if (!isSupported()) return
    if (!isActive()) return

    try {

      await doc.exitPictureInPicture()

    } catch {

      /* Ignore failure */

    }

  }

  /* =========================================
     Toggle PiP
  ========================================= */

  const togglePiP = async (): Promise<void> => {

    if (!isSupported()) return

    if (isActive()) {

      await exitPiP()

    } else {

      await enterPiP()

    }

  }

  /* =========================================
     Sync state
  ========================================= */

  const onEnter = (): void => {

    state?.set('pip', true)
    events?.emit('pipchange', true)

  }

  const onLeave = (): void => {

    state?.set('pip', false)
    events?.emit('pipchange', false)

    autoPiPTriggered = false

  }

  video.addEventListener('enterpictureinpicture', onEnter)
  video.addEventListener('leavepictureinpicture', onLeave)

  /* =========================================
     Auto PiP when tab hidden
  ========================================= */

  const onVisibilityChange = async (): Promise<void> => {

    if (!isSupported()) return

    const recentlyInteracted =
      Date.now() - lastUserInteraction < 15000

    if (document.visibilityState === 'hidden') {

      if (!video.paused && !isActive() && recentlyInteracted) {

        try {

          await enterPiP()
          autoPiPTriggered = isActive()

        } catch {}

      }

    }

    if (document.visibilityState === 'visible') {

      if (autoPiPTriggered && isActive()) {

        try {

          await exitPiP()

        } catch {}

      }

      autoPiPTriggered = false

    }

  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  /* =========================================
     Cleanup
  ========================================= */

  lifecycle?.registerCleanup(() => {

    video.removeEventListener('enterpictureinpicture', onEnter)
    video.removeEventListener('leavepictureinpicture', onLeave)

    document.removeEventListener('visibilitychange', onVisibilityChange)

    document.removeEventListener('pointerdown', recordInteraction)
    document.removeEventListener('keydown', recordInteraction)

    if (isActive()) {

      try {

        doc.exitPictureInPicture()

      } catch {}

    }

  })

  ;(player as any).togglePiP = () => togglePiP()

  /* =========================================
     Public API
  ========================================= */

  return {

    isSupported,
    isActive,
    togglePiP,
    enterPiP,
    exitPiP

  }

}
