/**
 * ChatyPlayer v1.0
 * Theater Mode Feature (Production Ready - Mode Safe)
 * ----------------------------------------
 * - Safe style backup (WeakMap)
 * - Idempotent enable/disable
 * - No layout leaks
 * - Mode system compatible
 * - Works with fullscreen transitions
 */

import type { Player } from '../core/Player'
import type { EventEmitter } from '../core/events'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'

export function initTheaterFeature(
  player: Player,
  lifecycle?: LifecycleManager,
  state?: StateManager,
  events?: EventEmitter
) {
  const container = player.getContainer()
  const wrapper = container.querySelector(
    '.chatyplayer-video-wrapper'
  ) as HTMLElement | null

  const ROOT_CLASS = 'chatyplayer-theater-active'

  // ✅ Safe style storage
  const styleBackup = new WeakMap<HTMLElement, Partial<CSSStyleDeclaration>>()

  let active = false
  let bodyOverflowBackup: string | null = null

  /* ========================================= */

  const saveStyles = (el: HTMLElement) => {
    if (styleBackup.has(el)) return

    styleBackup.set(el, {
      position: el.style.position,
      inset: (el.style as any).inset,
      width: el.style.width,
      height: el.style.height,
      maxWidth: el.style.maxWidth,
      margin: el.style.margin,
      aspectRatio: (el.style as any).aspectRatio,
      zIndex: el.style.zIndex
    })
  }

  const restoreStyles = (el: HTMLElement) => {
    const styles = styleBackup.get(el)
    if (!styles) return

    Object.assign(el.style, styles)
    styleBackup.delete(el)
  }

  /* ========================================= */

  const enableTheatre = () => {
    if (active) return
    active = true

    saveStyles(container)
    if (wrapper) saveStyles(wrapper)

    container.classList.add(ROOT_CLASS)

    container.style.position = 'fixed'
    container.style.inset = '0'
    container.style.width = '100vw'
    container.style.height = '100vh'
    container.style.margin = '0'
    container.style.maxWidth = 'none'
    container.style.zIndex = '9999'

    if (wrapper) {
      wrapper.style.aspectRatio = 'auto'
      wrapper.style.width = '100%'
      wrapper.style.height = '100%'
    }

    if (bodyOverflowBackup === null) {
      bodyOverflowBackup = document.body.style.overflow
    }
    document.body.style.overflow = 'hidden'

    state?.set('theater', true)
    events?.emit('theatre', true)
  }

  const disableTheatre = () => {
    if (!active) return
    active = false

    container.classList.remove(ROOT_CLASS)

    restoreStyles(container)
    if (wrapper) restoreStyles(wrapper)

    document.body.style.overflow = bodyOverflowBackup ?? ''
    bodyOverflowBackup = null

    state?.set('theater', false)
    events?.emit('theatre', false)
  }

  /* =========================================
     MODE SYSTEM SYNC
  ========================================= */

  player.getEvents().on('modechange', ({ next }) => {
    if (next === 'theatre') {
      enableTheatre()
    } else {
      disableTheatre()
    }
  })

  /* =========================================
     PUBLIC API
  ========================================= */

  player.toggleTheatre = () => {
    player.setMode(
      player.getMode() === 'theatre'
        ? 'normal'
        : 'theatre'
    )
  }

  /* ========================================= */

  lifecycle?.registerCleanup(() => {
    disableTheatre()
  })

  return {
    enableTheatre,
    disableTheatre
  }
}
