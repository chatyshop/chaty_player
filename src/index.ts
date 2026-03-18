/**
 * ChatyPlayer v1.0
 * Entry Point (Production Ready)
 * ----------------------------------------
 * - React safe (no auto-init conflicts)
 * - Optional auto-init support (disabled by default)
 * - Prevents duplicate initialization
 * - Secure config parsing
 * - CSS bundled safely
 */

import "./styles/chatyplayer.css";
import { Player } from "./core/Player";
import { parseConfig } from "./core/config";

declare global {
  interface Window {
    ChatyPlayer?: ChatyPlayerAPI;
  }
}

/* =========================================
   Types
========================================= */
type ChatyPlayerAPI = {
  create: (container: HTMLElement) => Player | null;
  autoInit: () => void;
  version: string;
};

const PLAYER_CLASS = "chaty-player";
const INIT_ATTR = "data-chaty-initialized";

/* =========================================
   Initialize Single Player
========================================= */
function initPlayer(container: HTMLElement): Player | null {
  try {
    if (!(container instanceof HTMLElement)) {
      throw new Error("Invalid container element");
    }

    // Prevent duplicate initialization
    if (container.hasAttribute(INIT_ATTR)) {
      return null;
    }

    // Parse safe config
    const config = parseConfig(container);

    // Create player
    const player = new Player(container, config);

    // Mark initialized
    container.setAttribute(INIT_ATTR, "true");

    return player;
  } catch (error) {
    console.error("[ChatyPlayer] Initialization failed:", error);
    return null;
  }
}

/* =========================================
   Auto Init (OPTIONAL - manual call only)
========================================= */
function autoInit(): void {
  if (typeof document === "undefined") return;

  const elements = document.querySelectorAll<HTMLElement>(
    `.${PLAYER_CLASS}`
  );

  elements.forEach((el) => {
    initPlayer(el);
  });
}

/* =========================================
   Public API (React Safe)
========================================= */
function create(container: HTMLElement): Player | null {
  if (!(container instanceof HTMLElement)) {
    console.error("[ChatyPlayer] Invalid container provided.");
    return null;
  }

  // Allow safe re-init (React / SPA safe)
  if (container.hasAttribute(INIT_ATTR)) {
    container.removeAttribute(INIT_ATTR);
    container.textContent = ""; // safe DOM cleanup
  }

  return initPlayer(container);
}

/* =========================================
   API Object (Single Source of Truth)
========================================= */
const ChatyPlayer: ChatyPlayerAPI = {
  create,
  autoInit,
  version: "1.0.0",
};

/* =========================================
   Expose Global API (Safe)
========================================= */
function exposeGlobal(): void {
  if (typeof window === "undefined") return;

  // Prevent overwriting existing instance
  if (!window.ChatyPlayer) {
    window.ChatyPlayer = ChatyPlayer;
  }
}

/* =========================================
   Bootstrap (NO auto-init)
========================================= */
(function bootstrap() {
  try {
    exposeGlobal();
  } catch (error) {
    console.error("[ChatyPlayer] Bootstrap error:", error);
  }
})();

/* =========================================
   Export (CRITICAL for ES/CJS/UMD)
========================================= */
export { ChatyPlayer };