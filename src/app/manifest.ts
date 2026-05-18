import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LedgerOS',
    short_name: 'LedgerOS',
    description: 'Financial dashboard powered by Tally exports',
    start_url: '/?tab=overview',
    display: 'standalone',
    background_color: '#080b12',
    theme_color: '#080b12',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
