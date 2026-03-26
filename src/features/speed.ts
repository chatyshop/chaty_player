/**
 * ChatyPlayer v1.0
 * Playback Speed Feature
 * ----------------------------------------
 * - Validates playback rate
 * - Syncs with video element
 * - Updates state safely
 * - Emits speedchange event
 * - Lifecycle-safe cleanup
 */

import type { Player } from '../core/Player';
import type { LifecycleManager } from '../core/lifecycle';
import type { StateManager } from '../core/state';
import type { EventEmitter } from '../core/events';

const MIN_SPEED = 0.25;
const MAX_SPEED = 4;

export function initSpeedFeature(
  player: Player,
  lifecycle?: LifecycleManager,
  state?: StateManager,
  events?: EventEmitter
) {
  const video = player.getVideo();

  /**
   * Safely set playback speed
   */
  const setSpeed = (rate: number): void => {
    if (!isFinite(rate)) return;

    const clamped = Math.min(Math.max(rate, MIN_SPEED), MAX_SPEED);

    video.playbackRate = clamped;

    state?.set('speed', clamped);

    events?.emit('speedchange', clamped);
  };

  /**
   * Get current playback speed
   */
  const getSpeed = (): number => {
    return video.playbackRate;
  };

  /**
   * Reset to normal speed
   */
  const resetSpeed = (): void => {
    setSpeed(1);
  };

  /**
   * Sync state when metadata loads
   */
  const onLoadedMetadata = () => {
    state?.set('speed', video.playbackRate);
  };

  video.addEventListener('loadedmetadata', onLoadedMetadata);

  lifecycle?.registerCleanup(() => {
    video.removeEventListener('loadedmetadata', onLoadedMetadata);
  });

  return {
    setSpeed,
    getSpeed,
    resetSpeed
  };
}
