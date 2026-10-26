'use client';

import { motion, AnimatePresence } from 'framer-motion';
import MediaCard from '@/components/MediaCard';
import type { MediaItem } from '@/lib/types';
import { Film, Plus } from 'lucide-react';

interface MediaGridProps {
  items: MediaItem[];
  loading: boolean;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  onIncrementEpisode: (id: string) => Promise<void>;
  totalItems: number;
  onAddFirst: () => void;
}

const SKELETON_COUNT = 8;

export default function MediaGrid({
  items,
  loading,
  onEdit,
  onDelete,
  onIncrementEpisode,
  totalItems,
  onAddFirst,
}: MediaGridProps) {
  /* ── Loading skeletons ── */
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="skeleton rounded-xl"
            style={{ aspectRatio: '2/3' }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  /* ── Empty state: user has no items at all ── */
  if (totalItems === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-24 text-center gap-6"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-amber)]/8 border border-[var(--color-amber)]/15">
          <Film className="h-10 w-10 text-[var(--color-amber)]/60" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-cream)]">
            Your library is empty
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)] max-w-xs">
            Start cataloguing films and series you&apos;re watching, have watched, or want to watch.
          </p>
        </div>
        <button
          onClick={onAddFirst}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-amber)] px-6 py-3
            text-sm font-semibold text-[var(--color-cinema-bg)] hover:bg-[var(--color-amber-light)]
            transition-all duration-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Your First Title
        </button>
      </motion.div>
    );
  }

  /* ── Empty state: filter returned no results ── */
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center gap-3"
      >
        <Film className="h-10 w-10 text-[var(--color-muted-dark)]" aria-hidden="true" />
        <p className="text-sm font-medium text-[var(--color-sepia)]">No titles match your filters</p>
        <p className="text-xs text-[var(--color-muted)]">Try adjusting the search or category</p>
      </motion.div>
    );
  }

  /* ── Grid ── */
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        layout
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        {items.map((item, index) => (
          <MediaCard
            key={item.id}
            item={item}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
            onIncrementEpisode={onIncrementEpisode}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
