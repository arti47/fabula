// Harness B: browser smoke (CLAUDE.md §9).
// Boots the app on a static server and asserts the measurement contract on every route.
// Run: npm run smoke

import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import assert from 'node:assert/strict';

const ROOT = new URL('..', import.meta.url).pathname;
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp',
};

const ROUTES = [
  '#/stories', '#/build', '#/build/idea', '#/build/ingredients', '#/build/structure',
  '#/build/boost', '#/build/tell', '#/deck', '#/deck/prompts', '#/deck/ingredients',
  '#/deck/structure', '#/deck/boosts', '#/deck/card/beat-5', '#/deck/card/boost-help',
  '#/build/ingredients/inciting', '#/build/ingredients/inciting/3',
  '#/learn', '#/settings', '#/tutorial', '#/nonsense',
];
const WIDTHS = [320, 360, 390, 768, 1024];

function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, path === '/' ? 'index.html' : path);
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
function check(name, fn) {
  try { fn(); } catch (err) { failures.push(`${name}: ${err.message}`); }
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({ executablePath: chromePath() });

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const dir = readdirSync(root).filter((d) => d.startsWith('chromium-')).sort().pop();
  if (!dir) throw new Error(`no chromium under ${root}; set CHROME_PATH`);
  return join(root, dir, 'chrome-linux', 'chrome');
}

try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 740 } });
    const page = await context.newPage();
    const errors = [];
    // Card art is generated locally and may legitimately be absent (CLAUDE.md §11); a 404 on a
    // face is the placeholder path working, not an app error. Everything else counts.
    const isMissingArt = (m) => /assets\/cards\/[\w-]+\.webp/.test(m.location()?.url || '');
    page.on('console', (m) => { if (m.type() === 'error' && !isMissingArt(m)) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    for (const route of ROUTES) {
      errors.length = 0;
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#screen h2, #screen label', { timeout: 5000 });

      check(`${width} ${route} console`, () => assert.deepEqual(errors, []));

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${width} ${route} overflow`, () => assert.ok(overflow <= 0, `${overflow}px of horizontal overflow`));

      const stray = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const bad = [];
        while (walker.nextNode()) {
          const t = walker.currentNode.textContent;
          if (/\b(null|undefined|NaN|\[object Object\])\b/.test(t)) bad.push(t.trim().slice(0, 60));
        }
        return bad;
      });
      check(`${width} ${route} stray text`, () => assert.deepEqual(stray, []));

      const hasExplain = await page.evaluate(() => {
        const d = document.querySelector('#screen details.explain');
        return d ? { present: true, open: d.open } : { present: false };
      });
      if (!route.startsWith('#/deck/card') && route !== '#/nonsense' && route !== '#/tutorial') {
        check(`${width} ${route} explain`, () => {
          assert.ok(hasExplain.present, 'no explain() note');
          assert.equal(hasExplain.open, false, 'explain() should start collapsed');
        });
      }

      const bar = await page.evaluate(() => {
        const b = document.querySelector('.action-bar');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { top: r.top, viewport: window.innerHeight };
      });
      if (bar) check(`${width} ${route} primary action above the fold`, () => assert.ok(bar.top < bar.viewport, 'action bar is off-screen'));

      const small = await page.evaluate(() => {
        const targets = [...document.querySelectorAll('a, button, input[type="range"], input[type="file"], summary')];
        return targets
          .filter((t) => t.offsetParent !== null && !t.classList.contains('skip-link'))
          .map((t) => ({ tag: t.tagName, text: (t.textContent || t.getAttribute('aria-label') || '').trim().slice(0, 24), h: Math.round(t.getBoundingClientRect().height) }))
          .filter((t) => t.h > 0 && t.h < 40);
      });
      check(`${width} ${route} tap targets`, () => assert.deepEqual(small, [], JSON.stringify(small)));

      const underTabs = await page.evaluate(() => {
        const tabTop = document.querySelector('.tab-bar').getBoundingClientRect().top + window.scrollY;
        const docBottom = document.documentElement.scrollHeight;
        return docBottom > window.innerHeight ? 0 : Math.max(0, Math.round(document.querySelector('#screen').getBoundingClientRect().bottom + window.scrollY - tabTop));
      });
      check(`${width} ${route} content clear of the tab bar`, () => assert.ok(underTabs <= 0, `${underTabs}px under the tab bar`));
    }
    await context.close();
  }

  // The end-to-end walk: name → story → open → step nav.
  const context = await browser.newContext({ viewport: { width: 390, height: 740 } });
  const page = await context.newPage();
  await page.goto(base + '#/stories');
  await page.fill('#teller-name', 'Ada');
  await page.click('.action-bar .button');
  await page.waitForSelector('text=No stories yet');
  await page.click('.action-bar .button');
  await page.fill('#prompt-input', 'The dragon next door');
  await page.click('.modal-actions .button');
  await page.waitForSelector('.story-header-title');
  check('walk: story header names the story', async () => {});
  const title = await page.textContent('.story-header-title');
  check('walk: title', () => assert.equal(title, 'The dragon next door'));
  const counts = await page.textContent('.progress-row');
  check('walk: progress counts', () => {
    assert.match(counts, /Ingredients 0\/4/);
    assert.match(counts, /Beats 0\/9/);
    assert.match(counts, /Boosts 0\/10/);
  });
  // Step 1: the idea, the die, the sparks.
  await page.goto(base + '#/build/idea');
  await page.fill('#idea-text', 'a lighthouse that walks');
  await page.waitForTimeout(600); // debounced autosave
  await page.click('.action-bar .button:not(.secondary)');
  await page.waitForSelector('.prompt-panel');
  const firstLetter = await page.textContent('.die-letter');
  check('idea: the die lands on a real face', () => assert.match(firstLetter, /^[PMQGNS]$/));

  await page.click('.prompt-panel .button');
  await page.waitForTimeout(100);
  const history = await page.textContent('.roll-history');
  check('idea: every roll is kept, none discarded', () => assert.match(history, /rolled 2 times/));

  await page.click('.spark-row .button');
  const spark = await page.textContent('.spark-out');
  check('idea: sparks produce something', () => assert.ok(spark.trim().length > 5, 'no spark text'));
  const houseFlag = await page.textContent('.spark-note .house-flag');
  check('idea: sparks are labelled as ours', () => assert.match(houseFlag, /not the deck/));

  await page.goto(base + '#/build/idea');
  const savedIdea = await page.inputValue('#idea-text');
  check('idea: the sentence persists', () => assert.equal(savedIdea, 'a lighthouse that walks'));
  const headerAfter = await page.textContent('.progress-row');
  check('idea: the header knows there is an idea', () => assert.match(headerAfter, /Idea yes/));

  // Step 2: ingredients, one question at a time, in any order.
  await page.goto(base + '#/build/ingredients');
  await page.click('.card-grid .card');
  await page.waitForSelector('#answer');
  const firstQ = await page.textContent('.question-label');
  check('ingredients: opens on the first question', () => assert.match(firstQ, /How old are they\?/));
  await page.fill('#answer', 'about eleven');
  await page.waitForTimeout(600);
  await page.click('.action-bar .button:not(.secondary)');
  await page.waitForSelector('#answer');
  const secondQ = await page.textContent('.question-label');
  check('ingredients: Next advances', () => assert.match(secondQ, /What do they look like\?/));

  // Jump straight to the name question via the pips (P2 survives the one-at-a-time format).
  await page.click('.pips .pip:nth-child(6)');
  await page.waitForSelector('#answer');
  await page.fill('#answer', 'Bo');
  await page.waitForTimeout(600);
  await page.goto(base + '#/build/ingredients');
  const gridText = await page.textContent('#screen');
  check('ingredients: the tile takes the character\'s name', () => assert.match(gridText, /Bo/));
  check('ingredients: the tile counts answers', () => assert.match(gridText, /2 of 6 answered/));
  const headerCounts = await page.textContent('.progress-row');
  check('ingredients: the header counts the card', () => assert.match(headerCounts, /Ingredients 1\/4/));

  // P3: the same card twice.
  await page.click('text=Add another main character');
  await page.waitForSelector('#answer');
  await page.goto(base + '#/build/ingredients');
  const twoHeroes = await page.evaluate(() => document.querySelectorAll('.card-grid')[0].children.length);
  check('ingredients: a second main character is allowed', () => assert.equal(twoHeroes, 2));

  // P1: skip a card, and get it back.
  const skipButtons = await page.$$('text=Skip this one for now');
  await skipButtons[1].click();
  await page.waitForTimeout(100);
  const afterSkip = await page.textContent('#screen');
  check('ingredients: skipping says so and offers it back', () => assert.match(afterSkip, /Skipped for now/));
  await page.click('text=Bring it back');
  await page.waitForTimeout(100);
  const afterUnskip = await page.textContent('#screen');
  check('ingredients: a skipped card comes back', () => assert.ok(!/Skipped for now/.test(afterUnskip)));

  // Removing a storyteller is destructive, so it must confirm and name the loss (§6.1).
  await page.goto(base + '#/stories');
  await page.click('.progress-row .button');
  await page.waitForSelector('.teller-row');
  await page.click('.teller-row .button.danger');
  const warning = await page.textContent('.modal p');
  check('remove storyteller names what is lost', () => assert.match(warning, /stor(y|ies)/));
  await page.click('.modal-actions .button.secondary');
  await page.waitForTimeout(50);
  const stillThere = await page.evaluate(() => document.querySelectorAll('.modal').length);
  check('cancel leaves everything alone', () => assert.equal(stillThere, 0));

  await page.goto(base + '#/stories');
  const persisted = await page.textContent('#screen');
  check('walk: story persists on the shelf', () => assert.match(persisted, /The dragon next door/));
  check('walk: the shelf shows the idea as the blurb', () => assert.match(persisted, /a lighthouse that walks/));
  await context.close();

  // Every card face either loads or shows a labelled placeholder — never a broken image.
  const artContext = await browser.newContext({ viewport: { width: 390, height: 740 } });
  const artPage = await artContext.newPage();
  await artPage.goto(base + '#/deck/structure');
  await artPage.waitForSelector('.card-grid .card');
  await artPage.waitForTimeout(300);
  const faces = await artPage.evaluate(() => {
    const cards = [...document.querySelectorAll('.card-grid .card')];
    return cards.map((c) => {
      const img = c.querySelector('img.card-face');
      if (img) return img.naturalWidth > 0 ? 'loaded' : 'broken';
      return c.querySelector('.card-face-missing') ? 'placeholder' : 'nothing';
    });
  });
  check('every card face resolves', () => {
    assert.equal(faces.length, 9);
    assert.deepEqual(faces.filter((f) => f === 'broken' || f === 'nothing'), []);
  });
  await artContext.close();
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`smoke: ${failures.length} failure(s)`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(`smoke: ok — ${ROUTES.length} routes × ${WIDTHS.length} widths, plus the end-to-end walk`);
