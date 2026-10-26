// CineLog — TypeScript Type Definitions

export type MediaType = 'movie' | 'series';
export type MediaStatus = 'currently_watching' | 'watched' | 'bucketlist';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  user_id: string;
  title: string;
  media_type: MediaType;
  status: MediaStatus;
  poster_url: string | null;
  runtime_minutes: number;
  total_episodes: number;
  watched_episodes: number;
  ott_platform_name: string | null;
  ott_redirect_url: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaItemInsert {
  title: string;
  media_type: MediaType;
  status: MediaStatus;
  poster_url?: string | null;
  runtime_minutes?: number;
  total_episodes?: number;
  watched_episodes?: number;
  ott_platform_name?: string | null;
  ott_redirect_url?: string | null;
  rating?: number | null;
  notes?: string | null;
}

export interface MediaItemUpdate extends Partial<MediaItemInsert> {
  id: string;
}

// OTT Platform display info
export interface OttPlatform {
  name: string;
  color: string;
  icon?: string;
}

export const OTT_PLATFORMS: Record<string, OttPlatform> = {
  'Netflix': { name: 'Netflix', color: '#E50914' },
  'Prime Video': { name: 'Prime Video', color: '#00A8E1' },
  'Disney+': { name: 'Disney+', color: '#113CCF' },
  'Hotstar': { name: 'Hotstar', color: '#1F2533' },
  'MUBI': { name: 'MUBI', color: '#D4A359' },
  'Apple TV+': { name: 'Apple TV+', color: '#A3AAAE' },
  'HBO Max': { name: 'HBO Max', color: '#B3A1F7' },
  'Hulu': { name: 'Hulu', color: '#1CE783' },
  'Paramount+': { name: 'Paramount+', color: '#0164FF' },
  'Crunchyroll': { name: 'Crunchyroll', color: '#F47521' },
  'Other': { name: 'Other', color: '#8F877E' },
};

// Watch time calculation helpers
export function calculateWatchTimeMinutes(items: MediaItem[]): number {
  return items.reduce((total, item) => {
    if (item.media_type === 'movie') {
      return total + (item.runtime_minutes || 0);
    }
    // Series: watched episodes × runtime per episode
    return total + (item.watched_episodes * (item.runtime_minutes || 0));
  }, 0);
}

export function minutesToDaysHours(totalMinutes: number): { days: number; hours: number; minutes: number } {
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingAfterDays = totalMinutes % (60 * 24);
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;
  return { days, hours, minutes };
}

export function formatWatchTime(totalMinutes: number): string {
  const { days, hours } = minutesToDaysHours(totalMinutes);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} Hour${hours !== 1 ? 's' : ''}`);
  if (parts.length === 0) return `${totalMinutes} Min`;
  return parts.join(', ');
}
