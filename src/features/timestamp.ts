/**
 * ChatyPlayer v1.0
 * Timestamp Share Feature
 * ----------------------------------------
 * - Parse ?t= or #t=
 * - Supports 120, 1m30s formats
 * - Safe input validation
 * - No DOM injection
 * - Lifecycle safe
 */

import type { Player } from '../core/Player';
import type { LifecycleManager } from '../core/lifecycle';

function parseTimeString(value: string): number | null {
  if (!value) return null;

  // Numeric seconds
  if (/^\d+$/.test(value)) {
    const seconds = parseInt(value, 10);
    return isFinite(seconds) ? seconds : null;
  }

  // YouTube style (1m30s, 2h1m5s)
  const regex = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
  const match = value.match(regex);

  if (!match) return null;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const total = hours * 3600 + minutes * 60 + seconds;

  if (!match[1] && !match[2] && !match[3]) return null;

  return isFinite(total) && total >= 0 ? total : null;
}

export function initTimestampFeature(
  player: Player,
  lifecycle?: LifecycleManager
) {
  const video = player.getVideo();
  let appliedTimestamp = false;

  /**
   * Extract timestamp from URL
   */
  const getTimestampFromURL = (): number | null => {
    if (typeof window === 'undefined') return null;

    const url = new URL(window.location.href);

    const queryParam = url.searchParams.get('t');
    const hashMatch = url.hash.match(/t=([^&]+)/);

    const raw = queryParam || (hashMatch ? hashMatch[1] : null);

    if (!raw) return null;

    return parseTimeString(raw);
  };

  /**
   * Seek on metadata load
   */
  const applyTimestamp = () => {
    if (appliedTimestamp) return;

    const timestamp = getTimestampFromURL();
    if (timestamp === null) return;

    if (!video.duration) return;

    const safeTime = Math.min(timestamp, video.duration - 1);
    player.seek(safeTime);
    appliedTimestamp = true;
  };

  /**
   * Generate shareable link
   */
  const getTimestampLink = (): string | null => {
    if (typeof window === 'undefined') return null;

    const currentTime = Math.floor(video.currentTime || 0);
    const url = new URL(window.location.href);

    url.searchParams.set('t', String(currentTime));
    if (url.hash.includes('t=')) {
      url.hash = '';
    }

    return url.toString();
  };

  video.addEventListener('loadedmetadata', applyTimestamp);

  lifecycle?.registerCleanup(() => {
    video.removeEventListener('loadedmetadata', applyTimestamp);
  });

  ;(player as any).getTimestampLink = getTimestampLink;

  return {
    getTimestampLink
  };
}
