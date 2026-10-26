'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInAsGuest: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const GUEST_USER: User = {
  id: 'guest-cinephile-0001',
  app_metadata: { provider: 'guest' },
  user_metadata: {
    username: 'guest',
    full_name: 'Guest Cinephile',
    display_name: 'Guest Cinephile',
  },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  email: 'guest@cinelog.app',
  role: 'authenticated',
  updated_at: '2026-01-01T00:00:00.000Z',
} as User;

export const GUEST_PROFILE: Profile = {
  id: 'guest-cinephile-0001',
  username: 'guest',
  display_name: 'Guest Cinephile',
  avatar_url: null,
  is_public: true,
  created_at: '2026-01-01T00:00:00.000Z',
};

const GUEST_STORAGE_KEY = 'cinelog_is_guest';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // Fallback profile if row is not yet created
        setProfile({
          id: userId,
          username: null,
          display_name: null,
          avatar_url: null,
          is_public: true,
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore network errors on profile fetch
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (isGuest) {
      setProfile(GUEST_PROFILE);
      return;
    }
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, isGuest, fetchProfile]);

  useEffect(() => {
    // Check if user was previously in guest mode
    if (typeof window !== 'undefined' && localStorage.getItem(GUEST_STORAGE_KEY) === 'true') {
      setIsGuest(true);
      setUser(GUEST_USER);
      setProfile(GUEST_PROFILE);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      const currentUser = s?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
      setIsGuest(false);
      setSession(s);
      const currentUser = s?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
    setIsGuest(false);
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
    setIsGuest(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
    setIsGuest(false);
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInAsGuest = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_STORAGE_KEY, 'true');
    }
    setIsGuest(true);
    setUser(GUEST_USER);
    setProfile(GUEST_PROFILE);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
    setIsGuest(false);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isGuest,
        signUp,
        signIn,
        signInWithMagicLink,
        signInAsGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

