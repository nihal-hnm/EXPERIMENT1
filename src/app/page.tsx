'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clapperboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMediaItems } from '@/hooks/useMediaItems';
import FilterBar from '@/components/FilterBar';
import MediaGrid from '@/components/MediaGrid';
import AddEditModal from '@/components/AddEditModal';
import type { MediaItem, MediaStatus } from '@/lib/types';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: itemsLoading, addItem, updateItem, deleteItem, incrementEpisode } =
    useMediaItems();

  // Filter state
  const [activeTab, setActiveTab] = useState<MediaStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [platformFilter, setPlatformFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);

  // Derived platform list
  const platforms = useMemo(
    () =>
      [...new Set(items.map((i) => i.ott_platform_name).filter(Boolean) as string[])].sort(),
    [items]
  );

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab !== 'all' && item.status !== activeTab) return false;
      if (typeFilter !== 'all' && item.media_type !== typeFilter) return false;
      if (platformFilter && item.ott_platform_name !== platformFilter) return false;
      if (
        searchQuery &&
        !item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, activeTab, typeFilter, platformFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: MediaItem) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleSubmit = async (data: Parameters<typeof addItem>[0]) => {
    if (editItem) {
      return updateItem({ id: editItem.id, ...data });
    }
    return addItem(data);
  };

  /* ── Loading skeleton ── */
  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--color-amber)]/20 border-t-[var(--color-amber)]" />
          <p className="text-sm text-[var(--color-muted)]">Loading your screening room…</p>
        </div>
      </div>
    );
  }

  /* ── Unauthenticated hero ── */
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg w-full text-center space-y-8"
        >
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/20">
            <Clapperboard className="h-10 w-10 text-[var(--color-amber)]" />
          </div>

          {/* Headline */}
          <div>
            <h1 className="font-display text-5xl font-bold text-[var(--color-cream)] leading-tight">
              Your Cinematic <span className="text-[var(--color-amber)] italic">Journal</span>
            </h1>
            <p className="mt-4 text-lg text-[var(--color-muted)] leading-relaxed">
              Track every film and series that moves you. An editorial, warm-toned library
              built for cinema lovers.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-amber)] px-8 py-3.5
                text-sm font-semibold text-[var(--color-cinema-bg)] hover:bg-[var(--color-amber-light)]
                transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(212,163,89,0.25)]"
            >
              Start Your Library
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-warm-hover)]
                px-8 py-3.5 text-sm font-medium text-[var(--color-sepia)]
                hover:border-[var(--color-amber)]/30 hover:text-[var(--color-cream)]
                transition-all duration-200 cursor-pointer"
            >
              Sign In
            </Link>
          </div>

          {/* Features strip */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border-warm)]">
            {[
              { label: 'Films & Series', sub: 'Track both' },
              { label: 'Episode Progress', sub: '+1 tap' },
              { label: 'Watch Analytics', sub: 'Stats center' },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <div className="text-xs font-semibold text-[var(--color-sepia)]">{f.label}</div>
                <div className="text-[11px] text-[var(--color-muted)] mt-0.5">{f.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Authenticated library ── */
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-cream)]">
            Your Library
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)] tabular-nums">
            {items.length} title{items.length !== 1 ? 's' : ''} catalogued
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenAdd}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--color-amber)] px-4 py-2.5
            text-sm font-semibold text-[var(--color-cinema-bg)] hover:bg-[var(--color-amber-light)]
            transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(212,163,89,0.2)]"
        >
          <Plus className="h-4 w-4" />
          Add Title
        </motion.button>
      </div>

      {/* Filter bar */}
      <FilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        platformFilter={platformFilter}
        onPlatformFilterChange={setPlatformFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        platforms={platforms}
      />

      {/* Grid */}
      <MediaGrid
        items={filteredItems}
        loading={itemsLoading}
        onEdit={handleEdit}
        onDelete={deleteItem}
        onIncrementEpisode={incrementEpisode}
        totalItems={items.length}
        onAddFirst={handleOpenAdd}
      />

      {/* Modal */}
      <AddEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editItem={editItem}
      />
    </div>
  );
}
