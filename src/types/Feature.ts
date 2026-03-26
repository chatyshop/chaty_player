/**
 * ChatyPlayer v1.0
 * Feature Plugin Interface
 * ----------------------------------------
 * Defines contract for all player features
 */

import type { Player } from '../core/Player';
import type { PlayerConfig } from '../core/config';
import type { EventEmitter } from '../core/events';
import type { LifecycleManager } from '../core/lifecycle';
import type { StateManager } from '../core/state';

export interface InternalFeatureContext {
  lifecycle: LifecycleManager;
  state: StateManager;
  events: EventEmitter;
  config: PlayerConfig;
}

export interface PlayerFeature {
  name: string;

  /**
   * Called when player initializes
   */
  init(player: Player): void;

  /**
   * Optional cleanup hook
   */
  destroy?(player: Player): void;
}
