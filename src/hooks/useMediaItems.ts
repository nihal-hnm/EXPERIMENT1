'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { MediaItem, MediaItemInsert, MediaItemUpdate, MediaStatus } from '@/lib/types';

export function useMediaItems() {
  const { user } = useAuth();
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
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Add a new media item
  const addItem = useCallback(
    async (item: MediaItemInsert) => {
      if (!user) return { error: 'Not authenticated' };

      const newItem = {
        ...item,
        user_id: user.id,
        runtime_minutes: item.runtime_minutes || 0,
        total_episodes: item.total_episodes || 1,
        watched_episodes: item.watched_episodes || 0,
      };

      const { data, error: err } = await supabase
        .from('media_items')
        .insert(newItem)
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
    [user]
  );

  // Update an existing media item
  const updateItem = useCallback(
    async (update: MediaItemUpdate) => {
      if (!user) return { error: 'Not authenticated' };

      const { id, ...changes } = update;

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
        // Revert on failure
        await fetchItems();
        return { error: err.message };
      }

      return { error: null, data: data as MediaItem };
    },
    [user, fetchItems]
  );

  // Delete a media item
  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) return { error: 'Not authenticated' };

      // Optimistic removal
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
    [user, fetchItems]
  );

  // Increment watched episodes by 1 (optimistic)
  const incrementEpisode = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || !user) return;

      const newCount = Math.min(item.watched_episodes + 1, item.total_episodes);
      if (newCount === item.watched_episodes) return;

      // Determine if we should auto-update status
      const newStatus: MediaStatus =
        newCount === item.total_episodes ? 'watched' : 'currently_watching';

      // Optimistic
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
    [items, user, fetchItems]
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
