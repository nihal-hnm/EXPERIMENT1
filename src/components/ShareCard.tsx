'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Clapperboard, Star } from 'lucide-react';
import { calculateWatchTimeMinutes, minutesToDaysHours } from '@/lib/types';
import { formatFullDate } from '@/lib/utils';
import type { MediaItem } from '@/lib/types';

/* ─── Perforated edge dots ──────────────────────────────────────── */
function PerforatedEdge({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className={`absolute top-0 bottom-0 w-6 flex flex-col justify-around items-center z-10 ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
    >
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-3 rounded-full bg-[var(--color-cinema-bg)] border border-[rgba(212,163,89,0.08)]"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/* ─── Stat column ───────────────────────────────────────────────── */
function StatCol({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="tabular-nums text-xl font-bold text-[var(--color-cream)]">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

/* ─── Props ─────────────────────────────────────────────────────── */
interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  username?: string | null;
  displayName?: string | null;
  memberSince?: string | null;
}

export default function ShareCard({
  isOpen,
  onClose,
  items,
  username,
  displayName,
  memberSince,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const watched = items.filter((i) => i.status === 'watched');
  const movies = items.filter((i) => i.media_type === 'movie' && i.status === 'watched');
  const series = items.filter((i) => i.media_type === 'series' && i.status === 'watched');
  const totalMinutes = calculateWatchTimeMinutes(watched);
  const { days, hours } = minutesToDaysHours(totalMinutes);
  const watchTimeLabel = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  const avgRating = (() => {
    const rated = items.filter((i) => i.rating !== null && i.rating! > 0);
    if (!rated.length) return null;
    return (rated.reduce((sum, i) => sum + (i.rating ?? 0), 0) / rated.length).toFixed(1);
  })();

  const topItem = [...items]
    .filter((i) => i.rating !== null && i.rating! > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  const handleCopy = async () => {
    const lines = [
      '\uD83C\uDFAC My CineLog stats',
      `${displayName ?? username ?? 'Cinephile'}'s library`,
      '',
      `\uD83D\uDCFD ${movies.length} films watched`,
      `\uD83D\uDCFA ${series.length} series completed`,
      `\u23F1 ${watchTimeLabel} of screen time`,
      avgRating ? `\u2B50 Avg rating: ${avgRating}/10` : null,
      topItem ? `\uD83C\uDFC6 Favourite: ${topItem.title}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(lines as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked */
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My CineLog',
          text: 'Check out my cinematic journal on CineLog!',
          url: window.location.origin,
        });
      } catch {
        /* cancelled */
      }
    } else {
      handleCopy();
    }
  };

  /* member year */
  const memberYear = memberSince
    ? new Date(memberSince).getFullYear()
    : new Date().getFullYear();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Share your CineLog card"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md"
            >
              {/* Close */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={onClose}
                  aria-label="Close share card"
                  className="flex h-8 w-8 items-center justify-center rounded-full
                    border border-[var(--color-border-warm)] bg-[var(--color-cinema-card)]
                    text-[var(--color-muted)] hover:text-[var(--color-cream)]
                    hover:border-[var(--color-amber)]/30 transition-all duration-200 cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* ═══ TICKET ═════════════════════════════════════════════ */}
              <div
                ref={cardRef}
                className="relative mx-auto overflow-hidden rounded-2xl"
                style={{
                  background: 'linear-gradient(160deg, #1F1C18 0%, #181614 55%, #1A1410 100%)',
                  border: '1px solid rgba(212,163,89,0.18)',
                  boxShadow:
                    '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,163,89,0.06), inset 0 1px 0 rgba(212,163,89,0.08)',
                }}
              >
                <PerforatedEdge side="left" />
                <PerforatedEdge side="right" />

                <div className="px-10 py-7">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Clapperboard className="h-5 w-5 text-[var(--color-amber)]" aria-hidden="true" />
                      <span className="font-display text-lg font-bold italic text-[var(--color-amber)]">
                        CineLog
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
                      Admit One
                    </span>
                  </div>

                  {/* Dashed rule */}
                  <div
                    className="mb-6 h-px w-full"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, rgba(212,163,89,0.25) 0px, rgba(212,163,89,0.25) 6px, transparent 6px, transparent 12px)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Name */}
                  <div className="mb-6 text-center">
                    <div className="font-display text-3xl font-bold text-[var(--color-cream)]">
                      {displayName ?? username ?? 'Cinephile'}
                    </div>
                    {username && displayName && (
                      <div className="mt-1 text-xs text-[var(--color-muted)]">@{username}</div>
                    )}
                    <div className="mt-2 text-[11px] uppercase tracking-widest text-[var(--color-muted)]">
                      Member since {memberYear}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-around mb-6">
                    <StatCol label="Films" value={movies.length} />
                    <div className="w-px bg-[var(--color-border-warm)]" aria-hidden="true" />
                    <StatCol label="Series" value={series.length} />
                    <div className="w-px bg-[var(--color-border-warm)]" aria-hidden="true" />
                    <StatCol label="Screen Time" value={watchTimeLabel} />
                    {avgRating && (
                      <>
                        <div className="w-px bg-[var(--color-border-warm)]" aria-hidden="true" />
                        <StatCol label="Avg \u2605" value={avgRating} />
                      </>
                    )}
                  </div>

                  {/* Top rated */}
                  {topItem && (
                    <div
                      className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{
                        background: 'rgba(212,163,89,0.06)',
                        border: '1px solid rgba(212,163,89,0.12)',
                      }}
                    >
                      <Star
                        className="h-4 w-4 shrink-0 text-[var(--color-amber)]"
                        fill="currentColor"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase tracking-widest text-[var(--color-muted)] mb-0.5">
                          All-time Favourite
                        </div>
                        <div className="truncate text-sm font-semibold text-[var(--color-cream)]">
                          {topItem.title}
                        </div>
                      </div>
                      <div className="tabular-nums shrink-0 text-sm font-bold text-[var(--color-amber)]">
                        {topItem.rating}/10
                      </div>
                    </div>
                  )}

                  {/* Bottom rule */}
                  <div
                    className="mb-5 h-px w-full"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, rgba(212,163,89,0.25) 0px, rgba(212,163,89,0.25) 6px, transparent 6px, transparent 12px)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Stub */}
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-muted-dark)]">
                    <span className="tracking-widest uppercase">
                      {watched.length} titles screened
                    </span>
                    <span className="tabular-nums font-mono">{new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopy}
                  id="share-card-copy-btn"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl
                    border border-[var(--color-border-warm-hover)] bg-[var(--color-cinema-card)]
                    px-4 py-3 text-sm font-medium text-[var(--color-sepia)]
                    hover:text-[var(--color-cream)] hover:border-[var(--color-amber)]/30
                    transition-all duration-200 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-[var(--color-success)]" aria-hidden="true" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Copy Stats
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleShare}
                  id="share-card-share-btn"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl
                    bg-[var(--color-amber)] px-4 py-3 text-sm font-semibold
                    text-[var(--color-cinema-bg)] hover:bg-[var(--color-amber-light)]
                    transition-all duration-200 cursor-pointer
                    shadow-[0_4px_16px_rgba(212,163,89,0.25)]"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

