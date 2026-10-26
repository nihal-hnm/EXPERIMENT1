'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Film, BarChart3, LogOut, LogIn, Clapperboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, isGuest, signOut, loading } = useAuth();

  const username = profile?.username ?? user?.user_metadata?.username ?? user?.email?.split('@')[0];

  const navItems = [
    { href: '/', label: 'Library', icon: Film },
    { href: '/stats', label: 'Analytics', icon: BarChart3 },
    ...(username ? [{ href: `/profile/${encodeURIComponent(username)}`, label: 'Profile', icon: Clapperboard }] : []),
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-[var(--color-border-warm)] bg-[var(--color-cinema-bg)]/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/20 transition-all duration-300 group-hover:bg-[var(--color-amber)]/20 group-hover:border-[var(--color-amber)]/30">
              <Clapperboard className="h-5 w-5 text-[var(--color-amber)]" />
            </div>
            <span className="font-display text-xl font-bold tracking-wide text-[var(--color-cream)]">
              Cine<span className="text-[var(--color-amber)]">Log</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {user &&
              navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 cursor-pointer
                      ${
                        isActive
                          ? 'text-[var(--color-amber)] bg-[var(--color-amber)]/10'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-sepia)] hover:bg-[var(--color-cinema-card)]'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--color-amber)] rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}

            {/* Auth Button */}
            {!loading && (
              <>
                {user ? (
                  <div className="ml-3 flex items-center gap-2">
                    {isGuest && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-[var(--color-amber)]/15 text-[var(--color-amber)] border border-[var(--color-amber)]/25">
                        Guest
                      </span>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                        text-[var(--color-muted)] hover:text-[var(--color-rust)] hover:bg-[var(--color-rust)]/10
                        transition-all duration-200 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="ml-3 flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
                      bg-[var(--color-amber)] text-[var(--color-cinema-bg)] hover:bg-[var(--color-amber-light)]
                      transition-all duration-200 cursor-pointer"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
