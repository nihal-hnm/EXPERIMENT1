'use client';

import { motion } from 'framer-motion';
import { Search, Film, Tv, Layers, X } from 'lucide-react';
import type { MediaStatus } from '@/lib/types';

interface FilterBarProps {
  activeTab: MediaStatus | 'all';
  onTabChange: (tab: MediaStatus | 'all') => void;
  typeFilter: 'all' | 'movie' | 'series';
  onTypeFilterChange: (filter: 'all' | 'movie' | 'series') => void;
  platformFilter: string;
  onPlatformFilterChange: (platform: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  platforms: string[];
}

const TABS: { value: MediaStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Titles' },
  { value: 'currently_watching', label: 'Watching' },
  { value: 'watched', label: 'Archive' },
  { value: 'bucketlist', label: 'Watchlist' },
];

export default function FilterBar({
  activeTab,
  onTabChange,
  typeFilter,
  onTypeFilterChange,
  platformFilter,
  onPlatformFilterChange,
  searchQuery,
  onSearchChange,
  platforms,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-[var(--color-cinema-obsidian)] p-1 border border-[var(--color-border-warm)]">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`relative flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
              activeTab === tab.value
                ? 'text-[var(--color-cream)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-sepia)]'
            }`}
          >
            {activeTab === tab.value && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 rounded-lg bg-[var(--color-cinema-card)] border border-[var(--color-border-warm)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search + Chips row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-dark)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search titles..."
            className="w-full rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
              py-2.5 pl-10 pr-9 text-sm text-[var(--color-cream)] placeholder:text-[var(--color-muted-dark)]
              focus:border-[var(--color-amber)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]/20
              transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-cream)] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-1.5">
          {[
            { value: 'all' as const, label: 'All', icon: Layers },
            { value: 'movie' as const, label: 'Films', icon: Film },
            { value: 'series' as const, label: 'Series', icon: Tv },
          ].map((chip) => {
            const Icon = chip.icon;
            const isActive = typeFilter === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => onTypeFilterChange(chip.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium
                  transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-[var(--color-amber)]/10 border-[var(--color-amber)]/25 text-[var(--color-amber)]'
                      : 'bg-transparent border-[var(--color-border-warm)] text-[var(--color-muted)] hover:text-[var(--color-sepia)] hover:border-[var(--color-border-warm-hover)]'
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Platform filter */}
        {platforms.length > 0 && (
          <select
            value={platformFilter}
            onChange={(e) => onPlatformFilterChange(e.target.value)}
            className="rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-obsidian)]
              px-3 py-2.5 text-xs text-[var(--color-sepia)]
              focus:border-[var(--color-amber)]/30 focus:outline-none cursor-pointer"
          >
            <option value="">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
