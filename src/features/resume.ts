/**
 * ChatyPlayer v1.0
 * Resume Playback Feature
 * ----------------------------------------
 * - Saves position in localStorage
 * - Restores safely
 * - Throttled saving
 * - Prevents restoring near end
 * - Lifecycle safe
 */

import type { Player } from '../core/Player';
import type { LifecycleManager } from '../core/lifecycle';
import type { StateManager } from '../core/state';
import { getItem, removeItem, setItem } from '../utils/storage';

const SAVE_INTERVAL = 5000; // 5 seconds
const MIN_DURATION = 30; // seconds
const END_THRESHOLD = 5; // seconds before end not to restore

export function initResumeFeature(
  player: Player,
  lifecycle?: LifecycleManager,
  state?: StateManager
) {
  const video = player.getVideo();

  let saveTimer: number | null = null;
  let restoredKey: string | null = null;

  const createSourceToken = (src: string): string => {
    let hash = 0;

    for (let i = 0; i < src.length; i += 1) {
      hash = (hash * 31 + src.charCodeAt(i)) >>> 0;
    }

    return hash.toString(36);
  };

  /**
   * Create safe storage key
   */
  const getStorageKey = (): string => {
    const src = video.currentSrc || video.src || 'unknown';
    return `resume:${createSourceToken(src)}`;
  };

  /**
   * Safe localStorage write
   */
  const savePosition = () => {
    if (!video.duration || video.duration < MIN_DURATION) return;
    if (!Number.isFinite(video.currentTime) || video.currentTime <= 0) return;

    const key = getStorageKey();

    if (video.currentTime >= video.duration - END_THRESHOLD) {
      removeItem(key);
      return;
    }

    setItem(key, video.currentTime);
  };

  /**
   * Restore saved position
   */
  const restorePosition = () => {
    if (!video.duration || video.duration < MIN_DURATION) return;

    const key = getStorageKey();
    if (restoredKey === key) return;

    const stored = getItem<number>(key);
    if (typeof stored !== 'number' || !Number.isFinite(stored)) return;

    restoredKey = key;

    if (stored > 0 && stored < video.duration - END_THRESHOLD) {
      video.currentTime = stored;
      state?.set('currentTime', stored);
    }
  };

  /**
   * Start periodic saving
   */
  const startSaving = () => {
    if (saveTimer !== null) return;

    saveTimer = window.setInterval(() => {
      savePosition();
    }, SAVE_INTERVAL);
  };

  /**
   * Stop saving
   */
  const stopSaving = () => {
    if (saveTimer !== null) {
      clearInterval(saveTimer);
      saveTimer = null;
    }
  };

  /**
   * Event handlers
   */
  const onPlay = () => startSaving();
  const onPause = () => savePosition();
  const onEnded = () => {
    stopSaving();
    removeItem(getStorageKey());
  };

  const onLoadedMetadata = () => {
    if (restoredKey !== getStorageKey()) {
      restorePosition();
    }
  };

  video.addEventListener('play', onPlay);
  video.addEventListener('pause', onPause);
  video.addEventListener('ended', onEnded);
  video.addEventListener('loadedmetadata', onLoadedMetadata);

  lifecycle?.registerCleanup(() => {
    stopSaving();
    video.removeEventListener('play', onPlay);
    video.removeEventListener('pause', onPause);
    video.removeEventListener('ended', onEnded);
    video.removeEventListener('loadedmetadata', onLoadedMetadata);
  });

  return {
    restorePosition
  };
}
