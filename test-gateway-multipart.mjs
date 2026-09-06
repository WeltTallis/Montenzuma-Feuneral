// Definitive test: does the gateway's proxy pattern (express.json + urlencoded
// + http-proxy-middleware 3.0.7 with fixRequestBody) strip multipart bodies?
import express from 'express';
import multer from 'multer';

const { createProxyMiddleware, fixRequestBody } = await import('http-proxy-middleware');

// ── Upstream: mimics the florist service (multer + echo) ──
const upstream = express();
const upload = multer({ storage: multer.memoryStorage() });
upstream.post('/florist/flower-samples', upload.array('images', 10), (req, res) => {
  res.json({
    receivedBody: req.body,
    fileCount: (req.files || []).length,
  });
});
const upstreamServer = upstream.listen(0);

// ── Mini-gateway: EXACT same middleware order/pattern as api-gateway/server.js ──
const gateway = express();
gateway.use(express.json({ limit: '1mb' }));
gateway.use(express.urlencoded({ extended: true, limit: '1mb' }));

const proxy = createProxyMiddleware({
  target: `http://127.0.0.1:${upstreamServer.address().port}`,
  changeOrigin: true,
  secure: false,
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.headers['x-tenant-slug']) proxyReq.setHeader('x-tenant-slug', req.headers['x-tenant-slug']);
      try {
        fixRequestBody(proxyReq, req);
      } catch (e) {
        console.error('fixRequestBody threw:', e.message);
      }
    },
  },
});
gateway.use('/api/v1/restpoint', proxy);

const gatewayServer = gateway.listen(0, async () => {
  const port = gatewayServer.address().port;

  // ── Build a real multipart body like the browser/axios would ──
  const boundary = '----WebKitFormBoundaryTESTBOUNDARY';
  const fields = {
    title: 'White Rose Wreath',
    description: 'A beautiful white rose wreath',
    types: 'Wreath, Spray',
    colors: 'White, Red',
    sizes: 'Small, Medium, Large',
  };
  let text = '';
  for (const [k, v] of Object.entries(fields)) {
    text += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
  }
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;
  const bodyBuffer = Buffer.concat([
    Buffer.from(text, 'utf8'),
    Buffer.from(fileHeader, 'utf8'),
    png,
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'),
  ]);

  const res = await fetch(`http://127.0.0.1:${port}/api/v1/restpoint/florist/flower-samples`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'x-tenant-slug': 'test_tenant',
    },
    body: bodyBuffer,
  });
  const text = await res.text();
  console.log('THROUGH-GATEWAY STATUS:', res.status);
  console.log('THROUGH-GATEWAY BODY:', text.slice(0, 600));
  gatewayServer.close();
  upstreamServer.close();
  process.exit(0);
});
