import type { Metadata } from 'next';
import AuthCard from '@/components/AuthCard';

export const metadata: Metadata = {
  title: 'Sign In — CineLog',
  description: 'Sign in to your CineLog screening room and access your cinematic journal.',
};

export default function LoginPage() {
  return <AuthCard mode="login" />;
}
