const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require(process.env.ZW_TEST_PLAYWRIGHT_PATH || 'playwright');

// GitHub Pages setzt keine eigenen Header; die .htaccess wirkt dort nicht. Deshalb trägt jede Seite die CSP als
// <meta> (ohne frame-ancestors, das per Meta nicht geht). Dieser Test liefert wie Pages OHNE Header aus, damit nur
// die Meta-CSP greift, und verlangt: keine CSP-Verstöße, keine JS-Fehler.
const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html') && f !== 'milo.html');
const headerCsp = fs.readFileSync(path.join(root, '.htaccess'), 'utf8').match(/Header always set Content-Security-Policy "([^"]+)"/)[1];
const expected = headerCsp.split(';').map(d => d.trim()).filter(d => d && !d.startsWith('frame-ancestors')).concat("object-src 'none'").join('; ');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
let browser, server, base;

before(async () => {
  server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    if (!path.extname(rel)) rel += '.html';
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');  // bewusst kein CSP-Header
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.ZW_TEST_BROWSER ? { executablePath: process.env.ZW_TEST_BROWSER } : {}) });
});
after(async () => { if (browser) await browser.close(); if (server) await new Promise(r => server.close(r)); });

test('jede Seite trägt die Meta-CSP passend zur .htaccess und eine Referrer-Policy', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
    assert.ok(meta, `${file}: Meta-CSP fehlt`);
    assert.equal(meta[1], expected, `${file}: Meta-CSP weicht von der .htaccess ab`);
    assert.ok(html.indexOf(meta[0]) < html.search(/<script|<link/i), `${file}: Meta-CSP muss vor Skripten und Styles stehen`);
    assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/, `${file}: Referrer-Policy fehlt`);
  }
});

test('ohne Server-Header: keine CSP-Verstöße und keine JS-Fehler auf allen Seiten', async () => {
  const page = await browser.newPage();
  const problems = [];
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) problems.push(`${page.url()}: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`${page.url()}: JS ${e.message}`));
  for (const file of pages) {
    await page.goto(`${base}/${file}`, { waitUntil: 'load' });
    await page.waitForTimeout(300);  // verzögert startende Skripte (Welle, Hero, Demo)
  }
  assert.deepEqual(problems, []);
});
