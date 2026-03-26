/**
 * ChatyPlayer v1.0
 * Settings Panel Module (Refactored - Production Safe + Fullscreen Ready)
 */

import type { Player } from '../core/Player'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'
import { Icons } from './icons'

export function createSettings(
  player: Player,
  mountPoint: HTMLElement,
  lifecycle?: LifecycleManager,
  state?: StateManager
): void {

  const video = player.getVideo()
  const events = player.getEvents()
  /* ========================================= */

  const wrapper = document.createElement('div')
  wrapper.className = 'chatyplayer-settings-wrapper'

  const toggleBtn = document.createElement('button')
  toggleBtn.type = 'button'
  toggleBtn.className = 'chatyplayer-btn chatyplayer-settings-toggle'
  toggleBtn.setAttribute('aria-label', 'Settings')
  toggleBtn.appendChild(Icons.settings())

  const panel = document.createElement('div')
  panel.className = 'chatyplayer-settings-panel'
  panel.setAttribute('aria-hidden', 'true')
  panel.setAttribute('role', 'menu')

  wrapper.appendChild(toggleBtn)
  wrapper.appendChild(panel)
  mountPoint.appendChild(wrapper)

  /* ========================================= */

  let isOpen = false

  const openPanel = () => {
    if (isOpen) return
    isOpen = true

    panel.classList.add('is-open')
    panel.setAttribute('aria-hidden', 'false')

    // focus first item
    const firstBtn = panel.querySelector<HTMLButtonElement>('button')
    firstBtn?.focus()
  }

  const closePanel = () => {
    if (!isOpen) return
    isOpen = false

    panel.classList.remove('is-open')
    panel.setAttribute('aria-hidden', 'true')

    toggleBtn.focus()
  }

  const togglePanel = () => (isOpen ? closePanel() : openPanel())

  const onToggleClick = (e: Event) => {
    e.stopPropagation()
    togglePanel()
  }

  toggleBtn.addEventListener('click', onToggleClick)

  /* ========================================= */
  /* Scoped outside click */

  const onOutsideClick = (e: Event) => {
    const target = e.target as Node | null
    if (!target) return

    if (wrapper.contains(target)) return
    closePanel()
  }

  document.addEventListener('pointerdown', onOutsideClick)

  /* ========================================= */
  /* ESC key */

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closePanel()
  }

  document.addEventListener('keydown', onKeyDown)

  /* ========================================= */
  /* MENU SYSTEM (class-based, no inline styles) */

  const menus: Record<string, HTMLElement> = {}

  const showMenu = (name: string) => {
    Object.values(menus).forEach(menu => {
      menu.classList.remove('active')
    })

    const target = menus[name]
    if (target) target.classList.add('active')
  }

  const createMenu = (name: string): HTMLElement => {
    const menu = document.createElement('div')
    menu.className = 'chatyplayer-settings-menu'

    panel.appendChild(menu)
    menus[name] = menu

    return menu
  }

  const createBackButton = (menu: HTMLElement) => {
    const back = document.createElement('button')
    back.className = 'chatyplayer-settings-btn'
    back.textContent = '← Back'

    const handler = () => showMenu('main')

    back.addEventListener('click', handler)

    lifecycle?.registerCleanup(() => {
      back.removeEventListener('click', handler)
    })

    menu.appendChild(back)
  }

  /* ========================================= */
  /* MAIN MENU */

  const mainMenu = createMenu('main')

  const createMenuButton = (label: string, targetMenu: string) => {
    const btn = document.createElement('button')
    btn.className = 'chatyplayer-settings-btn'
    btn.innerHTML = `<span>${label}</span><span>›</span>`

    const handler = () => showMenu(targetMenu)

    btn.addEventListener('click', handler)

    lifecycle?.registerCleanup(() => {
      btn.removeEventListener('click', handler)
    })

    mainMenu.appendChild(btn)
  }

  createMenuButton('Playback', 'playback')
  createMenuButton('Player', 'player')
  createMenuButton('View', 'view')

  /* ========================================= */
  /* PLAYBACK */

  const playbackMenu = createMenu('playback')
  createBackButton(playbackMenu)

  /* SPEED */

  const speedMenu = createMenu('speed')
  createBackButton(speedMenu)

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
  let currentSpeed = state?.get('speed') ?? video.playbackRate ?? 1

  const renderSpeedUI = () => {
    speedBtn.innerHTML = `<span>Playback Speed</span><span>${currentSpeed}x ›</span>`

    speedMenu.querySelectorAll<HTMLButtonElement>('.chatyplayer-settings-btn').forEach(btn => {
      const rate = Number.parseFloat(btn.dataset.speedRate ?? '')
      btn.classList.toggle('is-active', Number.isFinite(rate) && rate === currentSpeed)
    })
  }

  speeds.forEach(rate => {
    const btn = document.createElement('button')
    btn.className = 'chatyplayer-settings-btn'
    btn.textContent = `${rate}x`
    btn.dataset.speedRate = String(rate)

    if (rate === currentSpeed) btn.classList.add('is-active')

    const handler = () => {
      player.setSpeed(rate)
      showMenu('playback')
    }

    btn.addEventListener('click', handler)

    lifecycle?.registerCleanup(() => {
      btn.removeEventListener('click', handler)
    })

    speedMenu.appendChild(btn)
  })

  const speedBtn = document.createElement('button')
  speedBtn.className = 'chatyplayer-settings-btn'
  speedBtn.innerHTML = `<span>Playback Speed</span><span>${currentSpeed}x ›</span>`
  speedBtn.addEventListener('click', () => showMenu('speed'))

  playbackMenu.appendChild(speedBtn)

  const onSpeedChange = (rate: number) => {
    currentSpeed = rate
    renderSpeedUI()
  }

  events.on('speedchange', onSpeedChange)
  renderSpeedUI()

  /* QUALITY */

  let qualityMenu: HTMLElement | null = null
  let qualityBtn: HTMLButtonElement | null = null

  const renderQualityUI = () => {
    const qualityAPI = (player as any)?.quality
    const currentQuality = qualityAPI?.getCurrentQuality?.()

    if (qualityBtn) {
      const qualityLabel =
        currentQuality === 'auto'
          ? 'Auto'
          : typeof currentQuality === 'string' && currentQuality
            ? currentQuality.toUpperCase()
            : ''

      qualityBtn.innerHTML = qualityLabel
        ? `<span>Quality</span><span>${qualityLabel} ›</span>`
        : `<span>Quality</span><span>›</span>`
    }

    if (qualityMenu) {
      qualityMenu
        .querySelectorAll<HTMLButtonElement>('.chatyplayer-settings-btn[data-quality-value]')
        .forEach(btn => {
          btn.classList.toggle(
            'is-active',
            btn.dataset.qualityValue === currentQuality
          )
        })
    }
  }

  const offReady = events.on('ready', () => {
    const qualityAPI = (player as any)?.quality
    if (!qualityAPI?.getAvailableQualities) return

    const qualities = qualityAPI.getAvailableQualities()
    if (!Array.isArray(qualities) || qualities.length <= 1) return

    qualityMenu = createMenu('quality')
    const currentQualityMenu = qualityMenu
    createBackButton(currentQualityMenu)

    qualities.forEach((q: string) => {
      const btn = document.createElement('button')
      btn.className = 'chatyplayer-settings-btn'
      btn.dataset.qualityValue = q

      const label = q === 'auto' ? 'Auto' : q.toUpperCase()
      btn.textContent = label

      const handler = () => {
        try {
          qualityAPI.setQuality?.(q)
        } catch {}

        showMenu('playback')
      }

      btn.addEventListener('click', handler)

      lifecycle?.registerCleanup(() => {
        btn.removeEventListener('click', handler)
      })

      currentQualityMenu.appendChild(btn)
    })

    qualityBtn = document.createElement('button')
    qualityBtn.className = 'chatyplayer-settings-btn'
    qualityBtn.innerHTML = `<span>Quality</span><span>›</span>`
    qualityBtn.addEventListener('click', () => showMenu('quality'))

    playbackMenu.appendChild(qualityBtn)
    renderQualityUI()
  })

  const onQualityChange = () => {
    renderQualityUI()
  }

  events.on('qualitychange', onQualityChange)

  /* LOOP */

  const loopBtn = document.createElement('button')
  loopBtn.className = 'chatyplayer-settings-btn'
  loopBtn.textContent = 'Toggle Loop'

  loopBtn.addEventListener('click', () => {
    video.loop = !video.loop
    closePanel()
  })

  playbackMenu.appendChild(loopBtn)

  /* ========================================= */
  /* PLAYER */

  const playerMenu = createMenu('player')
  createBackButton(playerMenu)

  const pipBtn = document.createElement('button')
  pipBtn.className = 'chatyplayer-settings-btn'
  pipBtn.textContent = 'Picture in Picture'

  const pipSupported =
    'pictureInPictureEnabled' in document &&
    (document as any).pictureInPictureEnabled === true &&
    typeof (video as any)?.requestPictureInPicture === 'function' &&
    !(video as HTMLVideoElement & {
      disablePictureInPicture?: boolean
    }).disablePictureInPicture

  if (!pipSupported) pipBtn.disabled = true

  pipBtn.addEventListener('click', async () => {
    try {
      await (player as any).togglePiP?.()
      closePanel()
    } catch {}
  })

  playerMenu.appendChild(pipBtn)

  /* ========================================= */
  /* VIEW */

  const viewMenu = createMenu('view')
  createBackButton(viewMenu)

  const theaterBtn = document.createElement('button')
  theaterBtn.className = 'chatyplayer-settings-btn'
  theaterBtn.textContent = 'Theater Mode'
  theaterBtn.addEventListener('click', () => {
    player.toggleTheatre()
    closePanel()
  })

  const miniBtn = document.createElement('button')
  miniBtn.className = 'chatyplayer-settings-btn'
  miniBtn.textContent = 'Mini Player'
  miniBtn.addEventListener('click', () => {
    player.toggleMini()
    closePanel()
  })

  viewMenu.appendChild(theaterBtn)
  viewMenu.appendChild(miniBtn)

  /* ========================================= */

  showMenu('main')

  /* ========================================= */
  /* CLEANUP */

  lifecycle?.registerCleanup(() => {
    toggleBtn.removeEventListener('click', onToggleClick)
    document.removeEventListener('pointerdown', onOutsideClick)
    document.removeEventListener('keydown', onKeyDown)
    events.off('speedchange', onSpeedChange)
    events.off('qualitychange', onQualityChange)
    offReady()
  })
}
