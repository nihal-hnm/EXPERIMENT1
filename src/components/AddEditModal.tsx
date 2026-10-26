'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Tv, Star, Link as LinkIcon, Clock, Hash, StickyNote } from 'lucide-react';
import type { MediaItem, MediaItemInsert, MediaType, MediaStatus } from '@/lib/types';
import { OTT_PLATFORMS } from '@/lib/types';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: MediaItemInsert) => Promise<{ error: string | null }>;
  editItem?: MediaItem | null;
}

export default function AddEditModal({ isOpen, onClose, onSubmit, editItem }: AddEditModalProps) {
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [status, setStatus] = useState<MediaStatus>('currently_watching');
  const [posterUrl, setPosterUrl] = useState('');
  const [runtimeMinutes, setRuntimeMinutes] = useState('');
  const [totalEpisodes, setTotalEpisodes] = useState('');
  const [watchedEpisodes, setWatchedEpisodes] = useState('');
  const [ottPlatformName, setOttPlatformName] = useState('');
  const [ottRedirectUrl, setOttRedirectUrl] = useState('');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editItem;

  // Populate form when editing
  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setMediaType(editItem.media_type);
      setStatus(editItem.status);
      setPosterUrl(editItem.poster_url || '');
      setRuntimeMinutes(editItem.runtime_minutes ? String(editItem.runtime_minutes) : '');
      setTotalEpisodes(editItem.total_episodes ? String(editItem.total_episodes) : '');
      setWatchedEpisodes(editItem.watched_episodes ? String(editItem.watched_episodes) : '');
      setOttPlatformName(editItem.ott_platform_name || '');
      setOttRedirectUrl(editItem.ott_redirect_url || '');
      setRating(editItem.rating !== null ? String(editItem.rating) : '');
      setNotes(editItem.notes || '');
    } else {
      resetForm();
    }
  }, [editItem, isOpen]);

  const resetForm = useCallback(() => {
    setTitle('');
    setMediaType('movie');
    setStatus('currently_watching');
    setPosterUrl('');
    setRuntimeMinutes('');
    setTotalEpisodes('');
    setWatchedEpisodes('');
    setOttPlatformName('');
    setOttRedirectUrl('');
    setRating('');
    setNotes('');
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const item: MediaItemInsert = {
      title,
      media_type: mediaType,
      status,
      poster_url: posterUrl || null,
      runtime_minutes: parseInt(runtimeMinutes) || 0,
      total_episodes: mediaType === 'series' ? parseInt(totalEpisodes) || 1 : 1,
      watched_episodes: mediaType === 'series' ? parseInt(watchedEpisodes) || 0 : (status === 'watched' ? 1 : 0),
      ott_platform_name: ottPlatformName || null,
      ott_redirect_url: ottRedirectUrl || null,
      rating: rating ? parseFloat(rating) : null,
      notes: notes || null,
    };

    const result = await onSubmit(item);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      resetForm();
      onClose();
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="card-grain relative w-full max-w-lg max-h-[90vh] overflow-y-auto
              rounded-2xl border border-[var(--color-border-warm)] bg-[var(--color-cinema-card)]
              shadow-[var(--shadow-modal)]"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border-warm)]
              bg-[var(--color-cinema-card)]/95 backdrop-blur-md px-6 py-4">
              <h2 className="font-display text-lg font-bold text-[var(--color-cream)]">
                {isEditing ? 'Edit Title' : 'Add Title'}
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg
                  text-[var(--color-muted)] hover:text-[var(--color-cream)] hover:bg-[var(--color-cinema-obsidian)]
                  transition-all duration-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="The Grand Budapest Hotel"
                  className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                    py-2.5 px-4 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-muted-dark)]
                    focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                    transition-all duration-200"
                />
              </div>

              {/* Type + Status row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    Type
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'movie' as MediaType, label: 'Film', icon: Film },
                      { value: 'series' as MediaType, label: 'Series', icon: Tv },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMediaType(opt.value)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium
                            transition-all duration-200 cursor-pointer ${
                              mediaType === opt.value
                                ? 'border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 text-[var(--color-amber)]'
                                : 'border-[var(--color-border-warm)] text-[var(--color-muted)] hover:text-[var(--color-sepia)]'
                            }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MediaStatus)}
                    className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                      px-3 py-2.5 text-xs text-[var(--color-sepia)]
                      focus:border-[var(--color-amber)]/30 focus:outline-none cursor-pointer"
                  >
                    <option value="currently_watching">Currently Watching</option>
                    <option value="watched">Watched</option>
                    <option value="bucketlist">Watchlist</option>
                  </select>
                </div>
              </div>

              {/* Poster URL */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  <LinkIcon className="h-3 w-3" /> Poster URL
                </label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://image.tmdb.org/..."
                  className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                    py-2.5 px-4 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-muted-dark)]
                    focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                    transition-all duration-200"
                />
              </div>

              {/* Runtime + Episodes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    <Clock className="h-3 w-3" />
                    {mediaType === 'series' ? 'Min / Episode' : 'Runtime (min)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={runtimeMinutes}
                    onChange={(e) => setRuntimeMinutes(e.target.value)}
                    placeholder="120"
                    className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                      py-2.5 px-4 text-sm text-[var(--color-cream)] tabular-nums placeholder:text-[var(--color-muted-dark)]
                      focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                      transition-all duration-200"
                  />
                </div>

                {mediaType === 'series' && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                      <Hash className="h-3 w-3" /> Total Episodes
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={totalEpisodes}
                      onChange={(e) => setTotalEpisodes(e.target.value)}
                      placeholder="10"
                      className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                        py-2.5 px-4 text-sm text-[var(--color-cream)] tabular-nums placeholder:text-[var(--color-muted-dark)]
                        focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                        transition-all duration-200"
                    />
                  </div>
                )}

                {mediaType === 'series' && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                      <Hash className="h-3 w-3" /> Watched Episodes
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={watchedEpisodes}
                      onChange={(e) => setWatchedEpisodes(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                        py-2.5 px-4 text-sm text-[var(--color-cream)] tabular-nums placeholder:text-[var(--color-muted-dark)]
                        focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                        transition-all duration-200"
                    />
                  </div>
                )}

                {/* Rating */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    <Star className="h-3 w-3" /> Rating (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="8.5"
                    className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                      py-2.5 px-4 text-sm text-[var(--color-cream)] tabular-nums placeholder:text-[var(--color-muted-dark)]
                      focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                      transition-all duration-200"
                  />
                </div>
              </div>

              {/* OTT Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    OTT Platform
                  </label>
                  <select
                    value={ottPlatformName}
                    onChange={(e) => setOttPlatformName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                      px-3 py-2.5 text-xs text-[var(--color-sepia)]
                      focus:border-[var(--color-amber)]/30 focus:outline-none cursor-pointer"
                  >
                    <option value="">None</option>
                    {Object.keys(OTT_PLATFORMS).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    <LinkIcon className="h-3 w-3" /> Stream URL
                  </label>
                  <input
                    type="url"
                    value={ottRedirectUrl}
                    onChange={(e) => setOttRedirectUrl(e.target.value)}
                    placeholder="https://netflix.com/..."
                    className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                      py-2.5 px-4 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-muted-dark)]
                      focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                      transition-all duration-200"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  <StickyNote className="h-3 w-3" /> Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Personal notes about this title..."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                    py-2.5 px-4 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-muted-dark)]
                    focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                    transition-all duration-200 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-md bg-[var(--color-rust)]/10 border border-[var(--color-rust)]/20
                  px-3 py-2 text-xs text-[var(--color-rust-light)]">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full rounded-lg bg-[var(--color-amber)] px-4 py-3 text-sm font-semibold
                  text-[var(--color-cinema-bg)] hover:bg-[var(--color-amber-light)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-cinema-bg)] border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  isEditing ? 'Save Changes' : 'Add to Library'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
