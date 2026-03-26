/**
 * ChatyPlayer v1.0
 * Safe Storage Utility
 * ----------------------------------------
 * - Safe localStorage wrapper
 * - JSON safe parsing
 * - Namespaced keys
 * - Graceful failure
 */

const STORAGE_PREFIX = 'chatyplayer:';

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const testKey = '__chaty_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && isStorageAvailable();
}

/**
 * Build safe namespaced key
 */
function buildKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Set value safely (JSON encoded)
 */
export function setItem<T>(key: string, value: T): boolean {
  if (!canUseStorage()) return false;

  try {
    const safeKey = buildKey(key);
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(safeKey, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get value safely (JSON decoded)
 */
export function getItem<T>(key: string): T | null {
  if (!canUseStorage()) return null;

  try {
    const safeKey = buildKey(key);
    const raw = window.localStorage.getItem(safeKey);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Reject objects with custom prototypes or shadowed dangerous keys.
    if (parsed && typeof parsed === 'object') {
      const prototype = Object.getPrototypeOf(parsed);
      if (prototype !== Object.prototype && prototype !== null && !Array.isArray(parsed)) {
        return null;
      }
      if (Object.prototype.hasOwnProperty.call(parsed, '__proto__')) return null;
      if (Object.prototype.hasOwnProperty.call(parsed, 'constructor')) return null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Remove item safely
 */
export function removeItem(key: string): boolean {
  if (!canUseStorage()) return false;

  try {
    const safeKey = buildKey(key);
    window.localStorage.removeItem(safeKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear only ChatyPlayer keys (not entire localStorage)
 */
export function clearNamespace(): void {
  if (!canUseStorage()) return;

  try {
    Object.keys(window.localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    });
  } catch {
    // Fail silently
  }
}
