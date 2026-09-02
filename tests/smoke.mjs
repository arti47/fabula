// Harness B: browser smoke (CLAUDE.md §9).
// Boots the app on a static server and asserts the measurement contract on every route.
// Run: npm run smoke

import assert from 'node:assert/strict';
import { serve, launch, seed, isMissingArt, ROUTES as DEEP_ROUTES, WIDTHS } from './harness.mjs';

// The shared route list, plus the states only the walk creates and the error routes.
const ROUTES = [...DEEP_ROUTES, '#/build/structure/9', '#/deck/boosts', '#/deck/idea',
  '#/deck/card/idea', '#/nonsense', '#/example/nope'];

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
const browser = await launch();

try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 740 } });
    // The route sweep runs against a real mid-story state, not an empty app (§9 D).
    await seed(context, 'mid-story');
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' && !isMissingArt(m)) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    for (const route of ROUTES) {
      errors.length = 0;
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#screen h2, #screen label', { timeout: 5000 });

      check(`${width} ${route} console`, () => assert.deepEqual(errors, []));

      if (route === '#/build/idea') {
        // If the fixture did not load, every other measurement below is of an empty app.
        const seeded = await page.textContent('.story-header-title');
        check(`${width} fixture loaded`, () => assert.equal(seeded, 'The dragon next door'));
      }

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
      if (!route.startsWith('#/deck/card') && !route.startsWith('#/learn/') && route !== '#/nonsense' && route !== '#/example/nope') {
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

      // On a screen whose whole job is writing, the field is the primary action (§6.3.2) — it
      // must be reachable without scrolling, at every width.
      const fieldTop = await page.evaluate(() => {
        const field = document.querySelector('#screen textarea');
        return field ? { top: Math.round(field.getBoundingClientRect().top), viewport: window.innerHeight } : null;
      });
      if (fieldTop) {
        check(`${width} ${route} writing field above the fold`, () => {
          assert.ok(fieldTop.top < fieldTop.viewport, `the field starts ${fieldTop.top}px down a ${fieldTop.viewport}px screen`);
        });
      }

      // A tablet must add density, not stretch (§16.2): the card sits beside its question, and
      // the reading column stays a readable width instead of running the full viewport.
      if (width >= 768 && (route.includes('/build/structure/') || route.includes('/build/ingredients/') || route.includes('/build/boost/'))) {
        const layout = await page.evaluate(() => {
          const face = document.querySelector('.answer-face');
          const body = document.querySelector('.answer-body');
          if (!face || !body) return null;
          const f = face.getBoundingClientRect();
          const b = body.getBoundingClientRect();
          return { sideBySide: f.right <= b.left + 1, bodyWidth: b.width, viewport: window.innerWidth };
        });
        check(`${width} ${route} tablet adds density`, () => {
          assert.ok(layout, 'no answer layout on an answering screen');
          assert.ok(layout.sideBySide, 'the card is stacked above the question rather than beside it');
          assert.ok(layout.bodyWidth < layout.viewport * 0.8, 'the answer column just stretched to fill the width');
        });
      }

      // No dead ends (§6.3.6): every screen offers a way onward, the error screen included.
      const onward = await page.evaluate(() => {
        const here = location.hash;
        const links = [...document.querySelectorAll('#screen a[href^="#/"], .action-bar a[href^="#/"]')]
          .map((a) => a.getAttribute('href'))
          .filter((href) => href !== here);
        return new Set(links).size;
      });
      check(`${width} ${route} leads somewhere`, () => assert.ok(onward > 0, 'no onward route from this screen'));

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

  // Sparks: three at a time, tap one into the field, and the label saying whose they are.
  await page.goto(base + '#/build/ingredients/inciting/0');
  await page.waitForSelector('#answer');
  const sparkLabel = await page.textContent('.sparks .house-flag');
  check('sparks: labelled as ours, not the deck\'s', () => assert.match(sparkLabel, /not the deck/));
  const chipsBefore = await page.evaluate(() => document.querySelectorAll('.spark-chip').length);
  check('sparks: nothing is shown until asked for', () => assert.equal(chipsBefore, 0));

  await page.click('.sparks .button');
  await page.waitForSelector('.spark-chip');
  const chips = await page.evaluate(() => [...document.querySelectorAll('.spark-chip')].map((c) => c.textContent));
  check('sparks: three, and all different', () => {
    assert.equal(chips.length, 3);
    assert.equal(new Set(chips).size, 3);
  });
  // The chips are below the field, so rolling has to bring them into view — and clear of the
  // fixed action bar, or a kid taps the button and sees nothing happen.
  // Scrolling is animated, so poll for it to settle rather than measuring once (D-15).
  await page.waitForFunction(() => {
    const chips = [...document.querySelectorAll('.spark-chip')];
    if (!chips.length) return false;
    const bar = document.querySelector('.action-bar');
    const barTop = bar ? bar.getBoundingClientRect().top : window.innerHeight;
    return Math.max(...chips.map((c) => c.getBoundingClientRect().bottom)) <= barTop;
  }, null, { timeout: 3000 }).catch(() => {});
  const chipPlacement = await page.evaluate(() => {
    const bottoms = [...document.querySelectorAll('.spark-chip')].map((c) => c.getBoundingClientRect().bottom);
    const bar = document.querySelector('.action-bar');
    return { lowest: Math.max(...bottoms), barTop: bar ? bar.getBoundingClientRect().top : window.innerHeight };
  });
  check('sparks: the three land where they can be seen and tapped', () => {
    assert.ok(chipPlacement.lowest <= chipPlacement.barTop, 'a spark chip sits under the action bar');
  });

  const chipText = chips[0];
  await page.click('.spark-chip');
  await page.waitForTimeout(650); // the debounced autosave
  const afterPick = await page.inputValue('#answer');
  check('sparks: tapping one drops it in the field', () => assert.equal(afterPick, chipText));
  await page.goto(base + '#/build/ingredients/inciting/0');
  const persisted2 = await page.inputValue('#answer');
  check('sparks: what it dropped in is saved like anything else', () => assert.equal(persisted2, chipText));

  // A beat's sparks fill in the names the story has, rather than saying "the hero".
  await page.goto(base + '#/build/structure/5');
  await page.click('.sparks .button');
  await page.waitForSelector('.spark-chip');
  const beatChips = await page.evaluate(() => [...document.querySelectorAll('.spark-chip')].map((c) => c.textContent).join(' | '));
  check('sparks: no placeholder ever reaches the screen', () => assert.ok(!/[{}]/.test(beatChips), beatChips));

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

  // Adding a second character is a permission; removing it again has to exist, and confirm.
  await page.goto(base + '#/build/ingredients');
  const heroesBefore = await page.evaluate(() => document.querySelectorAll('.card-grid')[0].children.length);
  await page.click('text=Add another main character');
  await settled(page, '.question-label', /How old are they\?/);
  const removeShown = await page.evaluate(() => Boolean([...document.querySelectorAll('button')].find((b) => /^Remove /.test(b.textContent))));
  check('a second character can be removed again', () => assert.ok(removeShown, 'no way to undo adding one'));
  await page.click('#screen .button.danger');
  const removeWarning = await settled(page, '.modal p', /answer/);
  check('removing one names what goes with it', () => assert.match(removeWarning, /Every answer on this card goes/));
  await page.click('.modal-actions .button:not(.secondary)');
  await page.waitForTimeout(200);
  const heroesAfter = await page.evaluate(() => document.querySelectorAll('.card-grid')[0].children.length);
  check('and it actually goes', () => assert.equal(heroesAfter, heroesBefore));

  // A card there is only ever one of cannot be removed: the story would lose the thing that
  // starts it, and there is nothing to have a second of.
  await page.goto(base + '#/build/ingredients/inciting/0');
  await settled(page, '.question-label', /What happens at the beginning\?/);
  const eventRemovable = await page.evaluate(() => Boolean([...document.querySelectorAll('button')].find((b) => /^Remove /.test(b.textContent))));
  check('the one-off cards have no remove button', () => assert.equal(eventRemovable, false));

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

  // An adversarial state: emoji, unbroken 600-character words, quotes, angle brackets, right-to-
  // left text, whitespace-only answers. A kid holding a key down should not break a layout.
  const messyContext = await browser.newContext({ viewport: { width: 320, height: 740 } });
  await seed(messyContext, 'messy');
  const messyPage = await messyContext.newPage();
  const messyErrors = [];
  messyPage.on('pageerror', (e) => messyErrors.push(String(e)));
  messyPage.on('console', (m) => { if (m.type() === 'error' && !isMissingArt(m)) messyErrors.push(m.text()); });
  for (const route of DEEP_ROUTES.filter((r) => !r.includes('mid-hero-1'))) {
    await messyPage.goto(base + route, { waitUntil: 'domcontentloaded' });
    await messyPage.waitForSelector('#screen');
    const over = await messyPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`messy ${route} overflow`, () => assert.ok(over <= 0, `${over}px of horizontal overflow`));
    // No stray-text check here: this fixture types "null", "NaN" and "[object Object]" into its
    // answers on purpose, and rendering what the kid typed is correct. The mid-story sweep above
    // is what catches the app producing those itself.
  }
  check('messy: no errors anywhere', () => assert.deepEqual(messyErrors, []));
  await messyContext.close();

  // The app is deployed under a sub-path (github.io/<repo>/), so every relative URL in it — the
  // module imports, the card art, the manifest, the service worker's scope — has to survive that.
  const subServer = await serve({ prefix: '/fabula/' });
  const subBase = `http://127.0.0.1:${subServer.address().port}/fabula/`;
  const subContext = await browser.newContext({ viewport: { width: 390, height: 740 } });
  const subPage = await subContext.newPage();
  const subErrors = [];
  subPage.on('pageerror', (e) => subErrors.push(String(e)));
  subPage.on('console', (m) => { if (m.type() === 'error' && !isMissingArt(m)) subErrors.push(m.text()); });
  await subPage.goto(subBase, { waitUntil: 'domcontentloaded' });
  await subPage.waitForSelector('#screen');
  check('deployed under a sub-path: the app boots', () => assert.deepEqual(subErrors, []));
  await subPage.goto(`${subBase}#/deck/structure`);
  await subPage.waitForSelector('.card-grid .card');
  await subPage.waitForTimeout(600);
  const subFaces = await subPage.evaluate(() => [...document.querySelectorAll('.card-grid img.card-face')].map((i) => i.naturalWidth > 0));
  check('deployed under a sub-path: the card art resolves', () => {
    assert.ok(subFaces.length > 0, 'no card faces rendered');
    assert.deepEqual(subFaces.filter((ok) => !ok), [], 'a card face failed to load under the sub-path');
  });
  const swScope = await subPage.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope || 'none');
  check('deployed under a sub-path: the service worker scopes to it', () => assert.match(swScope, /\/fabula\/$/));
  await subContext.close();
  subServer.close();

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
