// The PWA update path (CLAUDE.md §4). The template is explicit that this is the one behaviour you
// cannot verify by looking at the running app, and the reference build never tested it.
//
// It asserts three things a kid actually depends on:
//   1. the service worker installs and takes control
//   2. the app still opens with the network gone
//   3. deploying a change makes the running app offer "a new version is ready"
//
// Run: node tests/update-path.mjs

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { serve, launch } from './harness.mjs';

const SW = new URL('../service-worker.js', import.meta.url).pathname;
const original = readFileSync(SW, 'utf8');

const failures = [];
const check = (name, fn) => { try { fn(); } catch (err) { failures.push(`${name}: ${err.message}`); } };

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await launch();

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 740 } });
  const page = await context.newPage();

  // 1. It installs and takes control.
  await page.goto(base + '#/stories', { waitUntil: 'domcontentloaded' });
  const controlled = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    for (let i = 0; i < 40 && !navigator.serviceWorker.controller; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return { scope: reg.scope, controlled: Boolean(navigator.serviceWorker.controller) };
  });
  check('the service worker installs and takes control', () => {
    assert.ok(controlled.controlled, 'nothing is controlling the page');
    assert.match(controlled.scope, /\/$/);
  });

  // 2. The app opens with the network gone — the state it is actually used in.
  await context.setOffline(true);
  await page.goto(base + '#/deck', { waitUntil: 'domcontentloaded' });
  const offline = await page.evaluate(() => ({
    heading: document.querySelector('#screen h2')?.textContent || '',
    cards: document.querySelectorAll('.card-grid .card').length,
  }));
  check('the app opens offline', () => {
    assert.ok(offline.heading.length > 0, 'no screen rendered offline');
    assert.ok(offline.cards > 0, 'the deck rendered no cards offline');
  });
  await context.setOffline(false);

  // 3. A deploy is offered to the running app.
  writeFileSync(SW, original.replace(/story-machine-v\d+/, 'story-machine-v999'));
  const toast = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg.update();
    for (let i = 0; i < 60; i++) {
      const node = [...document.querySelectorAll('.toast')].find((t) => /new version/i.test(t.textContent));
      if (node) return node.textContent;
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  });
  check('a new version offers itself to the running app', () => {
    assert.ok(toast, 'no "update available" toast appeared after a deploy');
    assert.match(toast, /reload/i, 'the toast should say what to do about it');
  });

  await context.close();
} finally {
  writeFileSync(SW, original);
  await browser.close();
  server.close();
}

console.log('update path — service worker install, offline boot, update toast');
if (!failures.length) {
  console.log('nothing to report');
  process.exit(0);
}
console.log(`${failures.length} finding(s):`);
for (const f of failures) console.log('  ' + f);
process.exit(1);
