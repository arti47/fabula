// The icon set has to cover every place that asks for one. An emoji that was missing rendered as
// an empty box; an SVG that is missing renders as nothing at all, which is quieter and worse.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ICON_NAMES } from '../src/icons.js';

const ROOT = new URL('..', import.meta.url).pathname;
const router = readFileSync(`${ROOT}src/router.js`, 'utf8');

test('every tab has an icon', () => {
  const ids = [...router.matchAll(/\{ id: '([\w-]+)', label:/g)].map((m) => m[1]);
  assert.ok(ids.length >= 4, `found only ${ids.length} tabs`);
  for (const id of ids) assert.ok(ICON_NAMES.includes(id), `no icon for the ${id} tab`);
});

test('the header icons exist', () => {
  for (const name of ['light', 'dark', 'settings']) {
    assert.ok(ICON_NAMES.includes(name), `no ${name} icon`);
  }
});

test('the icon set carries nothing nobody asks for', () => {
  // A drawn icon nobody names is dead art, the same defect class as dead data (§0.1).
  const src = readdirSync(`${ROOT}src`)
    .filter((f) => f.endsWith('.js') && f !== 'icons.js')
    .map((f) => readFileSync(`${ROOT}src/${f}`, 'utf8'))
    .join('\n');
  for (const name of ICON_NAMES) {
    assert.match(src, new RegExp(`'${name}'`), `${name} is drawn but never used`);
  }
});
