'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

interface EpisodeTrackerProps {
  watched: number;
  total: number;
  onIncrement: () => void;
}

export default function EpisodeTracker({ watched, total, onIncrement }: EpisodeTrackerProps) {
  const percentage = total > 0 ? (watched / total) * 100 : 0;
  const remaining = total - watched;
  const isComplete = watched >= total;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-amber)]/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: isComplete
              ? 'var(--color-success)'
              : 'linear-gradient(90deg, var(--color-amber-dark), var(--color-amber))',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Counter row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[var(--color-sepia)]">
            <span className="tabular-nums font-medium text-[var(--color-cream)]">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={watched}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  {watched}
                </motion.span>
              </AnimatePresence>
            </span>
            {' / '}
            <span className="tabular-nums">{total}</span>
            {' ep'}
          </span>
          {remaining > 0 && (
            <span className="text-[var(--color-muted)]">
              <span className="tabular-nums">{remaining}</span> left
            </span>
          )}
        </div>

        {/* +1 Episode button */}
        {!isComplete && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onIncrement}
            className="flex items-center gap-1 rounded-md bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/20
              px-2 py-0.5 text-[10px] font-semibold text-[var(--color-amber)]
              hover:bg-[var(--color-amber)]/20 hover:border-[var(--color-amber)]/30
              active:bg-[var(--color-amber)]/30
              transition-all duration-150 cursor-pointer"
            title="Mark next episode as watched"
          >
            <Plus className="h-3 w-3" />
            <span>1 Ep</span>
          </motion.button>
        )}

        {isComplete && (
          <span className="text-[10px] font-medium text-[var(--color-success)]">
            ✓ Complete
          </span>
        )}
      </div>
    </div>
  );
}
