const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const guide = fs.readFileSync(path.join(root, 'anfragen-automatisieren.html'), 'utf8');

test('homepage exposes only the approved public pricing anchors', () => {
  assert.match(index, /Anfrage-Autopilot[\s\S]*?1\.490\s*€/);
  assert.match(index, /Individuelle Automation[\s\S]*?ab\s+2\.490\s*€/);
  assert.match(index, /Betreuung[\s\S]*?ab\s+490\s*€[\s\S]*?(pro Monat|\/\s*Monat)/);

  assert.doesNotMatch(index, /ab\s+3\.900\s*€/);
  assert.doesNotMatch(index, /ab\s+1\.990\s*€/);
  assert.doesNotMatch(index, />990\s*€<\/b><span>pro Monat<\/span>/);
  assert.doesNotMatch(index, /Erste Rückmeldung in ca\. 30 Minuten/);
});

test('guide uses the same custom automation entry price', () => {
  assert.match(guide, /Anfrage-Autopilot kostet 1\.490\s*€/);
  assert.match(guide, /ab\s+2\.490\s*€/);
  assert.doesNotMatch(guide, /ab\s+3\.900\s*€/);
});

test('hero stays sales-led and does not promote Creator OS above the fold', () => {
  assert.match(index, /Anfragen automatisch einordnen\./);
  assert.match(index, /Antwortentwurf bereit/);
  assert.match(index, /Ablauf-Check anfragen/);
  const header = index.slice(index.indexOf('<header'), index.indexOf('</header>') + 9);
  assert.doesNotMatch(header, />Creator OS</);
  assert.doesNotMatch(header, />Labs</);
});

test('existing animation hooks remain present', () => {
  assert.match(index, /<canvas class="stream" id="stream"/);
  assert.match(index, /assets\/stream\.js/);
  assert.match(index, /class="slides"/);
});
