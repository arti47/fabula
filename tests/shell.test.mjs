// The shipped-file invariants (CLAUDE.md §5). Adding a module and forgetting the service worker's
// app-shell list is invisible until somebody opens the app with no signal — the one state the
// browser harnesses cannot see, because in them the server is always there. So it is checked here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(ROOT, 'service-worker.js'), 'utf8');
const spec = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');

const shell = [...sw.matchAll(/'(\.\/[^']*)'/g)].map((m) => m[1]);
const modules = readdirSync(join(ROOT, 'src')).filter((f) => f.endsWith('.js'));
const dataFiles = readdirSync(ROOT).filter((f) => f === 'data.js' || (f.startsWith('data-') && f.endsWith('.js')));

test('every shipped module is in the app shell', () => {
  for (const f of modules) assert.ok(shell.includes(`./src/${f}`), `src/${f} is not cached offline`);
  for (const f of dataFiles) assert.ok(shell.includes(`./${f}`), `${f} is not cached offline`);
});

test('the app shell names nothing that is not shipped', () => {
  for (const entry of shell) {
    if (entry === './') continue;
    assert.ok(existsSync(join(ROOT, entry)), `${entry} is cached but does not exist`);
  }
});

test('every shipped module has a row in the module map', () => {
  for (const f of modules) assert.match(spec, new RegExp('`' + f.replace('.', '\\.') + '`'), `${f} is missing from CLAUDE.md §5.1`);
});

test('no live SVG filter is used as a background', () => {
  // A `feTurbulence` inside a tiled background is re-run by the browser over the whole page on
  // every paint. It looked right and made a three-screen route unpaintable: the screenshot of
  // #/build/ingredients never returned. Noise is baked into a tile instead.
  const css = readFileSync(join(ROOT, 'styles.css'), 'utf8');
  for (const match of css.matchAll(/url\(["']?data:image\/svg\+xml,([^"')]*)/g)) {
    const svg = decodeURIComponent(match[1]);
    assert.doesNotMatch(svg, /<filter|feTurbulence|feDisplacementMap|feGaussianBlur/,
      'an SVG filter in a background repaints the whole page');
  }
});
