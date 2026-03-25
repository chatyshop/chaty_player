/**
 * ChatyPlayer v1.0
 * Timeline Module (Production Ready - Final Stable - FIXED)
 */

import type { Player } from '../core/Player';
import type { LifecycleManager } from '../core/lifecycle';
import type { StateManager } from '../core/state';

import { createTooltip } from './tooltip';
import { createThumbnail } from './thumbnail';

export function createTimeline(
  player: Player,
  mountPoint: HTMLElement,
  lifecycle?: LifecycleManager,
  state?: StateManager
): void {

  const video = player.getVideo();

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

  progressWrapper.appendChild(bufferBar);
  progressWrapper.appendChild(progressBar);
  progressWrapper.appendChild(seekInput);

  timelineContainer.appendChild(progressWrapper);
  mountPoint.appendChild(timelineContainer);

  /* ================= TOOLTIP + THUMB ================= */

  const updateTooltip = createTooltip(player, progressWrapper, lifecycle);
  const updateThumbnail = createThumbnail(player, progressWrapper);

  /* ================= STATE ================= */

  let isDragging = false;

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
    if (seekRAF) cancelAnimationFrame(seekRAF);

    seekRAF = requestAnimationFrame(() => {

      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const percent = parseFloat(seekInput.value);
      if (!Number.isFinite(percent)) return;

      const wasPlaying = !video.paused;

      const newTime = (percent / 100) * duration;

      player.seek(newTime);

      if (wasPlaying) {
        player.play().catch(() => {});
      }
    });
  };

  const onDragStart = (): void => {
    isDragging = true;
  };

  const onDragEnd = (): void => {
    isDragging = false;
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

    updateTooltip(previewTime, offsetX);
    updateThumbnail?.(previewTime, offsetX);
  };

  const onPointerMove = (e: PointerEvent) => {
    handlePreview(e.clientX);
  };

  const onPointerLeave = () => {
    updateTooltip(null);

    // 🔥 FIX: hide thumbnail properly
    updateThumbnail?.(NaN, 0);
  };

  progressWrapper.addEventListener('pointermove', onPointerMove, { passive: true });
  progressWrapper.addEventListener('pointerleave', onPointerLeave);

  /* ================= EVENTS ================= */

  seekInput.addEventListener('input', onSeekInput);

  seekInput.addEventListener('pointerdown', onDragStart);
  seekInput.addEventListener('pointerup', onDragEnd);
  seekInput.addEventListener('pointercancel', onDragEnd);

  seekInput.addEventListener('click', (e) => e.stopPropagation());

  /* ================= VIDEO ================= */

  const onLoadedMetadata = () => {
    updateProgress();
    updateBuffer();

    // 🔥 FIX: initialize thumbnail engine
    updateThumbnail?.(0, 0);
  };

  const onTimeUpdate = updateProgress;
  const onProgress = updateBuffer;

  video.addEventListener('loadedmetadata', onLoadedMetadata);
  video.addEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('progress', onProgress);

  /* ================= CLEANUP ================= */

  lifecycle?.registerCleanup(() => {

    if (seekRAF) cancelAnimationFrame(seekRAF);

    seekInput.removeEventListener('input', onSeekInput);
    seekInput.removeEventListener('pointerdown', onDragStart);
    seekInput.removeEventListener('pointerup', onDragEnd);
    seekInput.removeEventListener('pointercancel', onDragEnd);

    progressWrapper.removeEventListener('pointermove', onPointerMove);
    progressWrapper.removeEventListener('pointerleave', onPointerLeave);

    video.removeEventListener('loadedmetadata', onLoadedMetadata);
    video.removeEventListener('timeupdate', onTimeUpdate);
    video.removeEventListener('progress', onProgress);
  });
}