'use client';

import { useCursorGlow } from '@/hooks/useCursorGlow';

export default function CursorGlow() {
  const { glowRef, isDesktop } = useCursorGlow();

  if (!isDesktop) return null;

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}
