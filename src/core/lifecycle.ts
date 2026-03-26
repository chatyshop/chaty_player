/**
 * ChatyPlayer v1.0
 * Lifecycle Manager (Production Ready - Mobile Optimized)
 * ----------------------------------------
 * - Handles mount & destroy flow
 * - Prevents double initialization
 * - Prevents memory leaks
 * - Coordinates cleanup across modules
 * - Mobile optimized (iOS Safari safe)
 * - Battery efficient (visibility + page lifecycle)
 */

import type { Player } from './Player';
import type { StateManager } from './state';
import type { EventEmitter } from './events';

export class LifecycleManager {
  private mounted: boolean = false;
  private destroyed: boolean = false;
  private cleanupTasks: Set<() => void> = new Set();

  /**
   * Mark player as mounted
   */
  public markMounted(): void {
    if (this.destroyed) {
      console.warn('[ChatyPlayer] Cannot mount. Player already destroyed.');
      return;
    }

    if (this.mounted) {
      console.warn('[ChatyPlayer] Player already mounted.');
      return;
    }

    this.mounted = true;
  }

  /**
   * Register cleanup callback
   * Used by features/modules to auto-clean on destroy
   */
  public registerCleanup(task: () => void): void {
    if (typeof task !== 'function') return;

    if (this.destroyed) {
      try {
        task();
      } catch (error) {
        console.error('[ChatyPlayer] Cleanup task failed:', error);
      }
      return;
    }

    this.cleanupTasks.add(task);
  }

  /**
   * Attach mobile lifecycle optimizations
   */
  public attachMobileLifecycle(player: Player): void {
    // Pause on tab/app switch
    const handleVisibility = () => {
      if (document.hidden) {
        try {
          player.pause();
        } catch {}
      }
    };

    // Pause on page unload (iOS + modern browsers)
    const handlePageHide = () => {
      try {
        player.pause();
      } catch {}
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    // Auto cleanup
    this.registerCleanup(() => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    });
  }

  /**
   * Execute full destruction lifecycle
   */
  public destroy(
    player: Player,
    state?: StateManager,
    events?: EventEmitter
  ): void {
    if (this.destroyed) return;

    // 🔒 Prevent race conditions (important for mobile rapid taps)
    this.destroyed = true;
    this.mounted = false;

    try {
      // Pause playback safely
      try {
        player.pause();
      } catch {}

      // Run registered cleanups before tearing down shared systems.
      this.cleanupTasks.forEach((task) => {
        try {
          task();
        } catch (error) {
          console.error('[ChatyPlayer] Cleanup error:', error);
        }
      });

      this.cleanupTasks.clear();

      // Clear state listeners
      if (state) {
        try {
          state.markDestroyed();
        } catch (error) {
          console.error('[ChatyPlayer] State destroy error:', error);
        }
      }

      // Clear event listeners
      if (events) {
        try {
          events.destroy();
        } catch (error) {
          console.error('[ChatyPlayer] Event destroy error:', error);
        }
      }

      // Clear video source safely (CRITICAL for mobile & HLS)
      const video = player.getVideo();
      if (video) {
        try {
          video.pause();
        } catch {}

        try {
          video.removeAttribute('src');
          // @ts-ignore
          video.srcObject = null;
        } catch {}

        try {
          // Remove <source> children (Safari fix)
          while (video.firstChild) {
            video.removeChild(video.firstChild);
          }
        } catch {}

        try {
          video.load(); // force reset
        } catch {}
      }

      // Clear container safely
      const container = player.getContainer();
      if (container) {
        try {
          container.innerHTML = '';
          container.removeAttribute('data-chaty-initialized');
        } catch (error) {
          console.error('[ChatyPlayer] Container cleanup error:', error);
        }
      }

    } catch (error) {
      console.error('[ChatyPlayer] Lifecycle destroy error:', error);
    }
  }

  /**
   * Lifecycle state checks
   */
  public isMounted(): boolean {
    return this.mounted;
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }
}
