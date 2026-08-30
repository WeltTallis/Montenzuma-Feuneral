// Reproduction harness (writes findings to repro-live.log so it can run detached).
const fs = require('fs');
const path = require('path');
const LOG = path.join(__dirname, 'repro-live.log');
const say = (m) => { try { fs.appendFileSync(LOG, m + '\n'); } catch (_) {} };
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  say('browser up: ' + (await browser.version()));
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') say('[console.' + t + '] ' + String(m.text()).slice(0, 800));
  });
  page.on('pageerror', (e) => say('[pageerror] ' + String((e && e.stack) || e).slice(0, 1200)));
  page.on('requestfailed', (r) => say('[requestfailed] ' + r.url().slice(0, 160) + ' ' + (r.failure() && r.failure().errorText)));
  page.on('response', (r) => { if (r.status() >= 400) say('[http' + r.status() + '] ' + r.url().slice(0, 160)); });

  const target = process.argv[2] || 'https://restpoint.co.ke/';
  const observeMs = parseInt(process.argv[3] || '12000', 10);
  say('--- navigating to ' + target);
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise((r) => setTimeout(r, observeMs));

  const info = await page.evaluate(() => ({
    title: document.title,
    rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : -1,
    bodySnippet: document.body.innerText.slice(0, 300),
    swCount: navigator.serviceWorker ? navigator.serviceWorker.controller ? 'controlled' : 'registered-or-none' : 'unsupported',
  }));
  say('--- title: ' + info.title);
  say('--- #root children: ' + info.rootChildren);
  say('--- body: ' + info.bodySnippet.replace(/\s+/g, ' '));
  say('--- SW: ' + info.swCount);

  await browser.close();
  say('--- done');
})().catch((e) => { say('HARNESS FAIL: ' + String((e && e.stack) || e)); process.exit(1); });
