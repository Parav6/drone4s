import withPWA from 'next-pwa'

const withPWAConfig = withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                    statuses: [0, 200]
                }
            }
        },
        {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                    statuses: [0, 200]
                }
            }
        },
        {
            urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-font-assets',
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
            }
        },
        {
            urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-image-assets',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
            }
        },
        {
            urlPattern: /\/_next\/image\?url=.+$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'next-image',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
            }
        },
        {
            urlPattern: /\.(?:mp3|wav|ogg)$/i,
            handler: 'CacheFirst',
            options: {
                rangeRequests: true,
                cacheName: 'static-audio-assets',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
            }
        },
        {
            urlPattern: /\.(?:mp4)$/i,
            handler: 'CacheFirst',
            options: {
                rangeRequests: true,
                cacheName: 'static-video-assets',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
            }
        },
        {
            urlPattern: /\.(?:js)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-js-assets',
                expiration: {
                    maxEntries: 48,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
            }
        },
        {
            urlPattern: /\.(?:css|less)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-style-assets',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
            }
        },
        {
            urlPattern: /\/_next\/static.+\.js$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'next-static-js',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
            }
        },
        {
            urlPattern: /\/api\/.*$/i,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
                cacheName: 'apis',
                expiration: {
                    maxEntries: 16,
                    maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                networkTimeoutSeconds: 10
            }
        },
        {
            urlPattern: /.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'others',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                networkTimeoutSeconds: 10
            }
        }
    ]
})

export default withPWAConfig({
    reactStrictMode: false,
    swcMinify: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    }
})
