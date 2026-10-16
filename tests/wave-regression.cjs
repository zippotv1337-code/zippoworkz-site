const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require(process.env.ZW_TEST_PLAYWRIGHT_PATH || 'playwright');

// Welle: kommt von links, zieht durch die Mitte, gleitet nach rechts unten, weiße Punkte an den Rändern.
const root = path.resolve(__dirname, '..');
const csp = fs.readFileSync(path.join(root, '.htaccess'), 'utf8').match(/Header always set Content-Security-Policy "([^"]+)"/)[1];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
let browser, server, base;
before(async () => {
  server = http.createServer((req, res) => {
    let rel = new URL(req.url, 'http://127.0.0.1').pathname.replace(/^\/+/, '') || 'index.html';
    if (!path.extname(rel)) rel += '.html';
    const file = path.resolve(root, rel);
    if (req.method !== 'GET' || !file.startsWith(root + path.sep) || rel.split('/').some(p => p.startsWith('.')) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.ZW_TEST_BROWSER ? { executablePath: process.env.ZW_TEST_BROWSER } : {}) });
});
after(async () => { if (browser) await browser.close(); if (server) await new Promise(r => server.close(r)); });

async function open(width, height, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  const problems = [];
  await context.route('**/*', route => {
    const url = route.request().url();
    if (!url.startsWith(base) && !url.startsWith('data:')) { problems.push('extern: ' + url); return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', e => problems.push(e.message));
  await page.goto(base + '/', { waitUntil: 'load' });
  return { page, context, problems };
}

// Zählt Pixel im Rechteck (Anteile der Fläche): gemalt (Alpha > 40) und weiß (Kern der Punkte).
function ink(page, x0, y0, x1, y1) {
  return page.evaluate(([a, b, c, d]) => {
    const cv = document.getElementById('stream'), ctx = cv.getContext('2d');
    const x = Math.round(cv.width * a), y = Math.round(cv.height * b), w = Math.round(cv.width * (c - a)), h = Math.round(cv.height * (d - b));
    const px = ctx.getImageData(x, y, w, h).data;
    let painted = 0, white = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 40) painted++;
      if (px[i + 3] > 200 && px[i] > 235 && px[i + 1] > 235 && px[i + 2] > 235) white++;
    }
    return { painted, white };
  }, [x0, y0, x1, y1]);
}

const LEFT = [0, 0.55, 0.2, 0.97], CENTER = [0.4, 0.35, 0.62, 0.7], BOTTOM_RIGHT = [0.75, 0.7, 1, 1], TOP_RIGHT = [0.7, 0.08, 1, 0.3];

test('Welle schwingt von links herein und liegt danach links, in der Mitte und unten rechts', async () => {
  const { page, context, problems } = await open(1440, 900);
  await page.waitForTimeout(350);
  const early = { left: await ink(page, ...LEFT), right: await ink(page, ...BOTTOM_RIGHT) };
  assert.ok(early.left.painted > 100, 'links ist früh schon Welle zu sehen');
  assert.ok(early.right.painted < 50, 'unten rechts ist früh noch nichts: die Welle kommt von links');
  await page.waitForTimeout(3500);
  const late = { left: await ink(page, ...LEFT), center: await ink(page, ...CENTER), right: await ink(page, ...BOTTOM_RIGHT), top: await ink(page, ...TOP_RIGHT) };
  assert.ok(late.left.painted > 300, 'links');
  assert.ok(late.center.painted > 300, 'Mitte');
  assert.ok(late.right.painted > 300, 'unten rechts');
  assert.ok(late.top.painted < 60, 'oben rechts bleibt frei, die Welle kommt nicht mehr von oben');
  assert.deepEqual(problems, []);
  await context.close();
});

test('weiße Punkte sitzen an der Welle', async () => {
  const { page, context } = await open(1440, 900);
  await page.waitForTimeout(3500);
  const all = await ink(page, 0, 0, 1, 1);
  assert.ok(all.white >= 12, 'mindestens ein paar weiße Punkte, gefunden: ' + all.white);
  await context.close();
});

test('reduzierte Bewegung: Welle steht still, Punkte bleiben sichtbar', async () => {
  const { page, context, problems } = await open(1440, 900, 'reduce');
  const first = await ink(page, 0, 0, 1, 1);
  await page.waitForTimeout(700);
  const second = await ink(page, 0, 0, 1, 1);
  assert.deepEqual(second, first, 'nichts bewegt sich');
  assert.ok(first.painted > 1500 && first.white >= 8);
  assert.deepEqual(problems, []);
  await context.close();
});

test('Handy: Welle ohne Fehler, auch nach unten gescrollt', async () => {
  const { page, context, problems } = await open(390, 844);
  await page.waitForTimeout(3500);
  assert.ok((await ink(page, 0, 0, 1, 1)).painted > 800);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  assert.ok((await ink(page, 0, 0, 1, 1)).painted > 200, 'am Seitenende endet die Welle sichtbar');
  assert.deepEqual(problems, []);
  await context.close();
});

test('Hero-Slider: Pfeile wechseln die Folie, nur die aktive ist bedienbar, reduzierte Bewegung wechselt nie allein', async () => {
  const state = page => page.evaluate(() => [...document.querySelectorAll('.hero .slide')].map(s => s.classList.contains('is-active') && !s.inert && !s.hasAttribute('aria-hidden')));
  const { page, context, problems } = await open(1440, 900);
  assert.deepEqual(await state(page), [true, false, false]);
  await page.click('.slide-arrow.next');
  assert.deepEqual(await state(page), [false, true, false]);
  await page.click('.slide-arrow.prev');
  await page.click('.slide-arrow.prev');
  assert.deepEqual(await state(page), [false, false, true], 'von Folie 1 zurück landet auf der letzten');
  assert.equal(await page.getAttribute('.slide-dot:nth-child(3)', 'aria-current'), 'true');
  assert.deepEqual(problems, []);
  await context.close();

  const calm = await open(1440, 900, 'reduce');
  assert.equal(await calm.page.getAttribute('.slide-pause', 'aria-pressed'), 'true');
  await calm.page.waitForTimeout(8200);
  assert.deepEqual(await state(calm.page), [true, false, false], 'kein automatischer Wechsel');
  assert.deepEqual(calm.problems, []);
  await calm.context.close();
});
