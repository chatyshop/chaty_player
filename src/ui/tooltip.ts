/**
 * ChatyPlayer v1.0
 * Timeline Tooltip Module (Production Ready)
 * ----------------------------------------
 * - Hover timestamp preview
 * - Optional chapter title (only if thumbnails enabled)
 * - Safe DOM creation
 * - No HTML injection
 * - Strict TypeScript safe
 * - SSR safe
 * - Lifecycle-safe cleanup
 */

import type { Player } from '../core/Player'
import type { LifecycleManager } from '../core/lifecycle'
import type { Chapter } from '../core/config'

export type TooltipUpdater = (
  time: number | null,
  position?: number
) => void

export function createTooltip(
  player: Player,
  timelineElement: HTMLElement,
  lifecycle?: LifecycleManager
): TooltipUpdater {

  const video = player.getVideo()
  const config = player.getConfig()

  const chapters: Chapter[] = Array.isArray(config.chapters)
    ? config.chapters
    : []

  const hasChapterTitles = chapters.length > 0

  /* =========================================
     Tooltip Element
  ========================================= */

  const tooltip = document.createElement('div')

  tooltip.className = 'chatyplayer-tooltip'

  tooltip.style.position = 'absolute'
  tooltip.style.pointerEvents = 'none'
  tooltip.style.display = 'none'

  timelineElement.appendChild(tooltip)

  /* =========================================
     Utilities
  ========================================= */

  const formatTime = (seconds: number): string => {

    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00'
    }

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)

    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const clamp = (
    value: number,
    min: number,
    max: number
  ): number => {

    return Math.min(Math.max(value, min), max)

  }

  /* =========================================
     Chapter lookup
  ========================================= */

  const getChapterTitle = (time: number): string | null => {

    if (!chapters.length) return null

    let active: Chapter | null = null

    for (const chapter of chapters) {

      if (time >= chapter.time) {
        active = chapter
      } else {
        break
      }

    }

    return active?.title ?? null

  }

  /* =========================================
     Update Tooltip
  ========================================= */

  const update: TooltipUpdater = (time, position) => {

    if (time === null) {
      tooltip.style.display = 'none'
      tooltip.classList.remove('is-visible')
      return
    }

    if (!Number.isFinite(time)) {
      tooltip.style.display = 'none'
      tooltip.classList.remove('is-visible')
      return
    }

    const formatted = formatTime(time)

    /* show chapter title whenever chapters exist */

    if (hasChapterTitles) {

      const chapterTitle = getChapterTitle(time)

      tooltip.textContent = chapterTitle
        ? `${formatted}  ${chapterTitle}`
        : formatted

    } else {

      tooltip.textContent = formatted

    }

    const rect = timelineElement.getBoundingClientRect()
    const videoWrapper = timelineElement.closest('.chatyplayer-video-wrapper') as HTMLElement | null

    tooltip.style.display = 'block'
    tooltip.classList.add('is-visible')

    const tooltipWidth = tooltip.offsetWidth || 40
    const tooltipHeight = tooltip.offsetHeight || 24

    const safePosition = clamp(
      (position ?? 0) - tooltipWidth / 2,
      0,
      rect.width - tooltipWidth
    )

    const thumbnail = timelineElement.querySelector('.chatyplayer-thumbnail') as HTMLElement | null
    const thumbnailHeight =
      thumbnail && thumbnail.style.display !== 'none'
        ? thumbnail.getBoundingClientRect().height
        : 0
    const desiredBottomOffset = Math.round(thumbnailHeight + 18)
    const maxBottomOffset = videoWrapper
      ? Math.max(
          12,
          Math.floor(rect.top + rect.height - videoWrapper.getBoundingClientRect().top - tooltipHeight - 8)
        )
      : desiredBottomOffset

    tooltip.style.left = `${safePosition}px`
    tooltip.style.bottom = `calc(100% + ${Math.min(desiredBottomOffset, maxBottomOffset)}px)`

  }

  /* =========================================
     Cleanup
  ========================================= */

  lifecycle?.registerCleanup(() => {

    if (tooltip.parentElement === timelineElement) {
      timelineElement.removeChild(tooltip)
    }

  })

  return update

}
