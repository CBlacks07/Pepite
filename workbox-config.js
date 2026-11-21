// Service worker de la PWA, généré après `expo export` (voir le script "build").
// - Les fichiers statiques (JS, CSS, polices, icônes) sont mis en cache pour l'installation.
// - Les pages passent par le réseau d'abord, avec repli sur la dernière version vue hors ligne.
// - L'API (/api/...) n'est jamais mise en cache : les montants doivent toujours être à jour.
module.exports = {
  globDirectory: 'dist/client/',
  globPatterns: ['**/*.{js,css,ttf,png,ico,json}'],
  globIgnores: ['sw.js', 'workbox-*.js'],
  swDest: 'dist/client/sw.js',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  clientsClaim: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) => request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 30 },
      },
    },
  ],
};
