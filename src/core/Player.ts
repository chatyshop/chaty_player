/**
 * ChatyPlayer v1.0
 * Core Player Engine (Production Ready - Clean Mode System)
 * Player.ts
 * ----------------------------------------
 * - Single source of truth for mode
 * - No fullscreen API inside Player
 * - Feature-driven architecture
 * - Safe DOM handling
 * - Lifecycle safe
 */

import { PlayerConfig, VideoSource } from './config'
import { StateManager } from './state'
import { LifecycleManager } from './lifecycle'
import { EventEmitter } from './events'
import { createPublicAPI } from '../api/publicAPI'
import { createControls } from '../ui/controls'
import { createTimeline } from '../ui/timeline'
import { createMiniPlayer } from '../ui/miniPlayer'
import { selectBestSource } from '../utils/formats'
import type { InternalFeatureContext, PlayerFeature } from '../types/Feature'
import { builtInFeatures } from '../features/featureRegistry'

type PlayerMode = 'normal' | 'mini' | 'theatre' | 'fullscreen'

export class Player {

  private container: HTMLElement
  private video: HTMLVideoElement
  private wrapper!: HTMLElement
  private timelineLayer!: HTMLElement

  private config: PlayerConfig
  private events: EventEmitter
  private state: StateManager
  private lifecycle: LifecycleManager

  private destroyed = false
  private activeFeatures: PlayerFeature[] = []
  private hideTimeout?: number

  // 🔥 Single source of truth
  private mode: PlayerMode = 'normal'

  private isMobileTheatreDisabled(): boolean {
    return (
      typeof window !== 'undefined' &&
      (
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(hover: none)').matches
      )
    )
  }

  public getMode(): PlayerMode {
    return this.mode
  }

  private handleUIShow = () => {}
  private handlePause = () => {}
  private handlePlay = () => {}
  private handleCorePlay = () => {}
  private handleCorePause = () => {}
  private handleCoreEnded = () => {}
  private handleCoreTimeUpdate = () => {}
  private handleCoreLoadedMetadata = () => {}
  private handleCoreError = () => {}
  private cleanupAutoHideModeListener = () => {}

  public readonly api

  constructor(container: HTMLElement, config: PlayerConfig) {

    if (typeof window === 'undefined') {
      throw new Error('[ChatyPlayer] Cannot initialize on server.')
    }

    if (!(container instanceof HTMLElement)) {
      throw new Error('[ChatyPlayer] Invalid container element.')
    }

    this.container = container
    this.config = config
    this.events = new EventEmitter()
    this.state = new StateManager()
    this.lifecycle = new LifecycleManager()

    this.video = this.createVideoElement()
    this.api = createPublicAPI(this, this.events)
    this.mount()
    this.initCoreEvents()
    this.initAutoHide()
    this.initFeatures()
    this.initMiniPlayer()

    this.state.set('muted', this.video.muted)
    this.state.set('volume', this.video.volume)
    this.state.set('ready', true)
    this.events.emit('ready')
  }

  /* ========================================= */

  private createVideoElement(): HTMLVideoElement {

    const video = document.createElement('video')

    const connection = (navigator as any)?.connection
    video.preload = (connection?.saveData || connection?.effectiveType === '2g')
      ? 'none'
      : this.config.preload ?? 'metadata'

    video.playsInline = true
    video.controls = false
    video.crossOrigin = 'anonymous'

    if (this.config.poster) video.poster = this.config.poster

    const source = this.resolveInitialSource()
    if (!source || typeof source.src !== 'string' || !source.src.trim()) {
      throw new Error('[ChatyPlayer] No valid video source found.')
    }

    video.src = source.src

    video.muted = this.config.muted

    if (this.config.autoplay) {
      video.autoplay = true
      video.muted = true
    }

    if (this.config.loop) video.loop = true

    return video
  }

  /* ========================================= */

  private resolveInitialSource(): VideoSource | { src: string } | undefined {
    const direct = selectBestSource(this.config)
    if (direct) return direct
    if (Array.isArray(this.config.sources) && this.config.sources.length) {
      return this.config.sources[0]
    }
    return undefined
  }

  /* ========================================= */

  private mount(): void {

    this.container.textContent = ''
    this.container.classList.add('chatyplayer-root')

    const wrapper = document.createElement('div')
    wrapper.className = 'chatyplayer-video-wrapper'

    this.wrapper = wrapper
    wrapper.appendChild(this.video)

    this.timelineLayer = document.createElement('div')
    this.timelineLayer.className = 'chatyplayer-timeline-layer'

    const controlsLayer = document.createElement('div')
    controlsLayer.className = 'chatyplayer-controls-layer'

    wrapper.appendChild(this.timelineLayer)
    wrapper.appendChild(controlsLayer)

    this.container.appendChild(wrapper)

    createTimeline(this, this.timelineLayer, this.lifecycle, this.state)
    createControls(this, controlsLayer, this.lifecycle, this.state, this.events)
  }

  /* =========================================
     MODE SYSTEM (FINAL CLEAN)
  ========================================= */

  public setMode(next: PlayerMode): void {
    if (next === 'theatre' && this.isMobileTheatreDisabled()) return

    if (this.mode === next) return

    const prev = this.mode
    this.mode = next

    this.container.classList.remove(
      'chatyplayer-mini',
      'chatyplayer-theater',
      'chatyplayer-fullscreen'
    )

    this.container.classList.remove('hide-ui')

    switch (next) {
      case 'mini':
        this.container.classList.add('chatyplayer-mini')
        break

      case 'theatre':
        this.container.classList.add('chatyplayer-theater')
        break

      case 'fullscreen':
        this.container.classList.add('chatyplayer-fullscreen')
        break

      case 'normal':
      default:
        break
    }

    this.state.update({
      mini: next === 'mini',
      theater: next === 'theatre',
      fullscreen: next === 'fullscreen'
    })

    this.events.emit('modechange', { prev, next })
  }

  /* ========================================= */

  public toggleMini() {
    this.setMode(this.mode === 'mini' ? 'normal' : 'mini')
  }

  public toggleTheatre() {
    if (this.isMobileTheatreDisabled()) return
    this.setMode(this.mode === 'theatre' ? 'normal' : 'theatre')
  }

  public toggleFullscreen() {
    this.setMode(this.mode === 'fullscreen' ? 'normal' : 'fullscreen')
  }

  /* ========================================= */

  private initMiniPlayer(): void {
    try {
      createMiniPlayer(this, this.lifecycle, this.state)
    } catch (error) {
      console.warn('[ChatyPlayer] MiniPlayer failed.', error)
    }
  }

  /* ========================================= */

  private initAutoHide(): void {

    const isMobile = window.matchMedia('(pointer: coarse)').matches
    const delay = isMobile ? 3500 : 2000
    const shouldKeepControlsVisible = () =>
      isMobile && (this.mode === 'theatre' || this.mode === 'fullscreen')

    const clearHideTimeout = () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout)
        this.hideTimeout = undefined
      }
    }

    const scheduleHide = () => {
      clearHideTimeout()

      if (shouldKeepControlsVisible()) {
        this.container.classList.remove('hide-ui')
        return
      }

      this.hideTimeout = window.setTimeout(() => {
        if (!this.video.paused && !shouldKeepControlsVisible()) {
          this.container.classList.add('hide-ui')
        }
      }, delay)
    }

    this.handleUIShow = () => {
      if (this.destroyed) return

      this.container.classList.remove('hide-ui')
      scheduleHide()
    }

    this.handlePause = () => {
      clearHideTimeout()
      this.container.classList.remove('hide-ui')
    }

    this.handlePlay = () => {
      if (shouldKeepControlsVisible()) {
        clearHideTimeout()
        this.container.classList.remove('hide-ui')
        return
      }

      this.handleUIShow()
    }

    this.wrapper.addEventListener('pointermove', this.handleUIShow, { passive: true })
    this.wrapper.addEventListener('pointerdown', this.handleUIShow, { passive: true })
    this.wrapper.addEventListener('touchstart', this.handleUIShow, { passive: true })

    this.video.addEventListener('pause', this.handlePause)
    this.video.addEventListener('play', this.handlePlay)

    this.cleanupAutoHideModeListener = this.events.on('modechange', ({ next }) => {
      clearHideTimeout()
      this.container.classList.remove('hide-ui')

      if (!this.video.paused && next === 'normal') {
        scheduleHide()
      }
    })
  }

  /* ========================================= */

  private initCoreEvents(): void {

    const v = this.video

    this.handleCorePlay = () => this.events.emit('play')
    this.handleCorePause = () => this.events.emit('pause')
    this.handleCoreEnded = () => this.events.emit('ended')
    this.handleCoreTimeUpdate = () => this.events.emit('timeupdate', v.currentTime)
    this.handleCoreLoadedMetadata = () => {
      this.state.set('duration', v.duration)
      this.events.emit('loadedmetadata', v.duration)
    }
    this.handleCoreError = () => this.events.emit('error', v.error)

    v.addEventListener('play', this.handleCorePlay)
    v.addEventListener('pause', this.handleCorePause)
    v.addEventListener('ended', this.handleCoreEnded)
    v.addEventListener('timeupdate', this.handleCoreTimeUpdate)
    v.addEventListener('loadedmetadata', this.handleCoreLoadedMetadata)
    v.addEventListener('error', this.handleCoreError)
  }

  /* ========================================= */

  private initFeatures(): void {

    if (this.destroyed) return

    const features = this.config.features ?? builtInFeatures

    for (const f of features) {
      try {
        f.init(this)
        this.activeFeatures.push(f)
      } catch (e) {
        console.error(`[ChatyPlayer] Feature "${f.name}" failed.`, e)
      }
    }
  }

  /* ========================================= */

  public play() { return this.video.play() }
  public pause() { this.video.pause() }
  public toggle() { this.video.paused ? this.play() : this.pause() }

  public seek(t: number) {
    if (!Number.isFinite(t)) return
    const d = this.video.duration || 0
    this.video.currentTime = Math.max(0, Math.min(t, d))
  }

  public setVolume(v: number) {
    if (!Number.isFinite(v)) return
    this.video.volume = Math.max(0, Math.min(v, 1))
  }

  public setSpeed(r: number) {
    if (!Number.isFinite(r) || r <= 0) return
    this.video.playbackRate = r
    this.state.set('speed', r)
    this.events.emit('speedchange', r)
  }

  /* ========================================= */

  public getVideo() { return this.video }
  public getContainer() { return this.container }
  public getTimeline() { return this.timelineLayer }
  public getConfig() { return this.config }
  public getEvents() { return this.events }
  public getFeatureContext(): InternalFeatureContext {
    return {
      lifecycle: this.lifecycle,
      state: this.state,
      events: this.events,
      config: this.config
    }
  }

  /* ========================================= */

  public destroy(): void {

    if (this.destroyed) return

    delete (this.container as HTMLElement & {
      __chatyPlayerInstance__?: Player
    }).__chatyPlayerInstance__

    this.pause()

    if (this.hideTimeout) clearTimeout(this.hideTimeout)

    this.wrapper.removeEventListener('pointermove', this.handleUIShow)
    this.wrapper.removeEventListener('pointerdown', this.handleUIShow)
    this.wrapper.removeEventListener('touchstart', this.handleUIShow)

    this.video.removeEventListener('pause', this.handlePause)
    this.video.removeEventListener('play', this.handlePlay)
    this.video.removeEventListener('play', this.handleCorePlay)
    this.video.removeEventListener('pause', this.handleCorePause)
    this.video.removeEventListener('ended', this.handleCoreEnded)
    this.video.removeEventListener('timeupdate', this.handleCoreTimeUpdate)
    this.video.removeEventListener('loadedmetadata', this.handleCoreLoadedMetadata)
    this.video.removeEventListener('error', this.handleCoreError)
    this.cleanupAutoHideModeListener()

    for (const f of this.activeFeatures) {
      try { f.destroy?.(this) } catch {}
    }

    this.events.emit('destroy')
    this.lifecycle.destroy(this, this.state, this.events)
    this.container.classList.remove('chatyplayer-root')

    this.activeFeatures = []
    this.destroyed = true
  }
}
