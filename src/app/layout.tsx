import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import { Providers } from '@/components/Providers';
import { THEME } from '@/lib/theme';

import './globals.css';

// Polices hébergées par l'appli (next/font) : rien n'est chargé depuis Google.
const body = localFont({
  src: './fonts/IBMPlexSans.woff2',
  weight: '400 700',
  variable: '--font-body',
  display: 'swap',
});
const display = localFont({
  src: './fonts/Newsreader.woff2',
  weight: '400 700',
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
    { media: '(prefers-color-scheme: light)', color: THEME.light.screen },
    { media: '(prefers-color-scheme: dark)', color: THEME.dark.screen },
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
