/**
 * Direct-source format selection helper.
 * Used by the core player to choose the best playable source
 * from the simple mp4/webm/ogg config fields.
 */

export type VideoFormat = 'mp4' | 'webm' | 'ogg';

export interface VideoSources {
  mp4?: string;
  webm?: string;
  ogg?: string;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'blob:', ''];

function isValidURL(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;

  try {
    const parsed = new URL(url, window.location.href);

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return false;
    }

    // Block javascript: or other dangerous schemes
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Map format to MIME type
 */
function getMimeType(format: VideoFormat): string {
  switch (format) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogg':
      return 'video/ogg';
    default:
      return '';
  }
}

/**
 * Check if browser supports format
 */
export function isFormatSupported(format: VideoFormat): boolean {
  if (typeof document === 'undefined') return false;

  const video = document.createElement('video');
  const mime = getMimeType(format);

  if (!mime) return false;

  const result = video.canPlayType(mime);

  return result === 'probably' || result === 'maybe';
}

/**
 * Return available & supported formats
 */
export function getSupportedFormats(
  sources: VideoSources
): VideoFormat[] {
  const supported: VideoFormat[] = [];

  (['mp4', 'webm', 'ogg'] as VideoFormat[]).forEach((format) => {
    const src = sources[format];

    if (!src) return;
    if (!isValidURL(src)) return;
    if (!isFormatSupported(format)) return;

    supported.push(format);
  });

  return supported;
}

/**
 * Select best playable source
 * Priority: mp4 → webm → ogg
 */
export function selectBestSource(
  sources: VideoSources
): { format: VideoFormat; src: string } | null {
  const supported = getSupportedFormats(sources);

  if (supported.length === 0) return null;

  const priority: VideoFormat[] = ['mp4', 'webm', 'ogg'];

  for (const format of priority) {
    if (supported.includes(format)) {
      return {
        format,
        src: sources[format] as string
      };
    }
  }

  return null;
}

