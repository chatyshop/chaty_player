/**
 * ChatyPlayer v1.0
 * Time Utilities (Strict Safe)
 * ----------------------------------------
 * - Fully strict TypeScript safe
 * - No undefined destructuring
 * - No unsafe casts
 * - No side effects
 */

/* =========================================
   Normalize Seconds
========================================= */

function normalizeSeconds(value: unknown): number {
  const num = Number(value);

  if (!Number.isFinite(num) || num < 0) return 0;

  return Math.floor(num);
}

/* =========================================
   Format Time (hh:mm:ss)
========================================= */

export function formatTime(seconds: unknown): string {
  const total = normalizeSeconds(seconds);

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${
      secs < 10 ? '0' : ''
    }${secs}`;
  }

  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

