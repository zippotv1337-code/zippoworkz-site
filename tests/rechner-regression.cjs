const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { calc } = require('../assets/rechner.js');

test('Rechner nutzt nur die Eingaben und verspricht keine Ersparnis', () => {
  const r = calc(30, 6, 0);
  assert.equal(Math.round(r.month * 10) / 10, 13);
  assert.equal(Math.round(r.year), 156);
  assert.equal(r.cost, null);
  assert.equal(Math.round(calc(30, 6, 40).cost), 520);
  assert.equal(calc(0, 6, 40).month, 0);
  const page = fs.readFileSync(path.join(__dirname, '..', 'anfragen-automatisieren.html'), 'utf8');
  assert.match(page, /eigenen Annahmen/);
  assert.doesNotMatch(page.slice(page.indexOf('id="rechner"'), page.indexOf('</form>')), /spar/i);
});
