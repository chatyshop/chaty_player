/**
 * ChatyPlayer v1.0
 * Chapters Feature (Production Ready - Final)
 */

import type { Player } from '../core/Player'
import type { LifecycleManager } from '../core/lifecycle'
import type { StateManager } from '../core/state'

export interface Chapter {
  time: number
  title: string
}

export function initChaptersFeature(
  player: Player,
  chapters: Chapter[],
  timelineElement: HTMLElement,
  lifecycle?: LifecycleManager,
  state?: StateManager
) {

  const video = player.getVideo()
  const segments: HTMLElement[] = []

  /* visual gap between chapters (%) */
  const GAP_PERCENT = 0.35

  /* =========================================
     Validate + sort
  ========================================= */

  const validChapters: Chapter[] = Array.isArray(chapters)
    ? chapters
        .filter((c) =>
          c &&
          typeof c.time === 'number' &&
          Number.isFinite(c.time) &&
          c.time >= 0 &&
          typeof c.title === 'string'
        )
        .sort((a, b) => a.time - b.time)
    : []

  /* =========================================
     Render
  ========================================= */

  const renderChapters = (): void => {

    const duration = video.duration

    if (!Number.isFinite(duration) || duration <= 0) return
    if (!validChapters.length) return

    /* 🔥 CLEAR OLD SEGMENTS (IMPORTANT) */
    for (const seg of segments) {
      seg.remove()
    }
    segments.length = 0

    for (let i = 0; i < validChapters.length; i++) {

      const chapter = validChapters[i]!
      const next = validChapters[i + 1]

      const start = chapter.time
      const end = next ? next.time : duration

      if (start >= duration) continue

      let startPercent = (start / duration) * 100
      let widthPercent = ((end - start) / duration) * 100

      /* apply gap safely */
      if (i > 0) {
        startPercent += GAP_PERCENT / 2
      }

      if (i < validChapters.length - 1) {
        widthPercent = Math.max(0, widthPercent - GAP_PERCENT)
      }

      const segment = document.createElement('div')
      segment.className = 'chatyplayer-chapter-segment'

      segment.style.left = `${startPercent}%`
      segment.style.width = `${widthPercent}%`

      /* accessibility */
      segment.setAttribute('role', 'button')
      segment.setAttribute('tabindex', '0')
      segment.setAttribute('aria-label', chapter.title)
      segment.title = chapter.title // 🔥 tooltip

      /* seek */
      const seekToChapter = (): void => {

        const wasPlaying = !video.paused

        player.seek(start)
        state?.set?.('currentTime', start)

        if (wasPlaying) {
          player.play().catch(() => {})
        }
      }

      const onKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          seekToChapter()
        }
      }

      segment.addEventListener('click', seekToChapter)
      segment.addEventListener('keydown', onKeyDown)

      timelineElement.appendChild(segment)
      segments.push(segment)

      lifecycle?.registerCleanup(() => {
        segment.removeEventListener('click', seekToChapter)
        segment.removeEventListener('keydown', onKeyDown)
      })
    }
  }

  /* =========================================
     Active chapter highlight
  ========================================= */

  const updateActiveChapter = (): void => {

    const current = video.currentTime

    if (!Number.isFinite(current)) return
    if (!validChapters.length) return

    let activeIndex = 0

    for (let i = 0; i < validChapters.length; i++) {
      if (current >= validChapters[i]!.time) {
        activeIndex = i
      } else {
        break
      }
    }

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      if (!seg) continue

      if (i === activeIndex) {
        seg.classList.add('chatyplayer-chapter-active')
      } else {
        seg.classList.remove('chatyplayer-chapter-active')
      }
    }
  }

  /* =========================================
     Events
  ========================================= */

  const onLoadedMetadata = () => {
    renderChapters()
    updateActiveChapter()
  }

  const onTimeUpdate = () => {
    updateActiveChapter()
  }

  video.addEventListener('loadedmetadata', onLoadedMetadata)
  video.addEventListener('timeupdate', onTimeUpdate)

  /* =========================================
     Cleanup
  ========================================= */

  lifecycle?.registerCleanup(() => {

    video.removeEventListener('loadedmetadata', onLoadedMetadata)
    video.removeEventListener('timeupdate', onTimeUpdate)

    for (const seg of segments) {
      if (seg.parentNode === timelineElement) {
        timelineElement.removeChild(seg)
      }
    }

    segments.length = 0
  })

  return {
    refresh: renderChapters
  }
}