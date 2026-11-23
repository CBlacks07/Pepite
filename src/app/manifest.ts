import type { MetadataRoute } from 'next';

import { THEME } from '@/lib/theme';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/app',
    name: 'Pépite, la tontine entre proches',
    short_name: 'Pépite',
    description: 'La tontine entre proches, avec un tirage bonus le dimanche.',
    lang: 'fr',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: THEME.light.screen,
    theme_color: THEME.light.brand,
    categories: ['finance', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
