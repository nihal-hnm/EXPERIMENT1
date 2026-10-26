// CineLog — Utility Helpers

/**
 * Format a Supabase/ISO timestamp into a human-readable relative date.
 * e.g. "3 days ago" or "2 months ago"
 */
export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format an ISO date string to "Month DD, YYYY"
 */
export function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format minutes into a compact label, e.g. 142 → "2h 22m"
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format total minutes into compact watch time label, e.g. "3d 2h"
 */
export function formatWatchTimeLong(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min';
  const days = Math.floor(totalMinutes / (60 * 24));
  const remaining = totalMinutes % (60 * 24);
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
}

/**
 * Truncate a string to a max length with an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '\u2026';
}

/**
 * Generate a URL-safe slug from a string.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Return a star rating label, e.g. 8.5 → "★ 8.5"
 */
export function formatRating(rating: number | null): string {
  if (rating === null || rating === 0) return '\u2014';
  return `\u2605 ${rating.toFixed(1)}`;
}

/**
 * Derive initials from a display name or email for avatar fallback.
 */
export function getInitials(name: string | null | undefined, email?: string | null): string {
  const source = name || email || '?';
  const words = source.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Determine if a string is a valid absolute URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
