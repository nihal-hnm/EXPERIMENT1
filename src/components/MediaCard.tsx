'use client';

import { motion } from 'framer-motion';
import { Play, Star, ExternalLink, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import type { MediaItem } from '@/lib/types';
import EpisodeTracker from './EpisodeTracker';
import { useState, useRef, useEffect } from 'react';

interface MediaCardProps {
  item: MediaItem;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  onIncrementEpisode: (id: string) => void;
  index?: number;
}

const STATUS_LABELS: Record<string, string> = {
  currently_watching: 'Watching',
  watched: 'Watched',
  bucketlist: 'Watchlist',
};

const STATUS_COLORS: Record<string, string> = {
  currently_watching: 'bg-[var(--color-amber)]/15 text-[var(--color-amber)]',
  watched: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  bucketlist: 'bg-[var(--color-muted)]/15 text-[var(--color-sepia)]',
};

export default function MediaCard({
  item,
  onEdit,
  onDelete,
  onIncrementEpisode,
  index = 0,
}: MediaCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const posterFallback = (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-cinema-card)] to-[var(--color-cinema-obsidian)]">
      <Play className="h-10 w-10 text-[var(--color-muted-dark)]" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="card-grain group relative rounded-xl border border-[var(--color-border-warm)]
        bg-[var(--color-cinema-card)] shadow-[var(--shadow-card)]
        hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-border-warm-hover)]
        transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-[var(--color-cinema-obsidian)]">
        {item.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.poster_url}
            alt={`${item.title} poster`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          posterFallback
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--color-cinema-card)] to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${STATUS_COLORS[item.status]}`}
          >
            {STATUS_LABELS[item.status]}
          </span>
        </div>

        {/* OTT Badge */}
        {item.ott_platform_name && (
          <div className="absolute top-3 right-3">
            {item.ott_redirect_url ? (
              <a
                href={item.ott_redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md
                  px-2 py-1 text-[10px] font-medium text-[var(--color-cream)]
                  hover:bg-black/80 transition-colors cursor-pointer"
                title={`Stream on ${item.ott_platform_name}`}
              >
                <ExternalLink className="h-3 w-3" />
                {item.ott_platform_name}
              </a>
            ) : (
              <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-md
                px-2 py-1 text-[10px] font-medium text-[var(--color-sepia)]">
                {item.ott_platform_name}
              </span>
            )}
          </div>
        )}

        {/* Quick action menu trigger */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md
              text-[var(--color-cream)] hover:bg-black/80 transition-all cursor-pointer"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 bottom-10 w-36 rounded-lg border border-[var(--color-border-warm)]
                bg-[var(--color-cinema-obsidian)] shadow-[var(--shadow-modal)] overflow-hidden"
            >
              <button
                onClick={() => { onEdit(item); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-[var(--color-sepia)]
                  hover:bg-[var(--color-cinema-card)] hover:text-[var(--color-cream)] transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => { onEdit({ ...item }); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-[var(--color-sepia)]
                  hover:bg-[var(--color-cinema-card)] hover:text-[var(--color-cream)] transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" /> Change Status
              </button>
              <button
                onClick={() => { onDelete(item.id); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-[var(--color-rust)]
                  hover:bg-[var(--color-rust)]/10 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5">
        {/* Title */}
        <h3 className="font-display text-sm font-semibold text-[var(--color-cream)] leading-snug line-clamp-2 mb-1.5">
          {item.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)] mb-2">
          <span className="uppercase tracking-wider">
            {item.media_type === 'movie' ? 'Film' : 'Series'}
          </span>
          {item.runtime_minutes > 0 && (
            <>
              <span className="text-[var(--color-border-warm-hover)]">·</span>
              <span className="tabular-nums">{item.runtime_minutes} min</span>
            </>
          )}
          {item.rating !== null && item.rating > 0 && (
            <>
              <span className="text-[var(--color-border-warm-hover)]">·</span>
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 text-[var(--color-amber)]" fill="currentColor" />
                <span className="tabular-nums">{item.rating}</span>
              </span>
            </>
          )}
        </div>

        {/* Episode tracker for series */}
        {item.media_type === 'series' && (
          <EpisodeTracker
            watched={item.watched_episodes}
            total={item.total_episodes}
            onIncrement={() => onIncrementEpisode(item.id)}
          />
        )}
      </div>
    </motion.div>
  );
}
