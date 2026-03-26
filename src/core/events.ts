/**
 * ChatyPlayer v1.0
 * Secure Typed EventEmitter (Production Ready - FINAL)
 * ----------------------------------------
 * - Strict TypeScript safe (no invalid emits)
 * - Payload-safe event system
 * - Memory leak safe
 * - Destroy safe
 * - Clean unsubscribe
 * - Fully compatible with Player.ts (Mode System Ready)
 */

/* =========================================
   TYPES
========================================= */

export type PlayerMode = 'normal' | 'mini' | 'theatre' | 'fullscreen';

export type PlayerEventMap = {
  ready: void;
  play: void;
  pause: void;
  ended: void;
  timeupdate: number;
  loadedmetadata: number;

  error: MediaError | null;

  fullscreenchange: boolean;
  pipchange: boolean;
  destroy: void;

  subtitlechange: string | null;
  qualitychange: string;
  speedchange: number;

  theatre: boolean;
  fullscreen: boolean;

  // 🔥 NEW: Mode system event (CRITICAL FIX)
  modechange: {
    prev: PlayerMode;
    next: PlayerMode;
  };
};

type EventKey = keyof PlayerEventMap;

type EventHandler<K extends EventKey> =
  PlayerEventMap[K] extends void
    ? () => void
    : (payload: PlayerEventMap[K]) => void;

/* =========================================
   EVENT EMITTER
========================================= */

export class EventEmitter {
  private listeners = new Map<EventKey, Set<unknown>>();
  private destroyed = false;

  /* =========================================
     Subscribe
  ========================================= */

  public on<K extends EventKey>(
    event: K,
    handler: EventHandler<K>
  ): () => void {
    if (this.destroyed) {
      console.warn('[ChatyPlayer] Cannot subscribe. Player destroyed.');
      return () => {};
    }

    if (typeof handler !== 'function') {
      throw new Error('[ChatyPlayer] Event handler must be a function.');
    }

    let handlers = this.listeners.get(event);

    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }

    handlers.add(handler);

    return () => this.off(event, handler);
  }

  /* =========================================
     Unsubscribe
  ========================================= */

  public off<K extends EventKey>(
    event: K,
    handler: EventHandler<K>
  ): void {
    if (this.destroyed) return;

    const handlers = this.listeners.get(event);
    if (!handlers) return;

    handlers.delete(handler);

    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  /* =========================================
     Emit (Strict + Safe)
  ========================================= */

  public emit<K extends EventKey>(
    event: K,
    ...args: PlayerEventMap[K] extends void ? [] : [PlayerEventMap[K]]
  ): void {
    if (this.destroyed) return;

    const handlers = this.listeners.get(event);
    if (!handlers) return;

    handlers.forEach((rawHandler) => {
      try {
        const handler = rawHandler as EventHandler<K>;

        if (args.length === 1) {
          const payload = args[0] as PlayerEventMap[K];
          (handler as (arg: PlayerEventMap[K]) => void)(payload);
        } else {
          (handler as () => void)();
        }

      } catch (error) {
        console.error(
          `[ChatyPlayer] Error in "${String(event)}" handler:`,
          error
        );
      }
    });
  }

  /* =========================================
     Remove All
  ========================================= */

  public removeAll(): void {
    if (this.destroyed) return;
    this.listeners.clear();
  }

  /* =========================================
     Destroy
  ========================================= */

  public destroy(): void {
    if (this.destroyed) return;

    this.removeAll();
    this.destroyed = true;
  }
}
