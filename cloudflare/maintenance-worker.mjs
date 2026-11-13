const excludedPaths = [
  '/api/',
  '/socket.io/',
  '/uploads/',
  '/bridge/',
];

const isPageRequest = request => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  if (!request.headers.get('Accept')?.includes('text/html')) return false;

  const { pathname } = new URL(request.url);
  if (excludedPaths.some(path => pathname.startsWith(path))) return false;
  return pathname !== '/health' && pathname !== '/monitoring';
};

const maintenanceResponse = async (request, assets) => {
  if (!assets) throw new Error('Maintenance asset binding is not configured');

  const assetUrl = new URL('/maintenance.html', request.url);
  const page = await assets.fetch(new Request(assetUrl, { method: 'GET' }));
  if (!page.ok) {
    throw new Error(`Maintenance asset request failed with HTTP ${page.status}`);
  }

  const headers = new Headers(page.headers);
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('Retry-After', '60');
  headers.set('X-Robots-Tag', 'noindex, nofollow');

  return new Response(request.method === 'HEAD' ? null : page.body, {
    status: 503,
    headers,
  });
};

export default {
  async fetch(request, env) {
    if (!isPageRequest(request)) return fetch(request);

    try {
      const response = await fetch(request);
      if (response.status < 500) return response;
    } catch {
      return maintenanceResponse(request, env.ASSETS);
    }

    return maintenanceResponse(request, env.ASSETS);
  },
};