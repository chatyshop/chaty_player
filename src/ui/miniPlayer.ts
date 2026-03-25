/**
 * ChatyPlayer v1.0
 * Mini Player (Final Production - Stable + No Flicker + UX Safe)
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
  let lastMode: any = 'normal'

  let manualExit = false
  let manualCooldown = false
  let cooldownTimer: number | null = null

  let observerLock = false
  let visibilityTimeout: number | null = null
  let clickCooldown: number | null = null

  /* ---------------------------
     Sentinel
  --------------------------- */

  const sentinel = document.createElement('div')
  sentinel.style.height = '1px'
  container.parentElement?.insertBefore(sentinel, container)

  /* ---------------------------
     Back Button
  --------------------------- */

  const backBtn = document.createElement('button')
  backBtn.className = 'chatyplayer-mini-back'
  backBtn.innerText = 'Back'

  Object.assign(backBtn.style, {
    position: 'absolute',
    top: '8px',
    left: '8px',
    zIndex: '10000',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: '4px'
  })

  backBtn.addEventListener('click', (e) => {
    e.stopPropagation()

    manualExit = true
    manualCooldown = true

    if (cooldownTimer) clearTimeout(cooldownTimer)

    deactivateMini()

    container.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })

    cooldownTimer = window.setTimeout(() => {
      manualExit = false
      manualCooldown = false
      cooldownTimer = null
    }, 1000)
  })

  /* ---------------------------
     Activate / Deactivate
  --------------------------- */

  const activateMini = () => {
    if (isMini) return

    lastMode = player.getMode()
    player.setMode('mini')

    container.style.cursor = 'grab'
    container.style.touchAction = 'none'
    container.style.zIndex = '9999'

    container.appendChild(backBtn)
    snapToCorner()

    isMini = true
    state?.set?.('mini', true)
  }

  const deactivateMini = () => {
    if (!isMini) return

    player.setMode(lastMode || 'normal')

    container.style.left = ''
    container.style.top = ''
    container.style.right = ''
    container.style.bottom = ''
    container.style.cursor = ''
    container.style.touchAction = ''
    container.style.zIndex = ''

    backBtn.remove()

    isMini = false
    state?.set?.('mini', false)
  }

  /* ---------------------------
     Mode Sync
  --------------------------- */

  player.getEvents().on('modechange', ({ next }) => {
    if (next !== 'mini' && isMini) {
      deactivateMini()
    }
  })

  /* ---------------------------
     Intersection Observer
  --------------------------- */

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {

        if (observerLock) return

        const isVisible = entry.isIntersecting

        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout)
          visibilityTimeout = null
        }

        if (!isVisible && !isMini && !manualExit && !manualCooldown) {
          observerLock = true

          visibilityTimeout = window.setTimeout(() => {
            activateMini()
            observerLock = false
          }, 120)
        }

        if (isVisible && isMini) {
          observerLock = true

          visibilityTimeout = window.setTimeout(() => {
            deactivateMini()
            observerLock = false
          }, 120)
        }
      }
    },
    {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.05
    }
  )

  observer.observe(sentinel)

  /* ---------------------------
     Drag Logic
  --------------------------- */

  let dragging = false
  let offsetX = 0
  let offsetY = 0
  let activePointerId: number | null = null

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
    container.style.cursor = 'grabbing'
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== activePointerId) return

    const x = e.clientX - offsetX
    const y = e.clientY - offsetY

    const maxX = window.innerWidth - container.offsetWidth
    const maxY = window.innerHeight - container.offsetHeight

    container.style.left = `${Math.max(0, Math.min(x, maxX))}px`
    container.style.top = `${Math.max(0, Math.min(y, maxY))}px`
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
     Click (Desktop Return Fix)
  --------------------------- */

  const onClick = () => {
    if (!isMini) return
    if (dragging) return
    if (clickCooldown) return

    manualExit = true
    manualCooldown = true

    deactivateMini()

    container.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })

    clickCooldown = window.setTimeout(() => {
      manualExit = false
      manualCooldown = false
      clickCooldown = null
    }, 800)
  }

  /* ---------------------------
     Snap
  --------------------------- */

  const snapToCorner = () => {
    const rect = container.getBoundingClientRect()

    const isLeft = rect.left + rect.width / 2 < window.innerWidth / 2
    const isTop = rect.top + rect.height / 2 < window.innerHeight / 2

    container.style.left = ''
    container.style.right = ''
    container.style.top = ''
    container.style.bottom = ''

    if (isLeft && isTop) {
      container.style.left = '16px'
      container.style.top = '16px'
    } else if (!isLeft && isTop) {
      container.style.right = '16px'
      container.style.top = '16px'
    } else if (isLeft && !isTop) {
      container.style.left = '16px'
      container.style.bottom = '16px'
    } else {
      container.style.right = '16px'
      container.style.bottom = '16px'
    }
  }

  /* ---------------------------
     Resize
  --------------------------- */

  const onResize = () => {
    if (isMini) snapToCorner()
  }

  /* ---------------------------
     Bind
  --------------------------- */

  container.addEventListener('pointerdown', onPointerDown)
  container.addEventListener('click', onClick)

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('resize', onResize)

  /* ---------------------------
     Cleanup
  --------------------------- */

  lifecycle?.registerCleanup(() => {
    observer.disconnect()
    sentinel.remove()

    if (visibilityTimeout) clearTimeout(visibilityTimeout)
    if (cooldownTimer) clearTimeout(cooldownTimer)
    if (clickCooldown) clearTimeout(clickCooldown)

    container.removeEventListener('pointerdown', onPointerDown)
    container.removeEventListener('click', onClick)

    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    window.removeEventListener('resize', onResize)

    backBtn.remove()
  })
}