// Minimal probe: can puppeteer launch a browser here, and how long does it take?
const puppeteer = require('puppeteer');
const t0 = Date.now();
const log = (m) => console.log('[' + Math.round((Date.now() - t0) / 1000) + 's] ' + m);

(async () => {
  log('launching browser (headless shell)...');
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  log('browser launched, version: ' + (await browser.version()));
  const page = await browser.newPage();
  log('page created');
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  log('example.com loaded, title: ' + (await page.title()));
  await browser.close();
  log('closed cleanly');
})().catch((e) => { console.error('PROBE FAIL:', String(e && e.message || e)); process.exit(1); });
