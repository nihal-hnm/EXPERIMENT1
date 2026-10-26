'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Clapperboard, Mail, Lock, Sparkles, ArrowRight, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthCardProps {
  mode: 'login' | 'register';
}

export default function AuthCard({ mode }: AuthCardProps) {
  const { signIn, signUp, signInWithMagicLink, signInAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (showMagicLink) {
      const { error: err } = await signInWithMagicLink(email);
      if (err) {
        setError(err.message);
      } else {
        setMagicLinkSent(true);
      }
      setLoading(false);
      return;
    }

    const fn = mode === 'login' ? signIn : signUp;
    const { error: err } = await fn(email, password);

    if (err) {
      setError(err.message);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    await signInAsGuest();
    router.push('/');
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="card-grain w-full max-w-md rounded-2xl border border-[var(--color-border-warm)]
          bg-[var(--color-cinema-card)] p-8 shadow-[var(--shadow-modal)]"
      >
        {/* Header — Cinema ticket style */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl
            bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/20">
            <Clapperboard className="h-7 w-7 text-[var(--color-amber)]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-cream)]">
            {mode === 'login' ? 'Welcome Back' : 'Join CineLog'}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            {mode === 'login'
              ? 'Sign in to your screening room'
              : 'Start tracking your cinematic journey'}
          </p>
        </div>

        {/* Decorative divider — film perforations */}
        <div className="mb-6 flex items-center gap-2">
          <div className="h-px flex-1 bg-[var(--color-border-warm)]" />
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-2 w-2 rounded-full bg-[var(--color-amber)]/15" />
            ))}
          </div>
          <div className="h-px flex-1 bg-[var(--color-border-warm)]" />
        </div>

        <AnimatePresence mode="wait">
          {magicLinkSent ? (
            <motion.div
              key="magic-sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 text-center"
            >
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-[var(--color-amber)]" />
              <h2 className="font-display text-lg font-semibold text-[var(--color-cream)]">
                Check Your Inbox
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                We sent a magic link to <strong className="text-[var(--color-sepia)]">{email}</strong>
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-dark)]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="director@cinema.com"
                    className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                      py-3 pl-11 pr-4 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-muted-dark)]
                      focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                      transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password (hidden for magic link) */}
              {!showMagicLink && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-dark)]" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!showMagicLink}
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
                        py-3 pl-11 pr-4 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-muted-dark)]
                        focus:border-[var(--color-amber)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/30
                        transition-all duration-200"
                    />
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md bg-[var(--color-rust)]/10 border border-[var(--color-rust)]/20
                    px-3 py-2 text-xs text-[var(--color-rust-light)]"
                >
                  {error}
                </motion.p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 rounded-lg
                  bg-[var(--color-amber)] px-4 py-3 text-sm font-semibold text-[var(--color-cinema-bg)]
                  hover:bg-[var(--color-amber-light)] disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-cinema-bg)] border-t-transparent" />
                ) : (
                  <>
                    {showMagicLink
                      ? 'Send Magic Link'
                      : mode === 'login'
                        ? 'Sign In'
                        : 'Create Account'}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              {/* Magic link toggle */}
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowMagicLink(!showMagicLink)}
                  className="w-full text-center text-xs text-[var(--color-muted)] hover:text-[var(--color-amber)]
                    transition-colors duration-200 cursor-pointer"
                >
                  {showMagicLink ? 'Use password instead' : 'Sign in with magic link'}
                </button>
              )}

              {/* Or Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border-warm)]" />
                </div>
                <span className="relative bg-[var(--color-cinema-card)] px-3 text-[11px] uppercase tracking-wider text-[var(--color-muted-dark)]">
                  or
                </span>
              </div>

              {/* Guest Login Button */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border-warm-hover)]
                  bg-[var(--color-cinema-obsidian)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider
                  text-[var(--color-sepia)] hover:text-[var(--color-cream)] hover:border-[var(--color-amber)]/40 hover:bg-[var(--color-cinema-card)]
                  disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-sm group"
              >
                <Ticket className="h-4 w-4 text-[var(--color-amber)] group-hover:rotate-12 transition-transform duration-200" />
                Explore as Guest (Demo Library)
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer link */}
        <div className="mt-6 pt-4 border-t border-[var(--color-border-warm)] text-center text-sm text-[var(--color-muted)]">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <Link href="/register" className="text-[var(--color-amber)] hover:text-[var(--color-amber-light)] transition-colors cursor-pointer">
                Create one
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--color-amber)] hover:text-[var(--color-amber-light)] transition-colors cursor-pointer">
                Sign in
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
