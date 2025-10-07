export default function manifest() {
  return {
    name: 'CampusNaksha - Smart Campus Companion',
    short_name: 'CampusNaksha',
    description: 'Your all-in-one smart campus companion for IITR. Features include interactive campus map, SOS assistance, parking availability, and garbage monitoring.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#1f2937',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    scope: '/',
    id: '/',
    categories: ['education', 'navigation', 'utilities'],
    lang: 'en',
    display_override: ['standalone', 'fullscreen'],
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    screenshots: [
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'narrow'
      }
    ]
  }
}