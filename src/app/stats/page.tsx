import type { Metadata } from 'next';
import StatsPanel from '@/components/StatsPanel';

export const metadata: Metadata = {
  title: 'Analytics — CineLog',
  description: 'Your personal watch time analytics, genre breakdown, and cinematic stats.',
};

export default function StatsPage() {
  return <StatsPanel />;
}
