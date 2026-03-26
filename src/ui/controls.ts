/**
 * ChatyPlayer v1.0
 * Controls Module (Production Ready - Final Stable)
 * controls.ts
 */

import type { Player } from '../core/Player'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'
import type { EventEmitter } from '../core/events'
import { createSettings } from './settings'
import { Icons } from './icons'

export function createControls(
  player: Player,
  mountPoint: HTMLElement,
  lifecycle?: LifecycleManager,
  state?: StateManager,
  events?: EventEmitter
): void {

  const video = player.getVideo()
  const container = player.getContainer()

  if (!container) return

  // Prevent duplicate mount
  if (container.querySelector('.chatyplayer-controls')) return

  /* =====================================================
  ROOT BAR
  ===================================================== */

  const controlsBar = document.createElement('div')
  controlsBar.className = 'chatyplayer-controls'

  const leftGroup = document.createElement('div')
  leftGroup.className = 'chatyplayer-controls-left'

  const rightGroup = document.createElement('div')
  rightGroup.className = 'chatyplayer-controls-right'

  /* =====================================================
  PLAY / PAUSE
  ===================================================== */

  const playBtn = document.createElement('button')
  playBtn.className = 'chatyplayer-btn chatyplayer-play'
  playBtn.type = 'button'
  playBtn.setAttribute('aria-label', 'Play')

  playBtn.appendChild(Icons.play())

  const togglePlay = (): void => {
    video.paused ? player.play().catch(() => {}) : player.pause()
  }

  const onPlay = (): void => {
    playBtn.replaceChildren(Icons.pause())
    playBtn.setAttribute('aria-label', 'Pause')
    state?.set?.('playing', true)
  }

  const onPause = (): void => {
    playBtn.replaceChildren(Icons.play())
    playBtn.setAttribute('aria-label', 'Play')
    state?.set?.('playing', false)
  }

  playBtn.addEventListener('click', togglePlay)
  video.addEventListener('play', onPlay)
  video.addEventListener('pause', onPause)

  /* =====================================================
  TIME DISPLAY
  ===================================================== */

  const timeDisplay = document.createElement('span')
  timeDisplay.className = 'chatyplayer-time-inline'

  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const updateTime = (): void => {
    timeDisplay.textContent =
      `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`
  }

  video.addEventListener('timeupdate', updateTime)
  video.addEventListener('loadedmetadata', updateTime)

  /* =====================================================
  VOLUME
  ===================================================== */

  const volumeWrapper = document.createElement('div')
  volumeWrapper.className = 'chatyplayer-volume'

  const muteBtn = document.createElement('button')
  muteBtn.className = 'chatyplayer-btn chatyplayer-mute'
  muteBtn.type = 'button'

  const volumeSlider = document.createElement('input')
  volumeSlider.type = 'range'
  volumeSlider.min = '0'
  volumeSlider.max = '1'
  volumeSlider.step = '0.01'
  volumeSlider.value = String(video.volume)
  volumeSlider.className = 'chatyplayer-volume-slider'

  const updateMuteIcon = (): void => {
    muteBtn.replaceChildren(
      video.muted || video.volume === 0
        ? Icons.mute()
        : Icons.volume()
    )
  }

  const syncVolumeUI = (): void => {
    volumeSlider.value = String(video.muted ? 0 : video.volume)
    updateMuteIcon()
  }

  const toggleMute = (): void => {
    video.muted = !video.muted
    state?.set?.('muted', video.muted)
    syncVolumeUI()
  }

  const changeVolume = (): void => {
    const value = parseFloat(volumeSlider.value)
    if (!Number.isFinite(value)) return

    player.setVolume(value)
    video.muted = value === 0

    state?.set?.('volume', video.volume)
    state?.set?.('muted', video.muted)

    syncVolumeUI()
  }

  muteBtn.addEventListener('click', toggleMute)
  volumeSlider.addEventListener('input', changeVolume)

  // Prevent gesture conflicts
  volumeSlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true })
  volumeSlider.addEventListener('touchmove', e => e.stopPropagation(), { passive: true })

  video.addEventListener('volumechange', syncVolumeUI)

  volumeWrapper.appendChild(muteBtn)
  volumeWrapper.appendChild(volumeSlider)
/* =====================================================
   SUBTITLES (Production Ready UI - Custom Renderer)
===================================================== */

const subtitleBtn = document.createElement('button')
subtitleBtn.className = 'chatyplayer-btn chatyplayer-subtitles'
subtitleBtn.type = 'button'
subtitleBtn.textContent = 'CC'
subtitleBtn.setAttribute('aria-label', 'Subtitles')

const subtitleMenu = document.createElement('div')
subtitleMenu.className = 'chatyplayer-subtitle-menu'
subtitleMenu.style.display = 'none'

/* =========================================
   Subtitles API (NEW SYSTEM)
========================================= */

const getAPI = () => player as any

/* =========================================
   Build Menu (SAFE + CUSTOM ENGINE)
========================================= */

const buildSubtitleMenu = (): void => {

  subtitleMenu.innerHTML = ''

  const list = document.createElement('ul')
  list.className = 'chaty-subtitle-list'

  const subtitles: string[] = getAPI()?.getAvailableSubtitles?.() || []
  const active: string | null = getAPI()?.getCurrentSubtitle?.() ?? null

  /* ---------- OFF OPTION ---------- */

  const offItem = document.createElement('li')
  offItem.textContent = 'Off'
  offItem.setAttribute('role', 'menuitem')

  if (!active) {
    offItem.classList.add('active')
    offItem.textContent += ' ✓'
  }

  offItem.addEventListener('click', async () => {
  await getAPI()?.disableSubtitles?.()

  buildSubtitleMenu()
  subtitleMenu.style.display = 'none'
  container.classList.remove('chatyplayer-subtitle-menu-open')
})

  list.appendChild(offItem)

  /* ---------- LANGUAGES ---------- */

  for (const lang of subtitles) {

    if (!lang) continue

    const item = document.createElement('li')
    item.setAttribute('role', 'menuitem')

    // You can map labels here later
    item.textContent = lang

    if (active === lang) {
      item.classList.add('active')
      item.textContent += ' ✓'
    }

    item.addEventListener('click', async () => {
  await getAPI()?.enableSubtitle?.(lang)

  buildSubtitleMenu()
  subtitleMenu.style.display = 'none'
  container.classList.remove('chatyplayer-subtitle-menu-open')
})

    list.appendChild(item)
  }

  subtitleMenu.appendChild(list)
}

events?.on('subtitlechange', () => {
  // Only rebuild if menu is open (efficient)
  if (subtitleMenu.style.display === 'block') {
    buildSubtitleMenu()
  }
})

/* =========================================
   Toggle Menu
========================================= */

const toggleSubtitleMenu = (): void => {

  const isOpen = subtitleMenu.style.display === 'block'

  if (isOpen) {
    subtitleMenu.style.display = 'none'
    container.classList.remove('chatyplayer-subtitle-menu-open')
    return
  }

  buildSubtitleMenu()
  subtitleMenu.style.display = 'block'
  container.classList.add('chatyplayer-subtitle-menu-open')
}

/* =========================================
   Outside Click Close (SAFE)
========================================= */

const onOutsideClick = (e: Event): void => {

  const target = e.target as Node | null
  if (!target) return

  if (
    !subtitleMenu.contains(target) &&
    !subtitleBtn.contains(target)
  ) {
    subtitleMenu.style.display = 'none'
    container.classList.remove('chatyplayer-subtitle-menu-open')
  }
}

/* =========================================
   Events
========================================= */

const onSubtitleClick = (e: Event): void => {
  e.stopPropagation()
  toggleSubtitleMenu()

  // notify UI update (used by subtitle positioning system)
  setTimeout(() => {
    container.dispatchEvent(new Event('chatyplayer-ui-update'))
  }, 50)
}

subtitleBtn.addEventListener('click', onSubtitleClick)

const onPointerDown = (e: Event): void => {
  onOutsideClick(e)

  setTimeout(() => {
    container.dispatchEvent(new Event('chatyplayer-ui-update'))
  }, 50)
}

document.addEventListener('pointerdown', onPointerDown)

/* =========================================
   Lifecycle Cleanup (MEMORY SAFE)
========================================= */

lifecycle?.registerCleanup(() => {
  subtitleBtn.removeEventListener('click', onSubtitleClick)
  document.removeEventListener('pointerdown', onPointerDown)
})

  /* =====================================================
  SETTINGS
  ===================================================== */

  createSettings(player, rightGroup, lifecycle, state)

  /* =====================================================
  FULLSCREEN
  ===================================================== */

  const fullscreenBtn = document.createElement('button')
  fullscreenBtn.className = 'chatyplayer-btn chatyplayer-fullscreen'

  fullscreenBtn.appendChild(Icons.fullscreen())

  const toggleFullscreen = (): void => {
    subtitleMenu.style.display = 'none'
    container.classList.remove('chatyplayer-subtitle-menu-open')
    player.toggleFullscreen()
  }

  const onFullscreenChange = (): void => {
    const doc: any = document
    state?.set?.(
      'fullscreen',
      !!(doc.fullscreenElement || doc.webkitFullscreenElement)
    )
  }

  fullscreenBtn.addEventListener('click', toggleFullscreen)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)

  /* =====================================================
  BUILD
  ===================================================== */

  leftGroup.appendChild(playBtn)
  leftGroup.appendChild(timeDisplay)

  rightGroup.appendChild(subtitleBtn)
  rightGroup.appendChild(subtitleMenu)
  rightGroup.appendChild(volumeWrapper)
  rightGroup.appendChild(fullscreenBtn)

  controlsBar.appendChild(leftGroup)
  controlsBar.appendChild(rightGroup)

  mountPoint.appendChild(controlsBar)

  /* =====================================================
  INIT
  ===================================================== */

  if (!video.paused) onPlay()
  else onPause()

  syncVolumeUI()
  updateTime()

  /* =====================================================
  CLEANUP
  ===================================================== */

  lifecycle?.registerCleanup(() => {

    playBtn.removeEventListener('click', togglePlay)

    video.removeEventListener('play', onPlay)
    video.removeEventListener('pause', onPause)
    video.removeEventListener('timeupdate', updateTime)
    video.removeEventListener('loadedmetadata', updateTime)
    video.removeEventListener('volumechange', syncVolumeUI)

    muteBtn.removeEventListener('click', toggleMute)
    volumeSlider.removeEventListener('input', changeVolume)

    subtitleBtn.removeEventListener('click', onSubtitleClick)
    document.removeEventListener('pointerdown', onPointerDown)

    fullscreenBtn.removeEventListener('click', toggleFullscreen)
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
  })
}
