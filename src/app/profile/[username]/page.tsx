'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Film, Tv2, Clock, Star, Clapperboard, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { calculateWatchTimeMinutes, minutesToDaysHours } from '@/lib/types';
import { getInitials, formatRelativeDate } from '@/lib/utils';
import type { MediaItem, Profile } from '@/lib/types';

/* ─── Stat pill ─────────────────────────────────────────────────── */
function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-5 py-3.5"
      style={{
        background: 'rgba(212,163,89,0.06)',
        border: '1px solid rgba(212,163,89,0.12)',
      }}
    >
      <Icon className="h-4 w-4 shrink-0 text-[var(--color-amber)]" aria-hidden="true" />
      <div>
        <div className="tabular-nums text-base font-bold text-[var(--color-cream)]">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
      </div>
    </div>
  );
}

/* ─── Read-only media row ───────────────────────────────────────── */
function MediaRow({ item }: { item: MediaItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-4 rounded-xl border border-[var(--color-border-warm)]
        bg-[var(--color-cinema-card)] px-4 py-3 card-grain"
    >
      {/* Poster placeholder / initial */}
      <div
        className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold"
        style={{
          background:
            item.media_type === 'movie'
              ? 'rgba(212,163,89,0.12)'
              : 'rgba(192,90,62,0.12)',
          color:
            item.media_type === 'movie'
              ? 'var(--color-amber)'
              : 'var(--color-rust)',
          border: `1px solid ${
            item.media_type === 'movie'
              ? 'rgba(212,163,89,0.2)'
              : 'rgba(192,90,62,0.2)'
          }`,
        }}
        aria-hidden="true"
      >
        {item.media_type === 'movie' ? (
          <Film className="h-4 w-4" />
        ) : (
          <Tv2 className="h-4 w-4" />
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium text-[var(--color-cream)]">{item.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
            {item.media_type === 'movie' ? 'Film' : 'Series'}
          </span>
          {item.ott_platform_name && (
            <>
              <span className="text-[var(--color-muted-dark)]" aria-hidden="true">·</span>
              <span className="text-[11px] text-[var(--color-muted)]">{item.ott_platform_name}</span>
            </>
          )}
        </div>
      </div>

      {/* Rating */}
      {item.rating !== null && item.rating > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Star
            className="h-3.5 w-3.5 text-[var(--color-amber)]"
            fill="currentColor"
            aria-hidden="true"
          />
          <span className="tabular-nums text-sm font-semibold text-[var(--color-cream)]">
            {item.rating}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Profile content ───────────────────────────────────────────── */
function ProfileContent() {
  const params = useParams();
  const username = decodeURIComponent(String(params.username ?? ''));

  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!username) return;

    async function load() {
      setLoading(true);

      /* 1. Look up profile by username */
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileErr || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      /* 2. Check privacy */
      if (!(profileData as Profile).is_public) {
        setIsPrivate(true);
        setLoading(false);
        return;
      }

      /* 3. Fetch watched items */
      const { data: mediaData } = await supabase
        .from('media_items')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('status', 'watched')
        .order('updated_at', { ascending: false });

      setItems((mediaData as MediaItem[]) ?? []);
      setLoading(false);
    }

    load();
  }, [username]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-amber)]/20 border-t-[var(--color-amber)]" />
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <Clapperboard className="mx-auto h-12 w-12 text-[var(--color-amber)]/40" />
          <h1 className="font-display text-2xl font-bold text-[var(--color-cream)]">
            Profile not found
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            No CineLog profile exists for <span className="text-[var(--color-sepia)]">@{username}</span>.
          </p>
        </div>
      </div>
    );
  }

  /* ── Private profile ── */
  if (isPrivate) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <Lock className="mx-auto h-12 w-12 text-[var(--color-amber)]/40" />
          <h1 className="font-display text-2xl font-bold text-[var(--color-cream)]">
            Private Library
          </h1>
          <p className="text-sm text-[var(--color-muted)] max-w-xs mx-auto">
            <span className="text-[var(--color-sepia)]">@{username}</span>&apos;s CineLog is set to private.
          </p>
        </div>
      </div>
    );
  }

  /* ── Computed stats ── */
  const movies = items.filter((i) => i.media_type === 'movie');
  const series = items.filter((i) => i.media_type === 'series');
  const totalMinutes = calculateWatchTimeMinutes(items);
  const { days, hours } = minutesToDaysHours(totalMinutes);
  const watchTimeLabel = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h` : `${totalMinutes}m`;

  const avgRating = (() => {
    const rated = items.filter((i) => i.rating !== null && i.rating! > 0);
    if (!rated.length) return null;
    return (rated.reduce((sum, i) => sum + (i.rating ?? 0), 0) / rated.length).toFixed(1);
  })();

  const initials = getInitials(profile?.display_name, profile?.username ?? undefined);
  const joinedDate = profile?.created_at ? formatRelativeDate(profile.created_at) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ── Profile hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row items-center sm:items-start gap-6"
      >
        {/* Avatar */}
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl
            text-2xl font-bold font-display"
          style={{
            background: 'linear-gradient(135deg, rgba(212,163,89,0.2), rgba(192,90,62,0.15))',
            border: '2px solid rgba(212,163,89,0.25)',
            color: 'var(--color-amber)',
          }}
          aria-hidden="true"
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Name & meta */}
        <div className="text-center sm:text-left">
          <h1 className="font-display text-3xl font-bold text-[var(--color-cream)]">
            {profile?.display_name ?? username}
          </h1>
          {profile?.username && (
            <div className="mt-1 text-sm text-[var(--color-muted)]">@{profile.username}</div>
          )}
          {joinedDate && (
            <div className="mt-2 text-[11px] uppercase tracking-widest text-[var(--color-muted-dark)]">
              Member · Joined {joinedDate}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatPill icon={Film} label="Films" value={movies.length} />
        <StatPill icon={Tv2} label="Series" value={series.length} />
        <StatPill icon={Clock} label="Screen Time" value={watchTimeLabel} />
        <StatPill
          icon={Star}
          label="Avg Rating"
          value={avgRating !== null ? `${avgRating}/10` : '—'}
        />
      </motion.div>

      {/* ── Dashed divider ── */}
      <div
        className="h-px w-full"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(212,163,89,0.18) 0px, rgba(212,163,89,0.18) 6px, transparent 6px, transparent 14px)',
        }}
        aria-hidden="true"
      />

      {/* ── Watched titles ── */}
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--color-cream)] mb-4">
          Watched ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clapperboard className="h-10 w-10 text-[var(--color-amber)]/30 mb-3" />
            <p className="text-sm text-[var(--color-muted)]">No watched titles yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <MediaRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-amber)]/20 border-t-[var(--color-amber)]" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}


