import type { Metadata } from 'next';
import AuthCard from '@/components/AuthCard';

export const metadata: Metadata = {
  title: 'Create Account — CineLog',
  description: 'Join CineLog and start tracking your cinematic journey today.',
};

export default function RegisterPage() {
  return <AuthCard mode="register" />;
}
