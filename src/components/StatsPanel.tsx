'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useMediaItems } from '@/hooks/useMediaItems';
import { calculateWatchTimeMinutes, minutesToDaysHours } from '@/lib/types';
import { Clock, Film, Star, Eye, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { MediaItem } from '@/lib/types';

/* ── Warm filmic palette for charts ── */
const CHART_COLORS = {
  amber: '#D4A359',
  rust: '#C05A3E',
  sepia: '#8F877E',
};

/* ── Helpers ── */
function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/* ── Stat card ── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card-grain rounded-xl border border-[var(--color-border-warm)]
        bg-[var(--color-cinema-card)] p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/15">
          <Icon className="h-4 w-4 text-[var(--color-amber)]" aria-hidden="true" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </span>
      </div>
      <div className="tabular-nums text-3xl font-bold text-[var(--color-cream)]">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--color-muted)]">{sub}</div>}
    </motion.div>
  );
}

/* ── Custom tooltip ── */
function CinemaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-cinema-card)] px-3 py-2 shadow-[var(--shadow-modal)] text-xs">
      {label && <div className="mb-1 text-[var(--color-muted)]">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="text-[var(--color-cream)] font-medium">
          {p.value} {p.name === 'minutes' ? 'min' : p.name}
        </div>
      ))}
    </div>
  );
}

export default function StatsPanel() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: itemsLoading } = useMediaItems();

  const stats = useMemo(() => {
    const watched = items.filter((i) => i.status === 'watched');
    const watching = items.filter((i) => i.status === 'currently_watching');
    const bucketlist = items.filter((i) => i.status === 'bucketlist');
    const movies = items.filter((i) => i.media_type === 'movie');
    const series = items.filter((i) => i.media_type === 'series');

    const watchedMinutes = calculateWatchTimeMinutes(watched);
    const { days, hours } = minutesToDaysHours(watchedMinutes);

    const avgRating = (() => {
      const rated = items.filter((i) => i.rating !== null && i.rating! > 0);
      if (!rated.length) return null;
      return (rated.reduce((sum, i) => sum + (i.rating ?? 0), 0) / rated.length).toFixed(1);
    })();

    // Monthly activity
    const monthMap: Record<string, number> = {};
    items.forEach((item) => {
      const key = getMonthKey(item.updated_at);
      monthMap[key] = (monthMap[key] ?? 0) + (item.runtime_minutes || 0);
    });
    const monthlyData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, minutes]) => ({ month: formatMonthLabel(key), minutes }));

    const donutData = [
      { name: 'Films', value: movies.length, color: CHART_COLORS.amber },
      { name: 'Series', value: series.length, color: CHART_COLORS.rust },
    ].filter((d) => d.value > 0);

    const topRated = [...items]
      .filter((i) => i.rating !== null && i.rating! > 0)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 5);

    return {
      total: items.length,
      watched: watched.length,
      watching: watching.length,
      bucketlist: bucketlist.length,
      movies: movies.length,
      series: series.length,
      watchedMinutes,
      days,
      hours,
      avgRating,
      monthlyData,
      donutData,
      topRated,
    };
  }, [items]);

  /* ── Auth loading ── */
  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-amber)]/20 border-t-[var(--color-amber)]" />
      </div>
    );
  }

  /* ── Auth gate ── */
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <BarChart3 className="mx-auto h-12 w-12 text-[var(--color-amber)]/50" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold text-[var(--color-cream)]">
            Analytics Center
          </h1>
          <p className="text-[var(--color-muted)] text-sm max-w-xs mx-auto">
            Sign in to see your watch time, genre breakdown, and personal charts.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-amber)] px-6 py-3
              text-sm font-semibold text-[var(--color-cinema-bg)] hover:bg-[var(--color-amber-light)]
              transition-all duration-200 cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  /* ── Items loading ── */
  if (itemsLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-48 skeleton rounded-lg mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-cream)]">
          Analytics Center
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Your cinematic journey in numbers
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Watch Time"
          value={stats.days > 0 ? `${stats.days}d ${stats.hours}h` : `${stats.hours}h`}
          sub={`${stats.watchedMinutes.toLocaleString()} minutes`}
          delay={0}
        />
        <StatCard
          icon={Eye}
          label="Watched"
          value={stats.watched}
          sub={`of ${stats.total} catalogued`}
          delay={0.06}
        />
        <StatCard
          icon={Film}
          label="Films"
          value={stats.movies}
          sub={`${stats.series} series`}
          delay={0.12}
        />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={stats.avgRating ?? '—'}
          sub="out of 10"
          delay={0.18}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut — Films vs Series */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="card-grain rounded-xl border border-[var(--color-border-warm)]
            bg-[var(--color-cinema-card)] p-6 shadow-[var(--shadow-card)]"
        >
          <h2 className="font-display text-base font-semibold text-[var(--color-cream)] mb-4">
            Films vs Series
          </h2>
          {stats.donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {stats.donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CinemaTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-1">
                {stats.donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                      aria-hidden="true"
                    />
                    <span className="text-[var(--color-sepia)]">{d.name}</span>
                    <span className="tabular-nums font-semibold text-[var(--color-cream)]">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-[var(--color-muted)]">
              No data yet
            </div>
          )}
        </motion.div>

        {/* Bar — Monthly activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="card-grain lg:col-span-2 rounded-xl border border-[var(--color-border-warm)]
            bg-[var(--color-cinema-card)] p-6 shadow-[var(--shadow-card)]"
        >
          <h2 className="font-display text-base font-semibold text-[var(--color-cream)] mb-4">
            Monthly Activity
          </h2>
          {stats.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={stats.monthlyData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#8F877E', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#8F877E', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CinemaTooltip />}
                  cursor={{ fill: 'rgba(212,163,89,0.06)' }}
                />
                <Bar
                  dataKey="minutes"
                  name="minutes"
                  fill={CHART_COLORS.amber}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-[var(--color-muted)]">
              No activity data yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Status breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="card-grain rounded-xl border border-[var(--color-border-warm)]
          bg-[var(--color-cinema-card)] p-6 shadow-[var(--shadow-card)]"
      >
        <h2 className="font-display text-base font-semibold text-[var(--color-cream)] mb-5">
          Library Breakdown
        </h2>
        <div className="space-y-4">
          {[
            { label: 'Currently Watching', count: stats.watching, color: CHART_COLORS.amber },
            { label: 'Archived (Watched)', count: stats.watched, color: '#6B8E5A' },
            { label: 'Watchlist', count: stats.bucketlist, color: CHART_COLORS.sepia },
          ].map(({ label, count, color }) => {
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[var(--color-sepia)]">{label}</span>
                  <span className="tabular-nums font-semibold text-[var(--color-cream)]">
                    {count}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-cinema-obsidian)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Top rated */}
      {stats.topRated.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="card-grain rounded-xl border border-[var(--color-border-warm)]
            bg-[var(--color-cinema-card)] p-6 shadow-[var(--shadow-card)]"
        >
          <h2 className="font-display text-base font-semibold text-[var(--color-cream)] mb-4">
            Your Top Rated
          </h2>
          <ol className="space-y-3">
            {stats.topRated.map((item: MediaItem, i: number) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <span className="tabular-nums w-5 shrink-0 text-center text-xs font-bold text-[var(--color-amber)]">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="truncate font-medium text-[var(--color-cream)] block">
                    {item.title}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                    {item.media_type === 'movie' ? 'Film' : 'Series'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star
                    className="h-3.5 w-3.5 text-[var(--color-amber)]"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  <span className="tabular-nums text-sm font-semibold text-[var(--color-cream)]">
                    {item.rating}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      )}
    </div>
  );
}
