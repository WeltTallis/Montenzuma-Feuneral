// Service Worker for Rest Point PWA
// CACHE_VERSION forces every client to drop its old caches on activation.
// Bump this on EVERY deploy that changes code — without a bump the
// stale-while-revalidate fetch handler keeps serving the previous
// content-hashed JS chunks out of cache and the deploy looks like a no-op.
const CACHE_VERSION = 'v3'; // Increment this to force cache refresh
const STATIC_CACHE = `restpoint-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `restpoint-dynamic-${CACHE_VERSION}`;
const CACHE_NAME = `restpoint-${CACHE_VERSION}`;

// Assets to cache immediately on install.

// the SW never activated and the install prompt never appeared on Android.
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/logo.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/Funeral_Plan_hero.webp',
    '/Funeral-Insurance-scaled.jpg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                // Cache each asset on its own: one missing file (or a flaky
                // network) must never abort the whole install event.
                return Promise.all(
                    STATIC_ASSETS.map((url) =>
                        cache.add(url).catch((error) => {
                            console.warn('[SW] Skipped asset (not cached):', url, error?.message);
                        })
                    )
                );
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
                // Still take over: a working fetch handler matters more than
                // the pre-cache, and Chrome needs the SW to be active.
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Delete all caches that don't match current version
                            return !name.includes(CACHE_VERSION);
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // For API requests, always go to network - do not cache to avoid stale auth issues
    if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
        return;
    }

    // Handle tenant path requests - rewrite to root
    let cacheRequest = request;
    if (url.pathname.startsWith('/tenant/')) {
        // Extract the asset path after /tenant/[tenant-slug]/
        const match = url.pathname.match(/^\/tenant\/[^\/]+\/(.+)$/);
        if (match) {
            // Rewrite to root path - don't pass original request to avoid 'navigate' mode error
            const newUrl = new URL(request.url);
            newUrl.pathname = '/' + match[1];
            cacheRequest = new Request(newUrl.toString());
        }
    }

    // For static assets (JS, CSS, images, fonts), use stale-while-revalidate:
    // serve cached instantly but ALWAYS refresh the copy in the background, so
    // a new deploy is picked up on the next navigation instead of being served
    // stale for weeks (this is what kept the old release-form branding alive).
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font' ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.woff2')) {

        event.respondWith(
            caches.match(cacheRequest)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return cached version, but update cache in background
                        event.waitUntil(
                            fetch(cacheRequest)
                                .then((response) => {
                                    // Only cache successful responses
                                    if (response.ok) {
                                        caches.open(STATIC_CACHE)
                                            .then((cache) => cache.put(cacheRequest, response));
                                    }
                                    return response;
                                })
                                .catch(() => { })
                        );
                        return cachedResponse;
                    }

                    // Not in cache, fetch from network
                    return fetch(cacheRequest)
                        .then((response) => {
                            // Only cache successful responses
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(STATIC_CACHE)
                                    .then((cache) => cache.put(cacheRequest, responseClone));
                            }
                            return response;
                        })
                        .catch(() => {
                            // Return offline fallback
                            return new Response('Offline - Resource not cached', { status: 503 });
                        });
                })
        );
        return;
    }

    // For HTML pages, use network-first strategy
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Cache successful responses
                if (response.ok && request.headers.get('Accept').includes('text/html')) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => cache.put(request, responseClone));
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // No cache, return offline page for HTML requests
                        if (request.headers.get('Accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }

                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CACHE_URLS':
            caches.open(CACHE_NAME)
                .then((cache) => cache.addAll(payload.urls))
                .then(() => {
                    event.ports[0]?.postMessage({ success: true });
                })
                .catch((error) => {
                    event.ports[0]?.postMessage({ success: false, error: error.message });
                });
            break;

        case 'PURGE_CACHE':
            caches.delete(CACHE_NAME)
                .then(() => caches.delete(STATIC_CACHE))
                .then(() => caches.delete(DYNAMIC_CACHE))
                .then(() => {
                    event.ports[0]?.postMessage({ success: true });
                });
            break;

        default:
            break;
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Process any pending offline actions
            console.log('[SW] Background sync triggered')
        );
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) {
        return;
    }

    const data = event.data.json();
    const options = {
        body: data.body || 'New notification',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Rest Point', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If a window is already open, focus it
                for (const client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new window
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
    );
});

console.log('[SW] Service worker script loaded');