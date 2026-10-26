'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { MediaItem, MediaItemInsert, MediaItemUpdate, MediaStatus } from '@/lib/types';

const GUEST_ITEMS_KEY = 'cinelog_guest_items';

const INITIAL_GUEST_ITEMS: MediaItem[] = [
  {
    id: 'guest-item-1',
    user_id: 'guest-cinephile-0001',
    title: 'Oppenheimer',
    media_type: 'movie',
    status: 'watched',
    poster_url: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    runtime_minutes: 180,
    total_episodes: 1,
    watched_episodes: 1,
    ott_platform_name: 'Prime Video',
    ott_redirect_url: 'https://www.primevideo.com',
    rating: 9.5,
    notes: 'Nolan at his absolute finest. The Trinity sequence and sound design are unforgettable.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'guest-item-2',
    user_id: 'guest-cinephile-0001',
    title: 'Severance',
    media_type: 'series',
    status: 'currently_watching',
    poster_url: 'https://image.tmdb.org/t/p/w500/AadFrqvlkhx9c31bX1v0Bq55gT2.jpg',
    runtime_minutes: 55,
    total_episodes: 19,
    watched_episodes: 14,
    ott_platform_name: 'Apple TV+',
    ott_redirect_url: 'https://tv.apple.com',
    rating: 9.5,
    notes: 'The work is mysterious and important. Please enjoy each episode equally.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'guest-item-3',
    user_id: 'guest-cinephile-0001',
    title: 'The Grand Budapest Hotel',
    media_type: 'movie',
    status: 'watched',
    poster_url: 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWX9NZkt5BW.jpg',
    runtime_minutes: 100,
    total_episodes: 1,
    watched_episodes: 1,
    ott_platform_name: 'Disney+',
    ott_redirect_url: null,
    rating: 9.0,
    notes: 'Symmetrical pastel perfection. Ralph Fiennes gives one of his greatest performances.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'guest-item-4',
    user_id: 'guest-cinephile-0001',
    title: 'Past Lives',
    media_type: 'movie',
    status: 'watched',
    poster_url: 'https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
    runtime_minutes: 106,
    total_episodes: 1,
    watched_episodes: 1,
    ott_platform_name: 'MUBI',
    ott_redirect_url: null,
    rating: 8.8,
    notes: 'In-Yun. Heartbreakingly subtle romantic drama about the lives we leave behind.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    id: 'guest-item-5',
    user_id: 'guest-cinephile-0001',
    title: 'Dune: Part Two',
    media_type: 'movie',
    status: 'bucketlist',
    poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    runtime_minutes: 166,
    total_episodes: 1,
    watched_episodes: 0,
    ott_platform_name: 'HBO Max',
    ott_redirect_url: null,
    rating: null,
    notes: 'Planning a weekend rewatch in 4K.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

export function useMediaItems() {
  const { user, isGuest } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all media items for the current user
  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Guest Mode: load from localStorage
    if (isGuest) {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(GUEST_ITEMS_KEY) : null;
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          setItems(INITIAL_GUEST_ITEMS);
          if (typeof window !== 'undefined') {
            localStorage.setItem(GUEST_ITEMS_KEY, JSON.stringify(INITIAL_GUEST_ITEMS));
          }
        }
      } catch {
        setItems(INITIAL_GUEST_ITEMS);
      }
      setLoading(false);
      return;
    }

    // Authenticated Supabase user
    const { data, error: err } = await supabase
      .from('media_items')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (err) {
      setError(err.message);
      console.error('Error fetching media items:', err);
    } else {
      setItems(data as MediaItem[]);
    }
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Add a new media item
  const addItem = useCallback(
    async (item: MediaItemInsert) => {
      if (!user) return { error: 'Not authenticated' };

      const newItem: MediaItem = {
        id: isGuest ? `guest-item-${Date.now()}` : '',
        user_id: user.id,
        title: item.title,
        media_type: item.media_type,
        status: item.status,
        poster_url: item.poster_url || null,
        runtime_minutes: item.runtime_minutes || 0,
        total_episodes: item.total_episodes || 1,
        watched_episodes: item.watched_episodes || 0,
        ott_platform_name: item.ott_platform_name || null,
        ott_redirect_url: item.ott_redirect_url || null,
        rating: item.rating !== undefined ? item.rating : null,
        notes: item.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isGuest) {
        setItems((prev) => {
          const updated = [newItem, ...prev];
          if (typeof window !== 'undefined') {
            localStorage.setItem(GUEST_ITEMS_KEY, JSON.stringify(updated));
          }
          return updated;
        });
        return { error: null, data: newItem };
      }

      const { data, error: err } = await supabase
        .from('media_items')
        .insert({
          ...item,
          user_id: user.id,
          runtime_minutes: item.runtime_minutes || 0,
          total_episodes: item.total_episodes || 1,
          watched_episodes: item.watched_episodes || 0,
        })
        .select()
        .single();

      if (err) {
        setError(err.message);
        return { error: err.message };
      }

      // Optimistic update
      setItems((prev) => [data as MediaItem, ...prev]);
      return { error: null, data: data as MediaItem };
    },
    [user, isGuest]
  );

  // Update an existing media item
  const updateItem = useCallback(
    async (update: MediaItemUpdate) => {
      if (!user) return { error: 'Not authenticated' };

      const { id, ...changes } = update;

      if (isGuest) {
        setItems((prev) => {
          const updated = prev.map((item) =>
            item.id === id
              ? { ...item, ...changes, updated_at: new Date().toISOString() }
              : item
          );
          if (typeof window !== 'undefined') {
            localStorage.setItem(GUEST_ITEMS_KEY, JSON.stringify(updated));
          }
          return updated;
        });
        return { error: null };
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...changes, updated_at: new Date().toISOString() }
            : item
        )
      );

      const { data, error: err } = await supabase
        .from('media_items')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (err) {
        setError(err.message);
        await fetchItems();
        return { error: err.message };
      }

      return { error: null, data: data as MediaItem };
    },
    [user, isGuest, fetchItems]
  );

  // Delete a media item
  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) return { error: 'Not authenticated' };

      if (isGuest) {
        setItems((prev) => {
          const updated = prev.filter((item) => item.id !== id);
          if (typeof window !== 'undefined') {
            localStorage.setItem(GUEST_ITEMS_KEY, JSON.stringify(updated));
          }
          return updated;
        });
        return { error: null };
      }

      setItems((prev) => prev.filter((item) => item.id !== id));

      const { error: err } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (err) {
        setError(err.message);
        await fetchItems();
        return { error: err.message };
      }

      return { error: null };
    },
    [user, isGuest, fetchItems]
  );

  // Increment watched episodes by 1
  const incrementEpisode = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || !user) return;

      const newCount = Math.min(item.watched_episodes + 1, item.total_episodes);
      if (newCount === item.watched_episodes) return;

      const newStatus: MediaStatus =
        newCount === item.total_episodes ? 'watched' : 'currently_watching';

      if (isGuest) {
        setItems((prev) => {
          const updated = prev.map((i) =>
            i.id === id
              ? { ...i, watched_episodes: newCount, status: newStatus, updated_at: new Date().toISOString() }
              : i
          );
          if (typeof window !== 'undefined') {
            localStorage.setItem(GUEST_ITEMS_KEY, JSON.stringify(updated));
          }
          return updated;
        });
        return;
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, watched_episodes: newCount, status: newStatus, updated_at: new Date().toISOString() }
            : i
        )
      );

      const { error: err } = await supabase
        .from('media_items')
        .update({
          watched_episodes: newCount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (err) {
        console.error('Error incrementing episode:', err);
        await fetchItems();
      }
    },
    [items, user, isGuest, fetchItems]
  );

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    incrementEpisode,
    refetch: fetchItems,
  };
}

