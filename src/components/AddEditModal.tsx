import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Film,
  Tv,
  Star,
  Link as LinkIcon,
  Clock,
  Hash,
  StickyNote,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import type { MediaItem, MediaItemInsert, MediaType, MediaStatus } from '@/lib/types';
import { OTT_PLATFORMS } from '@/lib/types';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: MediaItemInsert) => Promise<{ error: string | null }>;
  editItem?: MediaItem | null;
}

interface TmdbSearchResult {
  id: number;
  tmdb_id: number;
  title: string;
  media_type: 'movie' | 'series';
  year: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
  vote_average: number | null;
  overview: string | null;
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

  // TMDB Autocomplete state
  const [searchResults, setSearchResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [autofilledBadge, setAutofilledBadge] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isEditing = !!editItem;

  // TMDB live search
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setAutofilledBadge(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isEditing || val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowDropdown((data.results || []).length > 0);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  // Handle selecting a TMDB search result
  const handleSelectTmdb = async (result: TmdbSearchResult) => {
    setTitle(result.title);
    setMediaType(result.media_type);
    setShowDropdown(false);
    setSearchResults([]);
    setAutofilledBadge(`${result.title} (${result.year ?? 'TMDB'})`);

    if (result.poster_url) {
      setPosterUrl(result.poster_url);
    }
    if (result.overview && !notes) {
      setNotes(result.overview);
    }

    // Fetch detailed metadata (runtime, episode count)
    try {
      const res = await fetch(`/api/tmdb/details?id=${result.id}&type=${result.media_type}`);
      if (res.ok) {
        const details = await res.json();
        if (details.runtime_minutes) {
          setRuntimeMinutes(String(details.runtime_minutes));
        }
        if (result.media_type === 'series' && details.total_episodes) {
          setTotalEpisodes(String(details.total_episodes));
        }
        if (details.poster_url) {
          setPosterUrl(details.poster_url);
        }
        if (details.overview && !notes) {
          setNotes(details.overview);
        }
      }
    } catch {
      // Non-fatal
    }
  };

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
    setSearchResults([]);
    setShowDropdown(false);
    setAutofilledBadge(null);
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
              {/* Title with TMDB Autocomplete */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    Title *
                  </label>
                  {!isEditing && (
                    <span className="flex items-center gap-1 text-[11px] text-[var(--color-amber)]/80">
                      <Sparkles className="h-3 w-3" />
                      TMDB auto-fill
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    required
                    placeholder="Search film or series (e.g. Oppenheimer)..."
                    className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                      py-2.5 pl-4 pr-10 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-muted-dark)]
                      focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                      transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--color-amber)]" />
                    ) : autofilledBadge ? (
                      <Check className="h-4 w-4 text-[var(--color-amber)]" />
                    ) : null}
                  </div>
                </div>

                {/* Autofill confirmation banner */}
                {autofilledBadge && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 flex items-center justify-between rounded-md bg-[var(--color-amber)]/10
                      border border-[var(--color-amber)]/20 px-3 py-1.5 text-xs text-[var(--color-amber-light)]"
                  >
                    <span>Autofilled metadata for <strong>{autofilledBadge}</strong></span>
                    <button
                      type="button"
                      onClick={() => setAutofilledBadge(null)}
                      className="ml-2 text-[var(--color-muted)] hover:text-[var(--color-cream)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}

                {/* TMDB Results Dropdown */}
                <AnimatePresence>
                  {showDropdown && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl
                        border border-[var(--color-border-warm-hover)] bg-[var(--color-cinema-obsidian)]
                        p-1.5 shadow-[var(--shadow-modal)] card-grain divide-y divide-[var(--color-border-warm)]/40"
                    >
                      {searchResults.map((item) => (
                        <button
                          key={`${item.media_type}-${item.id}`}
                          type="button"
                          onClick={() => handleSelectTmdb(item)}
                          className="flex w-full items-center gap-3 rounded-lg p-2 text-left
                            hover:bg-[var(--color-cinema-card)] transition-colors duration-150 cursor-pointer group"
                        >
                          {/* Thumbnail */}
                          <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-[var(--color-cinema-card)] border border-[var(--color-border-warm)] flex items-center justify-center">
                            {item.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.thumbnail_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              item.media_type === 'movie' ? (
                                <Film className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                              ) : (
                                <Tv className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                              )
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-[var(--color-cream)] group-hover:text-[var(--color-amber)] transition-colors">
                                {item.title}
                              </span>
                              {item.year && (
                                <span className="text-xs text-[var(--color-muted)]">
                                  ({item.year})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                  item.media_type === 'movie'
                                    ? 'bg-[var(--color-amber)]/15 text-[var(--color-amber)]'
                                    : 'bg-[var(--color-rust)]/15 text-[var(--color-rust-light)]'
                                }`}
                              >
                                {item.media_type === 'movie' ? 'Film' : 'Series'}
                              </span>
                              {item.vote_average !== null && item.vote_average > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-[var(--color-sepia)]">
                                  <Star className="h-3 w-3 text-[var(--color-amber)]" fill="currentColor" />
                                  {item.vote_average}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
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
