// End-to-end test: replicate the exact multipart request the browser sends
// and run it through multer + the REAL createFlowerArrangement controller.
import express from 'express';
import multer from 'multer';

// ── 1. Build a real multipart body exactly like the browser/axios would ──
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
// Minimal valid 1x1 transparent PNG
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

// ── 2. Express app mirroring the florist service middleware ──
process.env.NODE_ENV = 'development'; // ensureUploadDir uses tmp fallback
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3399'; // unreachable -> fail fast after validations
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage() });

const { createFlowerArrangement } = await import('./controllers/flowerSamples.ts');

app.post('/florist/flower-samples', upload.array('images', 10), (req, res) => {
  // Fake the tenant context the real middleware would provide
  req.tenantSlug = 'test_tenant';
  req.headers['x-tenant-id'] = 'test-tenant-id';
  createFlowerArrangement(req, res);
});

const server = app.listen(0, async () => {
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/florist/flower-samples`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length,
    },
    body: bodyBuffer,
  });
  const text = await res.text();
  console.log('STATUS:', res.status);
  console.log('BODY:', text.slice(0, 500));
  server.close();
  process.exit(0);
});
