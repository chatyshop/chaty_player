/**
 * ChatyPlayer v1.0
 * thumbnail.ts
 * Timeline Thumbnail Renderer (Production Ready - Final)
 */

import type { Player } from '../core/Player';
import type { ThumbnailConfig } from '../core/config';

export type ThumbnailUpdater = (
  time: number,
  position: number
) => void;

export function createThumbnail(
  player: Player,
  container: HTMLElement,
  lifecycle?: { registerCleanup?: (fn: () => void) => void }
): ThumbnailUpdater | null {

  const config = player.getConfig();
  if (!config?.thumbnails) return null;

  const thumbs: ThumbnailConfig = config.thumbnails;

  const {
    src,
    width,
    height,
    columns,
    rows,
    interval
  } = thumbs;

  /* ----------------------------------
     Validation
  ---------------------------------- */

  if (
    !src ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(columns) ||
    !Number.isFinite(rows) ||
    !Number.isFinite(interval) ||
    width <= 0 ||
    height <= 0 ||
    columns <= 0 ||
    rows <= 0 ||
    interval <= 0
  ) {
    console.warn('[ChatyPlayer] Invalid thumbnail configuration.');
    return null;
  }

  /* ----------------------------------
     Safe URL
  ---------------------------------- */

  let safeSrc: string;
  try {
    const url = new URL(src, window.location.origin);
    safeSrc = url.toString();
  } catch {
    console.warn('[ChatyPlayer] Invalid thumbnail src');
    return null;
  }

  /* ----------------------------------
     Preload (non-blocking)
  ---------------------------------- */

  const preload = new Image();
  preload.src = safeSrc;

  /* ----------------------------------
     Thumbnail Element
  ---------------------------------- */

  const thumb = document.createElement('div');
  thumb.className = 'chatyplayer-thumbnail';

  thumb.style.position = 'absolute';
  thumb.style.pointerEvents = 'none';
  thumb.style.backgroundImage = `url("${safeSrc}")`;
  thumb.style.backgroundRepeat = 'no-repeat';
  thumb.style.backgroundSize = `${columns * width}px ${rows * height}px`;
  thumb.style.width = `${width}px`;
  thumb.style.height = `${height}px`;
  thumb.style.display = 'none';
  thumb.style.willChange = 'transform';
  thumb.style.zIndex = '100';

  /* ----------------------------------
     Label
  ---------------------------------- */

  const label = document.createElement('div');
  label.className = 'chatyplayer-thumb-time';

  thumb.appendChild(label);
  container.appendChild(thumb);

  const maxFrames = columns * rows;

  /* ----------------------------------
     Cached container size (PERF FIX)
  ---------------------------------- */

  let containerWidth = 0;

  const updateContainerSize = () => {
    containerWidth = container.getBoundingClientRect().width;
  };

  updateContainerSize();
  window.addEventListener('resize', updateContainerSize);

  /* ----------------------------------
     Time Formatter
  ---------------------------------- */

  const formatTime = (t: number): string => {
    if (!Number.isFinite(t)) return '0:00';

    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);

    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /* ----------------------------------
     RAF Optimization
  ---------------------------------- */

  let rafId: number | null = null;

  const update: ThumbnailUpdater = (time, position) => {

    /* Hide safely */
    if (!Number.isFinite(time)) {
      thumb.style.display = 'none';
      return;
    }

    if (rafId !== null) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {

      /* Frame */
      const frameIndex = Math.floor(time / interval);
      const safeIndex = Math.min(
        Math.max(frameIndex, 0),
        maxFrames - 1
      );

      const col = safeIndex % columns;
      const row = Math.floor(safeIndex / columns);

      const bgX = -(col * width);
      const bgY = -(row * height);

      thumb.style.backgroundPosition = `${bgX}px ${bgY}px`;

      /* Position */
      const safeLeft = Math.max(
        width / 2,
        Math.min(position, containerWidth - width / 2)
      ) - width / 2;

      thumb.style.transform = `translate(${safeLeft}px, -${height + 12}px)`;

      /* Label */
      label.textContent = formatTime(time);

      /* Show */
      if (thumb.style.display !== 'block') {
        thumb.style.display = 'block';
      }
    });
  };

  /* ----------------------------------
     Hide Logic
  ---------------------------------- */

  const hide = () => {
    thumb.style.display = 'none';
  };

  container.addEventListener('mouseleave', hide);
  container.addEventListener('touchend', hide);
  container.addEventListener('touchcancel', hide);

  /* ----------------------------------
     Cleanup (IMPORTANT)
  ---------------------------------- */

  lifecycle?.registerCleanup?.(() => {
    if (rafId) cancelAnimationFrame(rafId);

    container.removeEventListener('mouseleave', hide);
    container.removeEventListener('touchend', hide);
    container.removeEventListener('touchcancel', hide);

    window.removeEventListener('resize', updateContainerSize);

    thumb.remove();
  });

  return update;
}