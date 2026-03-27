/**
 * ChatyPlayer v1.0
 * Timeline Module (Production Ready - Final Stable - FIXED)
 */

import type { Player } from '../core/Player';
import type { LifecycleManager } from '../core/lifecycle';
import type { StateManager } from '../core/state';
import type { ThumbnailConfig } from '../core/config';

import { createTooltip } from './tooltip';
import { createThumbnail } from './thumbnail';

export function createTimeline(
  player: Player,
  mountPoint: HTMLElement,
  lifecycle?: LifecycleManager,
  state?: StateManager
): void {

  const video = player.getVideo();
  const container = player.getContainer();
  const events = player.getEvents();
  const thumbnailConfig = player.getConfig().thumbnails;
  const isMobilePreviewMode = (): boolean =>
    typeof window !== 'undefined' &&
    (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(hover: none)').matches
    )

  /* ================= DOM ================= */

  const timelineContainer = document.createElement('div');
  timelineContainer.className = 'chatyplayer-timeline';

  const progressWrapper = document.createElement('div');
  progressWrapper.className = 'chatyplayer-progress-wrapper';

  const bufferBar = document.createElement('div');
  bufferBar.className = 'chatyplayer-buffer';

  const progressBar = document.createElement('div');
  progressBar.className = 'chatyplayer-progress';

  const seekInput = document.createElement('input');
  seekInput.type = 'range';
  seekInput.min = '0';
  seekInput.max = '100';
  seekInput.step = '0.1';
  seekInput.value = '0';
  seekInput.className = 'chatyplayer-seek';
  seekInput.setAttribute('aria-label', 'Seek');

  const mobileStrip = document.createElement('div');
  mobileStrip.className = 'chatyplayer-mobile-strip';

  const mobileStripTrack = document.createElement('div');
  mobileStripTrack.className = 'chatyplayer-mobile-strip-track';

  const mobileStripMarker = document.createElement('div');
  mobileStripMarker.className = 'chatyplayer-mobile-strip-marker';

  mobileStrip.appendChild(mobileStripTrack);
  mobileStrip.appendChild(mobileStripMarker);

  progressWrapper.appendChild(bufferBar);
  progressWrapper.appendChild(progressBar);
  progressWrapper.appendChild(seekInput);

  timelineContainer.appendChild(progressWrapper);
  timelineContainer.appendChild(mobileStrip);
  mountPoint.appendChild(timelineContainer);

  /* ================= TOOLTIP + THUMB ================= */

  const updateTooltip = createTooltip(player, progressWrapper, lifecycle);
  const updateThumbnail = createThumbnail(player, progressWrapper, lifecycle);

  /* ================= STATE ================= */

  let isDragging = false;
  let wasPlayingBeforeDrag = false;
  let mobilePointerId: number | null = null;
  let pendingMobileTime: number | null = null;

  const mobileStripTiles: HTMLElement[] = [];
  const MOBILE_STRIP_TILE_COUNT = 3;

  const createMobileStrip = (thumbs?: ThumbnailConfig): void => {
    if (!thumbs) return;

    let safeSrc: string;
    try {
      safeSrc = new URL(thumbs.src, window.location.href).toString();
    } catch {
      return;
    }

    for (let i = 0; i < MOBILE_STRIP_TILE_COUNT; i++) {
      const tile = document.createElement('div');
      tile.className = 'chatyplayer-mobile-strip-tile';
      tile.style.backgroundImage = `url("${safeSrc}")`;
      tile.style.backgroundRepeat = 'no-repeat';
      tile.style.backgroundSize = `${thumbs.columns * thumbs.width}px ${thumbs.rows * thumbs.height}px`;
      mobileStripTrack.appendChild(tile);
      mobileStripTiles.push(tile);
    }
  };

  const updateMobileStrip = (time: number): void => {
    if (!thumbnailConfig || !mobileStripTiles.length) return;

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const { width, height, columns, rows, interval } = thumbnailConfig;
    const maxFrames = columns * rows;
    const centerIndex = Math.floor(time / interval);
    const half = Math.floor(MOBILE_STRIP_TILE_COUNT / 2);

    mobileStripTiles.forEach((tile, index) => {
      const frameIndex = Math.min(
        Math.max(centerIndex + index - half, 0),
        maxFrames - 1
      );
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);
      const tileWidth = tile.clientWidth || width;
      const tileHeight = tile.clientHeight || height;
      tile.style.backgroundSize = `${columns * tileWidth}px ${rows * tileHeight}px`;
      tile.style.backgroundPosition = `${-(col * tileWidth)}px ${-(row * tileHeight)}px`;
    });
  };

  const showMobileStrip = (): void => {
    if (!thumbnailConfig || !isMobilePreviewMode()) return;
    mobileStrip.classList.add('is-visible');
  };

  const hideMobileStrip = (): void => {
    mobileStrip.classList.remove('is-visible');
  };

  createMobileStrip(thumbnailConfig);

  /* ================= PROGRESS ================= */

  const updateProgress = (): void => {
    const duration = video.duration;

    if (!Number.isFinite(duration) || duration <= 0) return;

    const current = video.currentTime;
    const percent = (current / duration) * 100;

    progressBar.style.width = `${percent}%`;

    if (!isDragging) {
      seekInput.value = String(percent);
    }

    state?.set?.('currentTime', current);
    state?.set?.('duration', duration);
  };

  const updateBuffer = (): void => {
    const duration = video.duration;

    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !video.buffered ||
      video.buffered.length === 0
    ) return;

    try {
      const bufferedEnd =
        video.buffered.end(video.buffered.length - 1);

      const percent = (bufferedEnd / duration) * 100;

      bufferBar.style.width = `${percent}%`;

    } catch {
      // safe ignore
    }
  };

  /* ================= SEEK ================= */

  let seekRAF: number | null = null;

  const onSeekInput = (): void => {
    if (isMobilePreviewMode()) return;

    if (seekRAF) cancelAnimationFrame(seekRAF);

    seekRAF = requestAnimationFrame(() => {

      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const percent = parseFloat(seekInput.value);
      if (!Number.isFinite(percent)) return;

      const newTime = (percent / 100) * duration;
      const previewOffset =
        (percent / 100) * progressWrapper.getBoundingClientRect().width;

      if (!isMobilePreviewMode()) {
        updateTooltip(newTime, previewOffset);
        updateThumbnail?.(newTime, previewOffset);
      }

      player.seek(newTime);
    });
  };

  const onDragStart = (): void => {
    if (isDragging) return;

    isDragging = true;
    wasPlayingBeforeDrag = !video.paused;
    container.classList.add('chatyplayer-preview-open');
    state?.set?.('scrubbing', true);
    events.emit('scrubstart', video.currentTime);

    if (isMobilePreviewMode() && wasPlayingBeforeDrag) {
      player.pause();
    }

    if (isMobilePreviewMode()) {
      showMobileStrip();
    }
  };

  const onDragEnd = (): void => {
    if (!isDragging) return;

    isDragging = false;
    container.classList.remove('chatyplayer-preview-open');
    updateTooltip(null);
    updateThumbnail?.(NaN, 0);
    state?.set?.('scrubbing', false);
    events.emit('scrubend', video.currentTime);

    if (isMobilePreviewMode() && pendingMobileTime !== null) {
      player.seek(pendingMobileTime);
      pendingMobileTime = null;
    }

    if (isMobilePreviewMode() && wasPlayingBeforeDrag) {
      player.play().catch(() => {});
    }

    hideMobileStrip();
    wasPlayingBeforeDrag = false;
  };

  const seekFromClientX = (clientX: number): void => {
    const rect = progressWrapper.getBoundingClientRect();
    if (!rect.width) return;

    const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const newTime = percent * duration;

    progressBar.style.width = `${percent * 100}%`;
    seekInput.value = String(percent * 100);

    if (isMobilePreviewMode()) {
      pendingMobileTime = newTime;
      updateMobileStrip(newTime);
      events.emit('scrubmove', newTime);
      return;
    }

    video.currentTime = newTime;
    state?.set?.('currentTime', newTime);
    state?.set?.('duration', duration);
    events.emit('scrubmove', newTime);
  };

  /* ================= HOVER / TOUCH ================= */

  const handlePreview = (clientX: number) => {
    const rect = progressWrapper.getBoundingClientRect();
    if (!rect.width) return;

    const offsetX = clientX - rect.left;

    const percent = Math.min(
      Math.max(offsetX / rect.width, 0),
      1
    );

    const duration = video.duration;

    // 🔥 FIX: safe duration check
    if (!Number.isFinite(duration) || duration <= 0) return;

    const previewTime = percent * duration;

    if (isMobilePreviewMode()) return;

    container.classList.add('chatyplayer-preview-open');
    updateTooltip(previewTime, offsetX);
    updateThumbnail?.(previewTime, offsetX);
  };

  const onPointerMove = (e: PointerEvent) => {
    handlePreview(e.clientX);
  };

  const onPointerLeave = () => {
    container.classList.remove('chatyplayer-preview-open');
    updateTooltip(null);

    // 🔥 FIX: hide thumbnail properly
    updateThumbnail?.(NaN, 0);
  };

  const onMobilePointerDown = (e: PointerEvent): void => {
    if (!isMobilePreviewMode()) return;
    if (e.pointerType === 'mouse') return;

    e.preventDefault();
    mobilePointerId = e.pointerId;
    try {
      progressWrapper.setPointerCapture(e.pointerId);
    } catch {}
    onDragStart();
    seekFromClientX(e.clientX);
  };

  const onMobilePointerMove = (e: PointerEvent): void => {
    if (!isMobilePreviewMode()) return;
    if (!isDragging || mobilePointerId !== e.pointerId) return;

    e.preventDefault();
    seekFromClientX(e.clientX);
  };

  const onMobilePointerUp = (e: PointerEvent): void => {
    if (!isMobilePreviewMode()) return;
    if (mobilePointerId !== e.pointerId) return;

    try {
      progressWrapper.releasePointerCapture(e.pointerId);
    } catch {}

    mobilePointerId = null;
    onDragEnd();
  };

  progressWrapper.addEventListener('pointermove', onPointerMove, { passive: true });
  progressWrapper.addEventListener('pointerleave', onPointerLeave);
  progressWrapper.addEventListener('pointerdown', onMobilePointerDown);
  window.addEventListener('pointermove', onMobilePointerMove, { passive: false });
  window.addEventListener('pointerup', onMobilePointerUp);
  window.addEventListener('pointercancel', onMobilePointerUp);

  const onSeekClick = (e: Event): void => {
    e.stopPropagation();
  };

  const onSeekPointerDown = (): void => {
    if (isMobilePreviewMode()) return;
    onDragStart();
  };

  const onSeekPointerUp = (): void => {
    if (isMobilePreviewMode()) return;
    onDragEnd();
  };

  /* ================= EVENTS ================= */

  seekInput.addEventListener('input', onSeekInput);

  seekInput.addEventListener('pointerdown', onSeekPointerDown);
  seekInput.addEventListener('pointerup', onSeekPointerUp);
  seekInput.addEventListener('pointercancel', onSeekPointerUp);

  seekInput.addEventListener('click', onSeekClick);

  /* ================= VIDEO ================= */

  const onLoadedMetadata = () => {
    updateProgress();
    updateBuffer();
  };

  const onTimeUpdate = updateProgress;
  const onProgress = updateBuffer;

  video.addEventListener('loadedmetadata', onLoadedMetadata);
  video.addEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('progress', onProgress);

  /* ================= CLEANUP ================= */

  lifecycle?.registerCleanup(() => {

    if (seekRAF) cancelAnimationFrame(seekRAF);
    state?.set?.('scrubbing', false);

    seekInput.removeEventListener('input', onSeekInput);
    seekInput.removeEventListener('pointerdown', onSeekPointerDown);
    seekInput.removeEventListener('pointerup', onSeekPointerUp);
    seekInput.removeEventListener('pointercancel', onSeekPointerUp);
    seekInput.removeEventListener('click', onSeekClick);

    progressWrapper.removeEventListener('pointermove', onPointerMove);
    progressWrapper.removeEventListener('pointerleave', onPointerLeave);
    progressWrapper.removeEventListener('pointerdown', onMobilePointerDown);
    window.removeEventListener('pointermove', onMobilePointerMove);
    window.removeEventListener('pointerup', onMobilePointerUp);
    window.removeEventListener('pointercancel', onMobilePointerUp);
    container.classList.remove('chatyplayer-preview-open');
    hideMobileStrip();
    pendingMobileTime = null;

    video.removeEventListener('loadedmetadata', onLoadedMetadata);
    video.removeEventListener('timeupdate', onTimeUpdate);
    video.removeEventListener('progress', onProgress);
  });
}
