import { Platform } from 'react-native';

/**
 * Checks whether an image URI is a temporary browser blob URL
 * (e.g. blob:http://localhost:8081/...) which expires upon page reload.
 */
export function isTemporaryBlobUrl(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  return uri.trim().startsWith('blob:');
}

/**
 * Filters out invalid or temporary blob URLs, returning null if invalid.
 */
export function sanitizeAvatarUrl(uri?: string | null): string | null {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  if (trimmed === '' || trimmed.startsWith('blob:')) {
    return null;
  }
  return trimmed;
}

/**
 * Converts a temporary web `blob:` URL or image URI into a persistent
 * base64 data URL (`data:image/jpeg;base64,...`).
 * On web, this prevents `net::ERR_FILE_NOT_FOUND` after page reloads.
 */
export async function convertBlobToDataUrl(uri: string): Promise<string> {
  if (!uri || typeof uri !== 'string') return uri;

  // Already persistent data URL or remote HTTPS link
  if (uri.startsWith('data:image/') || uri.startsWith('http://') || uri.startsWith('https://')) {
    if (!uri.startsWith('blob:')) return uri;
  }

  // Convert web blob to persistent base64
  if (Platform.OS === 'web' || typeof window !== 'undefined') {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve(uri);
          }
        };
        reader.onerror = () => resolve(uri);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Failed to convert blob to data URL:', err);
      return uri;
    }
  }

  return uri;
}
