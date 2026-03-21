/**
 * ChatyPlayer v1.0
 * Feature Registry (Production Ready)
 * ----------------------------------------
 * - Wraps feature initializers
 * - Safe plugin interface adapter
 * - Defensive execution
 * - Clean destroy lifecycle
 * - Supports quality + chapters
 */

import type { Player } from '../core/Player'
import type { PlayerFeature } from '../types/Feature'

import { initFullscreenFeature } from './fullscreen'
import { initKeyboardFeature } from './keyboard'
import { initResumeFeature } from './resume'
import { initTheaterFeature } from './theater'

import { initGesturesFeature } from './gestures'
import { initTimestampFeature } from './timestamp'
import { initPiPFeature } from './pip'
import { initSpeedFeature } from './speed'

import { initQualityFeature } from './quality'
import { initChaptersFeature } from './chapters'
import { initSubtitlesFeature } from './subtitles'

/* =========================================
Utility: Safe Feature Wrapper
========================================= */

function wrapFeature(
name: string,
initializer: (player: Player) => void
): PlayerFeature {

return {

name,

init(player: Player): void {

  if (!player) return

  try {

    initializer(player)

  } catch (error) {

    console.error(
      `[ChatyPlayer] Feature "${name}" failed during init.`,
      error
    )

  }

},

destroy(player: Player): void {

  try {

    const destroyMethod =
      (player as unknown as Record<string, unknown>)[
        `destroy${capitalize(name)}`
      ]

    if (typeof destroyMethod === 'function') {
      (destroyMethod as Function).call(player)
    }

  } catch (error) {

    console.error(
      `[ChatyPlayer] Feature "${name}" failed during destroy.`,
      error
    )

  }

}

}

}

/* =========================================
Capitalize helper
========================================= */

function capitalize(value: string): string {

if (!value) return ''

return value.charAt(0).toUpperCase() + value.slice(1)

}

/* =========================================
Built-in Feature Set
========================================= */

export const builtInFeatures: PlayerFeature[] = [

/* ----------------------------------------
Core features
---------------------------------------- */

wrapFeature('fullscreen', initFullscreenFeature),
wrapFeature('theater', initTheaterFeature),
wrapFeature('keyboard', initKeyboardFeature),
wrapFeature('resume', initResumeFeature),


/* ----------------------------------------
Interaction
---------------------------------------- */

wrapFeature('gestures', initGesturesFeature),

/* ----------------------------------------
Utility features
---------------------------------------- */

wrapFeature('pip', initPiPFeature),
wrapFeature('speed', initSpeedFeature),
wrapFeature('timestamp', initTimestampFeature),

/* ----------------------------------------
Chapters Feature
---------------------------------------- */

wrapFeature('chapters', (player: Player) => {

try {

  const config = (player as any).config
  const lifecycle = (player as any).lifecycle
  const state = (player as any).state

  const chapters = config?.chapters

  if (!Array.isArray(chapters) || chapters.length === 0) return

  const timeline = player
    .getContainer()
    .querySelector('.chatyplayer-timeline-layer') as HTMLElement | null

  if (!timeline) return

  initChaptersFeature(
    player,
    chapters,
    timeline,
    lifecycle,
    state
  )

} catch (error) {

  console.error(
    '[ChatyPlayer] Chapters feature initialization failed.',
    error
  )

}

}),

/* ----------------------------------------
Subtitles Feature
----------------------------------------
WebVTT subtitles with language support
---------------------------------------- */

wrapFeature('subtitles', (player: Player) => {

try {

  const config = (player as any).config
  const lifecycle = (player as any).lifecycle
  const state = (player as any).state
  const events = (player as any).events

  const tracks = config?.subtitles

  if (!Array.isArray(tracks) || tracks.length === 0) return

  initSubtitlesFeature(
    player,
    tracks,
    lifecycle,
    state,
    events
  )

} catch (error) {

  console.error(
    '[ChatyPlayer] Subtitles feature initialization failed.',
    error
  )

}

}),

/* ----------------------------------------
Quality Feature
----------------------------------------
Supports:
- Auto
- 480p / 720p / 1080p
- Mixed formats (mp4/webm/ogg)
---------------------------------------- */

wrapFeature('quality', (player: Player) => {

try {

  const config = (player as any).config
  const lifecycle = (player as any).lifecycle
  const state = (player as any).state
  const events = (player as any).events

  if (!config) return

  const qualityAPI = initQualityFeature(
    player,
    config,
    lifecycle,
    state,
    events
  )

  if (qualityAPI) {
    (player as any).quality = qualityAPI
  }

} catch (error) {

  console.error(
    '[ChatyPlayer] Quality feature initialization failed.',
    error
  )

}

})

]