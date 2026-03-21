/**
 * ChatyPlayer v1.0
 * Theater Mode Feature (Viewport Fill Version)
 * theater.ts
 * ----------------------------------------
 * - Fills entire browser viewport
 * - No Fullscreen API
 * - No scroll
 * - Safe cleanup
 * - State synced
 */

import type { Player } from '../core/Player';
import type { LifecycleManager } from '../core/lifecycle';
import type { StateManager } from '../core/state';
import type { EventEmitter } from '../core/events';

export function initTheaterFeature(
  player: Player,
  lifecycle?: LifecycleManager,
  state?: StateManager,
  events?: EventEmitter
) {
  const container = player.getContainer();
  const wrapper = container.querySelector(
    '.chatyplayer-video-wrapper'
  ) as HTMLElement | null;

  const ROOT_CLASS = 'chatyplayer-theater-active';

  const originalStyles: Record<string, string> = {};

  const saveStyles = () => {
    const elements = [container, wrapper].filter(Boolean) as HTMLElement[];

    elements.forEach((el) => {
      ['position', 'inset', 'width', 'height', 'maxWidth', 'margin', 'aspectRatio', 'zIndex']
        .forEach((prop) => {
          originalStyles[`${el.className}-${prop}`] = (el.style as any)[prop] || '';
        });
    });
  };

  const restoreStyles = () => {
    const elements = [container, wrapper].filter(Boolean) as HTMLElement[];

    elements.forEach((el) => {
      ['position', 'inset', 'width', 'height', 'maxWidth', 'margin', 'aspectRatio', 'zIndex']
        .forEach((prop) => {
          const key = `${el.className}-${prop}`;
          (el.style as any)[prop] = originalStyles[key] || '';
        });
    });
  };

  const isTheater = () =>
    container.classList.contains(ROOT_CLASS);

  const enableTheater = () => {
    if (isTheater()) return;

    saveStyles();

    container.classList.add(ROOT_CLASS);

    // Fill viewport
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.margin = '0';
    container.style.maxWidth = 'none';
    container.style.zIndex = '9999';

    if (wrapper) {
      wrapper.style.aspectRatio = 'auto';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
    }

    document.body.style.overflow = 'hidden';

    state?.set('theater', true);
    events?.emit('theaterchange' as any, true);
  };

  const disableTheater = () => {
    if (!isTheater()) return;

    container.classList.remove(ROOT_CLASS);

    restoreStyles();

    document.body.style.overflow = '';

    state?.set('theater', false);
    events?.emit('theaterchange' as any, false);
  };

  const toggleTheater = () => {
    isTheater() ? disableTheater() : enableTheater();
  };

  (player as any).toggleTheater = toggleTheater;

  lifecycle?.registerCleanup(() => {
    disableTheater();
  });

  return {
    enableTheater,
    disableTheater,
    toggleTheater,
    isTheater
  };
}