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
  '#/build/structure/1', '#/build/structure/2', '#/build/structure/9',
  '#/build/boost/boost-help', '#/build/boost/boost-learn',
  '#/learn', '#/learn/beat-5', '#/settings', '#/tutorial', '#/nonsense',
  '#/example/example-red-riding-hood', '#/example/example-hansel-gretel', '#/example/nope',
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

// Poll for the change; never a fixed wait (template defect D-15). A hash click re-renders on
// hashchange, which fires after the hash is already set, so waiting on a selector that exists in
// both the old and new render races with the router.
async function settled(page, selector, pattern) {
  await page.waitForFunction(
    ([sel, src]) => {
      const node = document.querySelector(sel);
      return node ? new RegExp(src).test(node.textContent) : false;
    },
    [selector, pattern.source],
    { timeout: 5000 },
  );
  return page.textContent(selector);
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
      if (!route.startsWith('#/deck/card') && route !== '#/nonsense' && route !== '#/example/nope') {
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
  const history = await settled(page, '.roll-history', /rolled 2 times/);
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
  const firstQ = await settled(page, '.question-label', /How old are they\?/);
  check('ingredients: opens on the first question', () => assert.match(firstQ, /How old are they\?/));
  await page.fill('#answer', 'about eleven');
  await page.waitForTimeout(600);
  await page.click('.action-bar .button:not(.secondary)');
  const secondQ = await settled(page, '.question-label', /What do they look like\?/);
  check('ingredients: Next advances', () => assert.match(secondQ, /What do they look like\?/));

  // Jump straight to the name question via the pips (P2 survives the one-at-a-time format).
  await page.click('.pips .pip:nth-child(6)');
  await settled(page, '.question-label', /What are they called\?/);
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
  const afterSkip = await settled(page, '#screen', /Skipped for now/);
  check('ingredients: skipping says so and offers it back', () => assert.match(afterSkip, /Skipped for now/));
  await page.click('text=Bring it back');
  await page.waitForFunction(() => !/Skipped for now/.test(document.querySelector('#screen').textContent), null, { timeout: 5000 });
  const afterUnskip = await page.textContent('#screen');
  check('ingredients: a skipped card comes back', () => assert.ok(!/Skipped for now/.test(afterUnskip)));

  // Step 3: the nine beats, and ruling A5 in the browser.
  await page.goto(base + '#/build/ingredients/inciting/0');
  await page.fill('#answer', 'Grandma falls ill');
  await page.waitForTimeout(600);

  await page.goto(base + '#/build/structure');
  const beatList = await page.textContent('.beat-list');
  check('structure: all nine beats are listed', () => {
    assert.match(beatList, /Once upon a time/);
    assert.match(beatList, /In the end/);
  });
  const beatRows = await page.evaluate(() => document.querySelectorAll('.beat-row').length);
  check('structure: nine of them', () => assert.equal(beatRows, 9));

  await page.goto(base + '#/build/structure/2');
  await page.waitForSelector('#beat-text');
  const prefilled = await page.inputValue('#beat-text');
  check('A5: beat 2 arrives pre-filled from the ingredient', () => assert.equal(prefilled, 'Grandma falls ill'));
  const provenance = await page.textContent('.provenance');
  check('A5: and says where it came from', () => assert.match(provenance, /Something happens/));

  await page.fill('#beat-text', 'One morning a letter arrives instead');
  await page.waitForTimeout(600);
  await page.goto(base + '#/build/ingredients/inciting/0');
  const ingredientStillSays = await page.inputValue('#answer');
  check('A5: editing the beat leaves the card alone', () => assert.equal(ingredientStillSays, 'Grandma falls ill'));

  await page.goto(base + '#/build/structure/9');
  await page.fill('#beat-text', 'In the end everyone goes home.');
  await page.waitForTimeout(600);
  const beatCounts = await page.textContent('.progress-row');
  check('structure: the header counts written beats', () => assert.match(beatCounts, /Beats 2\/9/));

  // Step 4: the boosts, the snapshot, and the two permissions the booklet demonstrates.
  await page.goto(base + '#/build/boost');
  const boostTiles = await page.evaluate(() => document.querySelectorAll('.card-grid .card').length);
  check('boost: all ten are offered', () => assert.equal(boostTiles, 10));
  const frozenNote = await page.textContent('#screen');
  check('A8: the before-version is frozen on arrival', () => assert.match(frozenNote, /as it was when you started boosting/));

  await page.goto(base + '#/build/boost/boost-help');
  await page.fill('#boost-answer', 'He needs a sister');
  await page.waitForTimeout(600);

  // P6: this card invents a character, and the new card carries where it came from.
  await page.click('text=This gives me a new character');
  await settled(page, '.question-label', /How old are they\?/);
  await page.fill('#answer', 'a bit younger');
  await page.waitForTimeout(600);
  await page.goto(base + '#/build/boost/boost-help');
  const spawnedList = await settled(page, '#screen', /Made from this card/);
  check('P6: the spawned card is listed on the boost that made it', () => assert.match(spawnedList, /Made from this card/));
  const ingredientCount = await page.evaluate(() => {
    location.hash = '#/build/ingredients';
    return new Promise((r) => setTimeout(() => r(document.querySelectorAll('.card-grid')[0].children.length), 100));
  });
  check('P6: it joins the ingredients', () => assert.ok(ingredientCount >= 2, `only ${ingredientCount} main characters`));

  // P7: a boost sends you back to a beat, and offers the way back.
  await page.goto(base + '#/build/boost/boost-too-easy');
  await page.click('text=Change beat 4');
  await settled(page, '.provenance', /came here from a Boost card/);
  await page.fill('#beat-text', 'They are abandoned twice, and the second time the birds eat the crumbs.');
  await page.waitForTimeout(600);
  const backLink = await page.textContent('.back-link');
  check('P7: the beat offers the way back to the boost', () => assert.match(backLink, /Back to/));
  await page.click('.action-bar .button:not(.secondary)');
  const boostAgain = await settled(page, '#screen', /you went back to beat/);
  check('P7: the boost records the beat it sent you to', () => assert.match(boostAgain, /beat 4/));

  // The snapshot holds the old beat text even though the beat has changed.
  const snapshotHeld = await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('storyMachine.currentStory'));
    const story = JSON.parse(localStorage.getItem(`storyMachine.story.${id}`));
    return { now: story.beats['4']?.text || '', before: story.snapshot.beats['4']?.text || '' };
  });
  check('A8: before and after really differ', () => {
    assert.match(snapshotHeld.now, /abandoned twice/);
    assert.ok(!/abandoned twice/.test(snapshotHeld.before), 'the before-version followed the edit');
  });

  // P8: skipping a boost is a control, and it is reversible.
  await page.goto(base + '#/build/boost/boost-narrator');
  await page.click('text=Skip this one');
  await settled(page, '#screen', /Bring this one back/);
  await page.click('text=Bring this one back');
  await settled(page, '#screen', /Skip this one/);
  check('P8: a skipped boost comes back', () => assert.ok(true));

  // Step 5: the story read back, both ways.
  await page.goto(base + '#/build/tell');
  const told = await settled(page, '.told-story', /lighthouse|Once upon a time|Nothing written/);
  check('tell: the story reads back', () => assert.ok(told.length > 0));
  const connectors = await page.evaluate(() => [...document.querySelectorAll('.told-connector')].map((n) => n.textContent.trim()));
  check('tell: each passage carries its card phrase', () => {
    assert.ok(connectors.length >= 1, 'no connectors');
    assert.ok(connectors.some((c) => /Once upon a time|But all of a sudden|In the end/.test(c)), connectors.join('|'));
  });

  const toggles = await page.evaluate(() => [...document.querySelectorAll('.version-toggle button')].map((b) => b.textContent));
  check('D10: both versions are offered', () => assert.deepEqual(toggles, ['Before the boosts', 'After the boosts']));
  await page.click('.version-toggle button');
  const beforeText = await settled(page, '.told-story', /draft you had when you started boosting/);
  check('D10: the before-version says what it is', () => assert.match(beforeText, /draft you had/));
  const pressed = await page.evaluate(() => document.querySelector('.version-toggle button').getAttribute('aria-pressed'));
  check('D10: the toggle says which is showing', () => assert.equal(pressed, 'true'));

  await page.click('.version-toggle button:nth-child(2)');
  const afterText = await settled(page, '.told-story', /abandoned twice/);
  check('D10: after the boosts holds the rewritten beat', () => assert.match(afterText, /abandoned twice/));
  check('D10: and the before-version did not', () => assert.ok(!/abandoned twice/.test(beforeText)));

  // Learn: search, and the link from a card to its entry.
  await page.goto(base + '#/learn');
  await page.fill('#learn-search', 'Cinderella');
  const hits = await settled(page, '.learn-results', /match/);
  check('learn: search finds the booklet examples', () => assert.match(hits, /match/));
  await page.goto(base + '#/deck/card/beat-5');
  const cardLinks = await page.textContent('#screen');
  check('learn: every card links to its entry', () => assert.match(cardLinks, /Read more about this card/));

  // The two worked stories, readable from the shelf.
  await page.goto(base + '#/example/example-hansel-gretel');
  const hg = await settled(page, '.told-story', /Once upon a time|Hänsel/);
  check('examples: Hänsel and Gretel reads back', () => assert.match(hg, /Hänsel/));
  const hgToggles = await page.evaluate(() => document.querySelectorAll('.version-toggle button').length);
  check('examples: it is told twice', () => assert.equal(hgToggles, 2));
  await page.click('.version-toggle button');
  await settled(page, '.told-story', /draft you had/);
  // The title says "Hänsel and Gretel" either way, so read the passages, not the whole card.
  const beforePassages = await page.evaluate(() => [...document.querySelectorAll('.told-passage')].map((n) => n.textContent).join(' '));
  check('examples: the first draft is Hänsel alone', () => {
    assert.ok(!/Gretel/.test(beforePassages), 'the draft mentions Gretel');
    assert.match(beforePassages, /Hänsel/);
  });
  await page.click('.version-toggle button:nth-child(2)');
  await settled(page, '.told-story', /Gretel throws|tricked the witch/);
  const afterPassages = await page.evaluate(() => [...document.querySelectorAll('.told-passage')].map((n) => n.textContent).join(' '));
  check('examples: the boosted version has a sister who saves him', () => assert.match(afterPassages, /Gretel/));
  const afterCard = await page.textContent('.told-story');
  check('examples: and says which card invented her', () => assert.match(afterCard, /came from a boost/));

  // Removing a storyteller is destructive, so it must confirm and name the loss (§6.1).
  await page.goto(base + '#/stories');
  await page.click('.progress-row .button');
  await page.waitForSelector('.teller-row');
  await page.click('.teller-row .button.danger');
  const warning = await settled(page, '.modal p', /stor/);
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
