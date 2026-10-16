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

// Owner 16.10.2026: no 1-5 digits, a light runs the steps on its own; reduced motion shows every step lit and still.
const pipeState = page => page.locator('#pipeline').evaluate(el => ({
  cls: el.className,
  head: getComputedStyle(el, '::before').animationName,
  len: parseFloat(getComputedStyle(el).getPropertyValue('--len')),
  lit: [...el.children].map(li => getComputedStyle(li).opacity),
  marks: [...el.children].map(li => getComputedStyle(li, '::before').content),
}));

test('markets pipeline: reduced motion keeps every step lit and still', async () => {
  const { context, page, errors, external } = await contextFor('reduce');
  try {
    assert.equal((await page.goto(base + '/markets-lab', { waitUntil: 'networkidle' })).status(), 200);
    await page.locator('#pipeline').scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    const s = await pipeState(page);
    assert.ok(!/armed|flowing/.test(s.cls), 'no animation classes under reduce');
    assert.equal(s.head, 'none');
    assert.deepEqual(s.lit, ['1', '1', '1', '1', '1']);
    assert.ok(s.marks.every(mark => !/\d/.test(mark)), 'no step digits');
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
  } finally { await context.close(); }
});

test('markets pipeline: light starts in view and lights every step', async () => {
  const { context, page, errors, external } = await contextFor();
  try {
    await page.goto(base + '/markets-lab', { waitUntil: 'networkidle' });
    assert.ok(/armed/.test((await pipeState(page)).cls), 'steps start dark');
    await page.locator('#pipeline').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.getElementById('pipeline').classList.contains('flowing'));
    await page.waitForTimeout(4000);
    const s = await pipeState(page);
    assert.equal(s.head, 'pipe-head-y', 'phone layout runs the vertical light');
    assert.ok(s.len > 100, 'line length measured from the real steps: ' + s.len);
    assert.deepEqual(s.lit, ['1', '1', '1', '1', '1']);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
  } finally { await context.close(); }
});
