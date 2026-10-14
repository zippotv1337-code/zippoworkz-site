const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require(process.env.ZW_TEST_PLAYWRIGHT_PATH || 'playwright');

const root = path.resolve(__dirname, '..');
const headers = fs.readFileSync(path.join(root, '.htaccess'), 'utf8');
const csp = headers.match(/Header always set Content-Security-Policy "([^"]+)"/)[1];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
let browser, server, base;
before(async () => {
  server = http.createServer((req, res) => {
    if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
    let rel = new URL(req.url, 'http://127.0.0.1').pathname.replace(/^\/+/, '') || 'index.html';
    if (!path.extname(rel)) rel += '.html';
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep) || rel.split('/').some(part => part.startsWith('.')) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.ZW_TEST_BROWSER ? { executablePath: process.env.ZW_TEST_BROWSER } : {}) });
});
after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function contextFor(reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion });
  const errors = [], external = [];
  await context.route('**/*', route => {
    const req = route.request();
    if (req.url().startsWith(base + '/') && req.method() === 'GET') return route.continue();
    external.push(req.method()); return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  return { context, page, errors, external };
}

test('creator preview works under the actual self-only CSP', async () => {
  const { context, page, errors, external } = await contextFor('reduce');
  try {
    assert.equal((await page.goto(base + '/creator', { waitUntil: 'networkidle' })).status(), 200);
    const heights = await page.locator('.pkg-shots i').evaluateAll(items => items.map(item => Number(getComputedStyle(item).getPropertyValue('--h'))));
    assert.deepEqual(heights, [94, 91, 88, 86, 84]);
    assert.deepEqual(errors, [], 'the real CSP must not reject preview styles');
    assert.deepEqual(external, [], 'no external or write requests');
  } finally { await context.close(); }
});

test('markets pipeline honors reduced motion while completing its local demo', async () => {
  const { context, page, errors, external } = await contextFor('reduce');
  try {
    assert.equal((await page.goto(base + '/markets-lab', { waitUntil: 'networkidle' })).status(), 200);
    await page.locator('#pipe-run').focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.getElementById('pipe-run').textContent === 'Nochmal zeigen');
    assert.equal(await page.locator('#pipeline li.on').count(), 5);
    const durations = await page.locator('#pipeline').evaluate(el => [getComputedStyle(el, '::after').transitionDuration, getComputedStyle(el.firstElementChild, '::before').transitionDuration]);
    assert.ok(durations.every(value => value.split(',').every(part => parseFloat(part) === 0)), 'reduce must disable both line and step transitions');
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
  } finally { await context.close(); }
});
