const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require(process.env.ZW_TEST_PLAYWRIGHT_PATH || 'playwright');

// Jede Seite muss unter der eigenen Domain (Root) und unter GitHub Pages (Unterpfad /zippoworkz-site/) vollständig laden,
// gestylt sein und auf dem Handy nicht seitlich überlaufen. Alle internen Links müssen auf eine vorhandene Datei zeigen.
const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html') && f !== 'milo.html');
const csp = fs.readFileSync(path.join(root, '.htaccess'), 'utf8').match(/Header always set Content-Security-Policy "([^"]+)"/)[1];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };
const PREFIX = '/zippoworkz-site';
let browser, server, base;

before(async () => {
  // Wie GitHub Pages: /pfad -> pfad.html, /ordner/ -> index.html; mit Präfix oder ohne.
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === PREFIX) { res.writeHead(301, { Location: PREFIX + '/' }); res.end(); return; }
    if (p.startsWith(PREFIX + '/')) p = p.slice(PREFIX.length);
    let rel = p.replace(/^\/+/, '');
    if (!rel || rel.endsWith('/')) rel += 'index.html';
    if (!path.extname(rel)) rel += '.html';
    const file = path.resolve(root, rel);
    if (req.method !== 'GET' || !file.startsWith(root + path.sep) || rel.split('/').some(x => x.startsWith('.')) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.ZW_TEST_BROWSER ? { executablePath: process.env.ZW_TEST_BROWSER } : {}) });
});
after(async () => { if (browser) await browser.close(); if (server) await new Promise(r => server.close(r)); });

for (const prefix of ['', PREFIX]) {
  for (const [label, width, height] of [['Desktop', 1440, 900], ['Handy', 390, 844]]) {
    test(`${label} ${prefix || '(Domain-Root)'}: alle Seiten laden vollständig, gestylt, ohne seitlichen Überlauf`, async () => {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const failed = [];
      page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
      page.on('pageerror', e => failed.push('JS: ' + e.message));
      for (const file of pages) {
        const url = `${base}${prefix}/${file === 'index.html' ? '' : file.replace(/\.html$/, '')}`;
        await page.goto(url, { waitUntil: 'load' });
        const info = await page.evaluate(() => ({
          styled: getComputedStyle(document.body).backgroundColor === 'rgb(0, 2, 15)',
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          links: [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith(location.origin)),
        }));
        assert.ok(info.styled, `${file}: ohne Stylesheet`);
        assert.ok(info.overflow <= 1, `${file}: ${info.overflow}px seitlicher Überlauf bei ${width}px`);
        for (const href of new Set(info.links.map(h => h.split('#')[0]))) {
          const status = (await page.request.get(href)).status();
          assert.equal(status, 200, `${file}: interner Link ${href} -> ${status}`);
          assert.ok(href.startsWith(base + prefix + '/'), `${file}: Link verlässt den Unterpfad: ${href}`);
        }
      }
      assert.deepEqual(failed.filter(f => !f.includes('/404')), []);
      await context.close();
    });
  }
}
