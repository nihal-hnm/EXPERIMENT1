'use client';

import { useEffect, useRef, useState } from 'react';

export function useCursorGlow() {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Only enable on desktop (no touch)
    const mq = window.matchMedia('(pointer: fine) and (min-width: 768px)');
    setIsDesktop(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handleChange);

    // Respect reduced motion
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) {
      setIsDesktop(false);
      return () => mq.removeEventListener('change', handleChange);
    }

    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const glow = glowRef.current;
    if (!glow) return;

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Use rAF for smooth performance
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
        glow.style.opacity = '1';
      });
    };

    const handleMouseLeave = () => {
      glow.style.opacity = '0';
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDesktop]);

  return { glowRef, isDesktop };
}
