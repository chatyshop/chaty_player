/**
 * ChatyPlayer v1.0
 * Mini Player (Production Ready Floating Mode)
 * ----------------------------------------
 * - Scroll activated mini player (stable)
 * - Sentinel-based observer (no flicker)
 * - Scroll lock to prevent jitter
 * - Draggable + snap to edges
 * - Touch + mouse support
 * - Lifecycle safe cleanup
 */

import type { Player } from '../core/Player'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'

export function createMiniPlayer(
  player: Player,
  lifecycle?: LifecycleManager,
  state?: StateManager
): void {

  const container = player.getContainer()

  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return
  }

  let isMini = false
  let scrollLock = false

  /* ---------------------------
     Sentinel (CRITICAL FIX)
  --------------------------- */

  const sentinel = document.createElement('div')
  sentinel.style.height = '1px'

  container.parentElement?.insertBefore(sentinel, container)

  /* ---------------------------
     Activate / Deactivate
  --------------------------- */

  const activateMini = () => {
    if (isMini) return

    container.classList.add('chatyplayer-mini')

    container.style.cursor = 'grab'
    container.style.touchAction = 'none'

    isMini = true
  }

  const deactivateMini = () => {
    if (!isMini) return

    container.classList.remove('chatyplayer-mini')

    container.style.left = ''
    container.style.top = ''
    container.style.right = ''
    container.style.bottom = ''
    container.style.cursor = ''

    isMini = false
  }

  /* ---------------------------
     Intersection Observer (FIXED)
  --------------------------- */

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {

        if (scrollLock) return

        if (!entry.isIntersecting && !isMini) {

          scrollLock = true
          activateMini()

          setTimeout(() => {
            scrollLock = false
          }, 150)
        }

        if (entry.isIntersecting && isMini) {

          scrollLock = true
          deactivateMini()

          setTimeout(() => {
            scrollLock = false
          }, 150)
        }
      }
    },
    {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.3
    }
  )

  observer.observe(sentinel)

  /* ---------------------------
     Drag Logic
  --------------------------- */

  let dragging = false
  let moved = false
  let offsetX = 0
  let offsetY = 0
  let activePointerId: number | null = null

  const DRAG_THRESHOLD = 5

  const onPointerDown = (e: PointerEvent) => {

    if (!isMini) return

    activePointerId = e.pointerId

    const rect = container.getBoundingClientRect()

    offsetX = e.clientX - rect.left
    offsetY = e.clientY - rect.top

    container.style.right = 'auto'
    container.style.bottom = 'auto'

    try {
      container.setPointerCapture(e.pointerId)
    } catch {}

    dragging = true
    moved = false

    container.style.cursor = 'grabbing'
  }

  const onPointerMove = (e: PointerEvent) => {

    if (!dragging || e.pointerId !== activePointerId) return

    const x = e.clientX - offsetX
    const y = e.clientY - offsetY

    const maxX = window.innerWidth - container.offsetWidth
    const maxY = window.innerHeight - container.offsetHeight

    const safeX = Math.max(0, Math.min(x, maxX))
    const safeY = Math.max(0, Math.min(y, maxY))

    if (!moved) {
      const dx = Math.abs(e.movementX)
      const dy = Math.abs(e.movementY)

      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        moved = true
      }
    }

    container.style.left = `${safeX}px`
    container.style.top = `${safeY}px`
  }

  const onPointerUp = (e: PointerEvent) => {

    if (!dragging || e.pointerId !== activePointerId) return

    dragging = false
    activePointerId = null

    try {
      container.releasePointerCapture(e.pointerId)
    } catch {}

    container.style.cursor = 'grab'

    snapToCorner()
  }

  /* ---------------------------
     Snap to Screen Corner
  --------------------------- */

  const snapToCorner = () => {

    const rect = container.getBoundingClientRect()

    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const isLeft = centerX < screenWidth / 2
    const isTop = centerY < screenHeight / 2

    container.style.left = ''
    container.style.right = ''
    container.style.top = ''
    container.style.bottom = ''

    if (isLeft && isTop) {
      container.style.left = '20px'
      container.style.top = '20px'
    } else if (!isLeft && isTop) {
      container.style.right = '20px'
      container.style.top = '20px'
    } else if (isLeft && !isTop) {
      container.style.left = '20px'
      container.style.bottom = '20px'
    } else {
      container.style.right = '20px'
      container.style.bottom = '20px'
    }
  }

  /* ---------------------------
     Restore on Click (FIXED)
  --------------------------- */

  const onClick = () => {

    if (!isMini || moved) return

    deactivateMini()

    setTimeout(() => {
      container.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }, 50)
  }

  /* ---------------------------
     Event Binding
  --------------------------- */

  container.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)

  container.addEventListener('click', onClick)

  /* ---------------------------
     Cleanup
  --------------------------- */

  lifecycle?.registerCleanup(() => {

    observer.disconnect()
    sentinel.remove()

    container.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)

    container.removeEventListener('click', onClick)

  })
}