// Service Worker for Rest Point PWA
// CACHE_VERSION lets cache-policy changes invalidate old cached responses.
// Hashed assets use network-first so deployments do not depend on bumping this
// version to stop serving an older application bundle.
const CACHE_VERSION = 'v3';
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

                // Cache each asset on its own: one missing file (or a flaky
                // network) must never abort the whole install event.
                return Promise.all(
                    STATIC_ASSETS.map((url) =>
                        cache.add(url).catch((error) => {

                        })
                    )
                );
            })
            .then(() => {

                return self.skipWaiting();
            })
            .catch((error) => {

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

                            return caches.delete(name);
                        })
                );
            })
            .then(() => {

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

    // Prefer the deployed version of static assets. A stale cached app entry
    // can reference hashed chunks that were removed by a newer deployment.
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
            fetch(cacheRequest)
                .then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        event.waitUntil(
                            caches.open(STATIC_CACHE)
                                .then((cache) => cache.put(cacheRequest, responseClone))
                        );
                        return response;
                    }

                    return caches.match(cacheRequest).then((cachedResponse) => cachedResponse || response);
                })
                .catch(() => caches.match(cacheRequest)
                    .then((cachedResponse) => cachedResponse
                        || new Response('Offline - Resource not cached', { status: 503 })))
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
