const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const index = read('index.html');
const structured = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(match => JSON.parse(match[1]));
const nodes = value => Array.isArray(value) ? value.flatMap(nodes)
  : value && typeof value === 'object' ? [value, ...Object.values(value).flatMap(nodes)] : [];

test('marketing structured data describes the brand, not a private person or street address', () => {
  const objects = structured.flatMap(nodes);
  assert.ok(objects.some(item => item.name === 'ZippoWorkz'));
  assert.ok(objects.every(item => !Object.hasOwn(item, 'founder')), 'founder data must stay off marketing SEO');
  assert.ok(objects.every(item => item['@type'] !== 'Person' && item['@type'] !== 'PostalAddress'));
  assert.ok(objects.every(item => !Object.hasOwn(item, 'streetAddress') && !Object.hasOwn(item, 'postalCode')));
  assert.ok(!/linkedin\.com\/in\//i.test(index), 'personal profile absent from marketing');
});

test('about, FAQ, demo and AI summary use brand/team contacts', () => {
  assert.ok(/ZiPPoworkz entwickelt KI-Workflows/.test(index), 'brand-led about copy');
  assert.ok(/Das ZiPPoworkz-Team plant, baut und prüft/.test(index), 'brand-led FAQ copy');
  assert.ok(/Ansprechpartner: Demo-Team/.test(read('demo.html')), 'fictional demo contact');
  assert.ok(/> ZiPPoworkz entwickelt/.test(read('llms.txt')), 'brand-led AI summary');
  assert.ok(/Viele Grüße\\nZiPPoworkz/.test(read('assets/flow.js')), 'brand-led demo signature');
});

test('legal disclosures and approved business contacts remain reachable', () => {
  for (const name of ['impressum', 'datenschutz', 'nutzungsbedingungen', 'widerruf']) {
    assert.ok(fs.statSync(path.join(root, name + '.html')).size > 0);
    assert.ok(index.includes(name), `missing legal navigation: ${name}`);
  }
  assert.match(index, /info@zippoworkz\.com/);
});

test('local MCP configuration is not tracked for root-based public deployment', () => {
  const tracked = execFileSync('git', ['ls-files', '--', '.mcp.json'], { cwd: root, encoding: 'utf8' });
  assert.equal(tracked.trim(), '', 'local developer MCP config must not ship through Pages');
  assert.match(read('.gitignore'), /^\/\.mcp\.json$/m);
});

test('webspace allowlist still excludes internal developer and credential files', () => {
  const builder = read('tools/build_webspace_zip.py');
  const allowlist = builder.match(/TOP\s*=\s*\{([\s\S]*?)\}/)?.[1];
  assert.ok(allowlist);
  assert.doesNotMatch(allowlist, /\.mcp|\.env|\.git|\.claude/);
});

test('owner name appears only on legally required pages, and those stay out of search engines', () => {
  // Owner 22.10.2026: the name must stay where the law needs it (Impressum, Datenschutz, Widerruf, AGB),
  // but those pages are noindex, not in the sitemap and not blocked in robots.txt (crawlers must see noindex).
  const legal = ['impressum', 'datenschutz', 'widerruf', 'nutzungsbedingungen'];
  const name = /Tiburczy/i;
  const files = fs.readdirSync(root).filter(f => /\.(html|txt|xml|json|js)$/.test(f))
    .concat(fs.readdirSync(path.join(root, 'assets')).filter(f => /\.(js|json|txt)$/.test(f)).map(f => 'assets/' + f));
  for (const file of files) {
    if (!name.test(read(file))) continue;
    assert.ok(legal.includes(path.basename(file, '.html')), `${file}: Name nur auf Rechtsseiten`);
  }
  const sitemap = read('sitemap.xml'), robots = read('robots.txt');
  for (const page of legal) {
    assert.match(read(`${page}.html`), /<meta name="robots" content="noindex,follow">/, `${page}: noindex fehlt`);
    assert.ok(name.test(read(`${page}.html`)), `${page}: gesetzliche Anbieterangabe muss bleiben`);
    assert.ok(!sitemap.includes(`/${page}<`), `${page}: steht noch in der Sitemap`);
    assert.ok(!new RegExp(`Disallow:\s*/${page}`, 'i').test(robots), `${page}: robots.txt darf noindex nicht verdecken`);
  }
});
