// Accessibility sweep (CLAUDE.md §4). Structural checks a machine can make honestly: labels,
// heading order, landmarks, live regions, focus visibility, and colour that is never the only
// channel. Contrast and screen-reader flow still need a human.
//
// Run: node tests/a11y.mjs

import assert from 'node:assert/strict';
import { serve, launch, seed, ROUTES } from './harness.mjs';

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await launch();

const findings = [];
const check = (name, fn) => { try { fn(); } catch (err) { findings.push(`${name}: ${err.message}`); } };

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 740 } });
  await seed(context, 'mid-story');
  const page = await context.newPage();

  for (const route of ROUTES) {
    await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#screen', { timeout: 5000 });

    // Most of this app's content lives inside collapsed <details> — the explain notes, every rules
    // entry, every worked example. A sweep that only sees what is open never checks any of it.
    await page.evaluate(() => {
      for (const d of document.querySelectorAll('details')) d.open = true;
    });

    const report = await page.evaluate(() => {
      const visible = (n) => n.offsetParent !== null;
      const unlabelled = [];
      for (const node of document.querySelectorAll('input, textarea, select')) {
        if (!visible(node)) continue;
        const labelled = node.getAttribute('aria-label')
          || node.getAttribute('aria-labelledby')
          || (node.id && document.querySelector(`label[for="${node.id}"]`))
          || node.closest('label');
        if (!labelled) unlabelled.push(node.id || node.type || node.tagName);
      }

      const namelessButtons = [...document.querySelectorAll('button, a')]
        .filter(visible)
        .filter((n) => !(n.textContent || '').trim() && !n.getAttribute('aria-label'))
        .map((n) => n.outerHTML.slice(0, 60));

      const headings = [...document.querySelectorAll('h1, h2, h3, h4')].filter(visible).map((h) => Number(h.tagName[1]));
      const jumps = headings.filter((level, i) => i > 0 && level - headings[i - 1] > 1);

      const imagesWithoutAlt = [...document.querySelectorAll('img')].filter((n) => !n.hasAttribute('alt')).length;

      return {
        unlabelled,
        namelessButtons,
        headingJumps: jumps.length,
        h1s: document.querySelectorAll('h1').length,
        imagesWithoutAlt,
        hasMain: Boolean(document.querySelector('main')),
        hasNav: document.querySelectorAll('nav[aria-label]').length,
        currentMarked: document.querySelectorAll('[aria-current]').length,
        lang: document.documentElement.lang,
      };
    });

    check(`${route} labels`, () => assert.deepEqual(report.unlabelled, [], `unlabelled fields: ${report.unlabelled.join(', ')}`));
    check(`${route} button names`, () => assert.deepEqual(report.namelessButtons, [], 'a control with no accessible name'));
    check(`${route} heading order`, () => assert.equal(report.headingJumps, 0, 'a heading level is skipped'));
    check(`${route} one h1`, () => assert.equal(report.h1s, 1));
    check(`${route} image alt`, () => assert.equal(report.imagesWithoutAlt, 0));
    check(`${route} landmarks`, () => {
      assert.ok(report.hasMain, 'no <main>');
      assert.ok(report.hasNav >= 1, 'no labelled <nav>');
    });
    check(`${route} current is marked`, () => assert.ok(report.currentMarked >= 1, 'nothing carries aria-current'));
    check(`${route} lang`, () => assert.equal(report.lang, 'en'));
  }

  // Live regions: the die result and the spark output must announce themselves.
  await page.goto(base + '#/build/idea');
  const live = await page.evaluate(() => document.querySelectorAll('#screen [aria-live]').length);
  check('idea: results announce themselves', () => assert.ok(live >= 1, 'no aria-live region on the idea screen'));

  // Focus must be visible, and the skip link must be reachable.
  await page.goto(base + '#/stories');
  const focusVisible = await page.evaluate(() => {
    const link = document.querySelector('.skip-link');
    link.focus();
    const rect = link.getBoundingClientRect();
    return { onScreen: rect.left >= 0 && rect.top >= 0, focused: document.activeElement === link };
  });
  check('skip link', () => {
    assert.ok(focusVisible.focused, 'the skip link cannot take focus');
    assert.ok(focusVisible.onScreen, 'the skip link stays off-screen when focused');
  });

  // Zoom is locked, so the text-size control that pays for it must actually change type size.
  await page.goto(base + '#/settings');
  const scaled = await page.evaluate(async () => {
    const before = getComputedStyle(document.body).fontSize;
    const range = document.querySelector('input[type="range"]');
    range.value = '1.5';
    range.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 50));
    return { before, after: getComputedStyle(document.body).fontSize };
  });
  check('text size control', () => assert.notEqual(scaled.before, scaled.after, 'the text-size control does nothing'));

  await context.close();
} finally {
  await browser.close();
  server.close();
}

console.log(`accessibility sweep — ${ROUTES.length} routes`);
if (!findings.length) {
  console.log('nothing to report');
  process.exit(0);
}
console.log(`${findings.length} finding(s):`);
for (const f of findings) console.log('  ' + f);
process.exit(1);
