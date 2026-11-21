import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import { Providers } from '@/components/Providers';

import './globals.css';

// Polices hébergées par l'appli (next/font) : rien n'est chargé depuis Google.
const body = localFont({
  src: [
    { path: './fonts/Figtree_400Regular.ttf', weight: '400' },
    { path: './fonts/Figtree_500Medium.ttf', weight: '500' },
    { path: './fonts/Figtree_600SemiBold.ttf', weight: '600' },
    { path: './fonts/Figtree_700Bold.ttf', weight: '700' },
  ],
  variable: '--font-body',
  display: 'swap',
});
const display = localFont({
  src: [
    { path: './fonts/BricolageGrotesque_700Bold.ttf', weight: '700' },
    { path: './fonts/BricolageGrotesque_800ExtraBold.ttf', weight: '800' },
  ],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Pépite, la tontine entre proches', template: '%s · Pépite' },
  description:
    'La tontine entre proches, avec un tirage bonus le dimanche. Chacun reçoit la cagnotte à son tour, en francs CFA.',
  applicationName: 'Pépite',
  appleWebApp: { capable: true, title: 'Pépite', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F7F3' },
    { media: '(prefers-color-scheme: dark)', color: '#101B19' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${body.variable} ${display.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
