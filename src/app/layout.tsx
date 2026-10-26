import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CineLog — Your Cinematic Journal',
  description:
    'Track films and series you watch, want to watch, and have archived. A personal cinema companion with warm, editorial aesthetics.',
  keywords: ['film tracker', 'movie log', 'series tracker', 'cinema journal', 'watchlist'],
  authors: [{ name: 'CineLog' }],
  openGraph: {
    title: 'CineLog — Your Cinematic Journal',
    description: 'Track films and series with a premium editorial experience.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-cinema-bg)] text-[var(--color-cream)] antialiased">
        <AuthProvider>
          <CursorGlow />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
