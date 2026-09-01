// Harness C — the interaction audit (CLAUDE.md §9).
//
// Visits every route, clicks every visible control in isolation with storage reset between clicks,
// and flags three things: a JS error, a control that cannot be clicked, and a control that changes
// nothing at all — no re-render, no modal, no toast, no storage write, no navigation.
//
// The no-op check is the one that earns its keep: it catches a button wired to a handler that
// returns early. Change is polled for, never waited on for a fixed interval (defect D-15).
//
// Run: npm run audit            (mid-story fixture)
//      npm run audit -- stress

import { serve, launch, seed, isMissingArt, ROUTES } from './harness.mjs';

const [, , fixtureName = 'mid-story'] = process.argv;

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await launch();

const findings = [];
let clicked = 0;

/** What the page looks like right now, in one comparable string. */
const SIGNATURE = () => ({
  hash: location.hash,
  printed: window.__printed || 0,
  scroll: Math.round(window.scrollY / 20), // scrolling somewhere is a real change

  screen: document.querySelector('#screen')?.textContent?.length || 0,
  screenText: (document.querySelector('#screen')?.textContent || '').slice(0, 400),
  modals: document.querySelectorAll('.modal').length,
  toasts: document.querySelectorAll('.toast').length,
  storage: Object.keys(localStorage).map((k) => `${k}:${(localStorage.getItem(k) || '').length}`).join('|'),
  details: [...document.querySelectorAll('details')].map((d) => (d.open ? 1 : 0)).join(''),
});

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 740 } });
  await seed(context, fixtureName);
  // Printing has no observable effect in a headless browser, so count the call instead of
  // excusing the control.
  await context.addInitScript(() => {
    window.__printed = 0;
    window.print = () => { window.__printed++; };
  });
  const page = await context.newPage();

  for (const route of ROUTES) {
    await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#screen', { timeout: 5000 });

    const count = await page.evaluate(() => document.querySelectorAll(
      '#screen a, #screen button, #screen summary, .action-bar a, .action-bar button',
    ).length);

    for (let i = 0; i < count; i++) {
      // Reset between clicks so every control is judged in isolation.
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#screen', { timeout: 5000 });

      const errors = [];
      const onConsole = (m) => { if (m.type() === 'error' && !isMissingArt(m)) errors.push(m.text()); };
      const onError = (e) => errors.push(String(e));
      page.on('console', onConsole);
      page.on('pageerror', onError);

      const target = await page.evaluate((index) => {
        const controls = [...document.querySelectorAll('#screen a, #screen button, #screen summary, .action-bar a, .action-bar button')];
        const node = controls[index];
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          label: (node.textContent || node.getAttribute('aria-label') || node.tagName).trim().slice(0, 40),
          visible: node.offsetParent !== null && rect.width > 0 && rect.height > 0,
          // A nav pill for the screen you are already on is meant to do nothing.
          isCurrent: node.getAttribute('aria-current') !== null,
        };
      }, i);

      if (!target || target.isCurrent) { page.off('console', onConsole); page.off('pageerror', onError); continue; }
      if (!target.visible) {
        findings.push(`${route} · "${target.label}" is in the DOM but cannot be clicked`);
        page.off('console', onConsole);
        page.off('pageerror', onError);
        continue;
      }

      const before = await page.evaluate(SIGNATURE);
      clicked++;

      try {
        await page.evaluate((index) => {
          const controls = [...document.querySelectorAll('#screen a, #screen button, #screen summary, .action-bar a, .action-bar button')];
          controls[index].click();
        }, i);
      } catch (err) {
        findings.push(`${route} · "${target.label}" threw when clicked: ${String(err).slice(0, 90)}`);
        page.off('console', onConsole);
        page.off('pageerror', onError);
        continue;
      }

      // Poll for any change at all, up to a second.
      let after = before;
      let changed = false;
      for (let tick = 0; tick < 20 && !changed; tick++) {
        await page.waitForTimeout(50);
        after = await page.evaluate(SIGNATURE);
        changed = JSON.stringify(after) !== JSON.stringify(before);
      }

      if (errors.length) findings.push(`${route} · "${target.label}" logged an error: ${errors[0].slice(0, 90)}`);
      if (!changed) findings.push(`${route} · "${target.label}" changes nothing`);

      page.off('console', onConsole);
      page.off('pageerror', onError);
    }
  }
  await context.close();
} finally {
  await browser.close();
  server.close();
}

console.log(`interaction audit — fixture: ${fixtureName}, ${clicked} controls clicked in isolation`);
if (!findings.length) {
  console.log('nothing to report');
  process.exit(0);
}
console.log(`${findings.length} finding(s):`);
for (const f of findings) console.log('  ' + f);
process.exit(1);
