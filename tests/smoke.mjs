// Harness B: browser smoke (CLAUDE.md §9).
// Boots the app on a static server and asserts the measurement contract on every route.
// Run: npm run smoke

import assert from 'node:assert/strict';
import { serve, launch, seed, isMissingArt, ROUTES as DEEP_ROUTES, WIDTHS } from './harness.mjs';

// The shared route list, plus the states only the walk creates and the error routes.
const ROUTES = [...DEEP_ROUTES, '#/build/structure/9', '#/deck/boosts', '#/deck/idea',
  '#/deck/card/idea', '#/nonsense', '#/example/nope'];

const failures = [];
// Screens with no pinned action are legitimate — reference screens rather than working ones — but
// the exemption is printed rather than silent, so it stays a decision instead of becoming a hole.
const noBar = new Set();
function check(name, fn) {
  try { fn(); } catch (err) { failures.push(`${name}: ${err.message}`); }
}

// Poll for the change; never a fixed wait (template defect D-15). A hash click re-renders on
// hashchange, which fires after the hash is already set, so waiting on a selector that exists in
// both the old and new render races with the router.
async function settled(page, selector, pattern) {
  try {
    await page.waitForFunction(
      ([sel, src]) => {
        const node = document.querySelector(sel);
        return node ? new RegExp(src).test(node.textContent) : false;
      },
      [selector, pattern.source],
      { timeout: 5000 },
    );
  } catch {
    // A step that never arrives is one finding, not the end of the walk. Throwing here used to
    // abort the run and silently skip every check after it — the breakage hid its own blast radius.
    failures.push(`walk stalled: ${selector} never matched ${pattern} (at ${page.url().split('#')[1] || '/'})`);
    return '';
  }
  return page.textContent(selector);
}

/** Type, but a field that never arrives is one finding rather than the end of the walk. An
 *  unguarded `page.fill` threw and killed the run before a single recorded failure was printed —
 *  the same blast-radius bug cycle 9 fixed for clicks, still open for typing. */
async function type(page, selector, text) {
  try {
    await page.fill(selector, text, { timeout: 5000 });
    return true;
  } catch {
    failures.push(`walk stalled: could not type into ${selector} (at ${page.url().split('#')[1] || '/'})`);
    return false;
  }
}

/** Wait for something to exist, but its absence is one finding rather than the end of the walk. */
async function present(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    failures.push(`walk stalled: ${selector} never appeared (at ${page.url().split('#')[1] || '/'})`);
    return false;
  }
}

/** Read text, but a node that is not there is one finding rather than the end of the walk. */
async function read(page, selector) {
  try {
    return await page.textContent(selector, { timeout: 5000 });
  } catch {
    failures.push(`walk stalled: ${selector} had nothing to read (at ${page.url().split('#')[1] || '/'})`);
    return '';
  }
}

/** Click, but a control that will not click is one finding rather than the end of the walk. */
async function tap(page, selector) {
  try {
    await page.click(selector, { timeout: 5000 });
    return true;
  } catch {
    failures.push(`walk stalled: could not click ${selector} (at ${page.url().split('#')[1] || '/'})`);
    return false;
  }
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
      await present(page, '#screen h2, #screen label');

      check(`${width} ${route} console`, () => assert.deepEqual(errors, []));

      if (route === '#/build/idea') {
        // If the fixture did not load, every other measurement below is of an empty app.
        const seeded = await read(page, '.story-header-title');
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
      // The only screens without a note are the two error screens, which exist to say one thing.
      if (route !== '#/nonsense' && route !== '#/example/nope') {
        check(`${width} ${route} explain`, () => {
          assert.ok(hasExplain.present, 'no explain() note');
          assert.equal(hasExplain.open, false, 'explain() should start collapsed');
        });
      }

      const bar = await page.evaluate(() => {
        const b = document.querySelector('.action-bar');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { top: r.top, viewport: window.innerHeight, height: Math.round(r.height) };
      });
      if (bar) check(`${width} ${route} primary action above the fold`, () => assert.ok(bar.top < bar.viewport, 'action bar is off-screen'));
      else if (width === 390) noBar.add(route);
      // An unclamped context line wrapped to eight lines and grew the bar to 171px, crushing the
      // buttons it was meant to explain. Two rows of context plus a 44px button is the ceiling.
      if (bar) check(`${width} ${route} action bar stays one bar`, () => assert.ok(bar.height <= 96, `${bar.height}px tall`));

      // §6.2: the counts are meant to be visible from every in-story screen. A skin rule once set
      // `position: relative` on the header and quietly ended that, which nothing noticed.
      if (route.startsWith('#/build')) {
        const stuck = await page.evaluate(async () => {
          window.scrollTo(0, 400);
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const box = document.querySelector('.story-header')?.getBoundingClientRect();
          const header = document.querySelector('.app-header')?.getBoundingClientRect();
          window.scrollTo(0, 0);
          return box && header ? Math.round(box.top - header.bottom) : null;
        });
        check(`${width} ${route} the counts stay on screen`, () => {
          assert.ok(stuck !== null && Math.abs(stuck) <= 2, `story header sits ${stuck}px from the header after scrolling`);
        });
      }

      // The pill that says where you are is the one that must be on screen.
      const strayPill = await page.evaluate(() => {
        const nav = document.querySelector('.section-nav');
        const current = nav?.querySelector('[aria-current]');
        if (!nav || !current) return null;
        const n = nav.getBoundingClientRect();
        const p = current.getBoundingClientRect();
        return (p.left >= n.left - 1 && p.right <= n.right + 1) ? null : current.textContent.trim();
      });
      check(`${width} ${route} the current step is visible in the nav`, () => assert.equal(strayPill, null, `${strayPill} is scrolled out of sight`));

      // Chrome is what the screen costs before a word of the story appears (D22).
      const chrome = await page.evaluate(() => {
        const h = (sel) => { const n = document.querySelector(sel); return n && !n.hidden ? n.getBoundingClientRect().height : 0; };
        return Math.round(h('.app-header') + h('.story-header'));
      });
      // One band now (D31): a 44px header and the story header, and nothing else fixed anywhere.
      // The story header is taller than a bar because it carries the story's cover behind the
      // title — that is the look, not chrome creep. It was 210px with a tab bar; it is ~126 now,
      // and only at 320, where the four counts wrap, does it need the extra line's 30px.
      const chromeBudget = width <= 320 ? 160 : 140;
      check(`${width} ${route} fixed chrome stays out of the way`, () => assert.ok(chrome <= chromeBudget, `${chrome}px of chrome`));

      // The nav pill and a heading two centimetres below it saying the same thing is one of them
      // wasted. The heading stays in the outline; it stops being drawn.
      const saidTwice = await page.evaluate(() => {
        const pill = document.querySelector('.section-nav [aria-current]');
        if (!pill) return null;
        const label = pill.textContent.trim();
        // `.visually-hidden` is absolutely positioned and clipped, so it still has an
        // offsetParent — measure the box instead of asking the layout tree.
        return [...document.querySelectorAll('#screen h2')]
          .filter((h) => {
            const box = h.getBoundingClientRect();
            return box.width > 2 && box.height > 2 && h.textContent.trim() === label;
          })
          .length ? label : null;
      });
      check(`${width} ${route} the step is not named twice`, () => assert.equal(saidTwice, null, `"${saidTwice}" is on screen twice`));

      const small = await page.evaluate(() => {
        const targets = [...document.querySelectorAll('a, button, input[type="range"], input[type="file"], summary')];
        return targets
          .filter((t) => t.offsetParent !== null && !t.classList.contains('skip-link'))
          .map((t) => ({ tag: t.tagName, text: (t.textContent || t.getAttribute('aria-label') || '').trim().slice(0, 24), h: Math.round(t.getBoundingClientRect().height) }))
          .filter((t) => t.h > 0 && t.h < 40);
      });
      check(`${width} ${route} tap targets`, () => assert.deepEqual(small, [], JSON.stringify(small)));

      // Half the buttons are anchors. Unstyled they come out underlined, inline and a different
      // height from the <button> beside them, which is what "looks broken" looks like.
      const linkish = await page.evaluate(() => [...document.querySelectorAll('a.button')]
        .filter((a) => a.offsetParent !== null)
        .filter((a) => getComputedStyle(a).textDecorationLine !== 'none')
        .map((a) => a.textContent.trim().slice(0, 24)));
      check(`${width} ${route} buttons are not underlined links`, () => assert.deepEqual(linkish, [], JSON.stringify(linkish)));

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

      // D29: the field is *on* the card, not under it. The first attempt used a negative
      // `margin-top` in percent, which resolves against width — the overlap never tracked the
      // card and the panel sat below it on six routes.
      if (width < 768 && route.match(/\/build\/(structure|ingredients|boost)\/.+/)) {
        const stage = await page.evaluate(() => {
          const card = document.querySelector('.stage-card');
          const panel = document.querySelector('.stage-panel');
          if (!card || !panel) return null;
          return { overlap: Math.round(card.getBoundingClientRect().bottom - panel.getBoundingClientRect().top) };
        });
        if (stage) check(`${width} ${route} the question sits on the card`, () => assert.ok(stage.overlap > 0, `panel starts ${-stage.overlap}px below the card`));
      }

      // A tablet must add density, not stretch (§16.2): the card sits beside its question, and
      // the reading column stays a readable width instead of running the full viewport.
      if (width >= 768 && (route.includes('/build/structure/') || route.includes('/build/ingredients/') || route.includes('/build/boost/'))) {
        const layout = await page.evaluate(() => {
          // Either shape counts: the Idea screen still uses the two-column `answerLayout`, the
          // question screens use the stage, which becomes two columns from 768 (D29).
          const face = document.querySelector('.answer-face, .stage-card');
          const body = document.querySelector('.answer-body, .stage-panel');
          if (!face || !body) return null;
          const f = face.getBoundingClientRect();
          const b = body.getBoundingClientRect();
          return { sideBySide: f.right <= b.left + 1, bodyWidth: b.width, viewport: window.innerWidth };
        });
        check(`${width} ${route} tablet adds density`, () => {
          assert.ok(layout, 'no answering layout on an answering screen');
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

    }
    await context.close();
  }

  // The end-to-end walk: name → story → open → step nav.
  const context = await browser.newContext({ viewport: { width: 390, height: 740 } });
  const page = await context.newPage();
  await page.goto(base + '#/stories');

  // The zoom lock (§4). The meta tag is the half Android honours; the JS is the half iOS needs.
  // Both are asserted, because either one alone leaves a phone able to pinch.
  const viewportMeta = await page.getAttribute('meta[name=viewport]', 'content');
  check('zoom: the viewport meta refuses scaling', () => {
    assert.match(viewportMeta, /user-scalable=no/);
    assert.match(viewportMeta, /maximum-scale=1/);
  });
  const pinches = await page.evaluate(() => {
    const fire = (event) => !document.dispatchEvent(event);
    const touch = (id) => new Touch({ identifier: id, target: document.body });
    return {
      gesturestart: fire(new Event('gesturestart', { cancelable: true, bubbles: true })),
      gesturechange: fire(new Event('gesturechange', { cancelable: true, bubbles: true })),
      twoFingers: fire(new TouchEvent('touchmove', {
        cancelable: true, bubbles: true, touches: [touch(1), touch(2)],
      })),
      trackpad: fire(new WheelEvent('wheel', { cancelable: true, bubbles: true, ctrlKey: true })),
      oneFinger: fire(new TouchEvent('touchmove', {
        cancelable: true, bubbles: true, touches: [touch(1)],
      })),
      plainWheel: fire(new WheelEvent('wheel', { cancelable: true, bubbles: true })),
    };
  });
  check('zoom: an iOS pinch is refused', () => {
    assert.equal(pinches.gesturestart, true, 'gesturestart went through');
    assert.equal(pinches.gesturechange, true, 'gesturechange went through');
  });
  check('zoom: a two-finger drag is refused', () => assert.equal(pinches.twoFingers, true));
  check('zoom: a trackpad pinch is refused', () => assert.equal(pinches.trackpad, true));
  check('zoom: scrolling is left alone', () => {
    assert.equal(pinches.oneFinger, false, 'a one-finger scroll was cancelled');
    assert.equal(pinches.plainWheel, false, 'the wheel was cancelled');
  });

  await type(page, '#teller-name', 'Ada');
  await tap(page, '.action-bar .button');
  await present(page, 'text=No stories yet');
  await tap(page, '.action-bar .button');
  await type(page, '#prompt-input', 'The dragon next door');
  await tap(page, '.modal-actions .button');
  await present(page, '.story-header-title');
  check('walk: story header names the story', async () => {});
  const title = await read(page, '.story-header-title');
  check('walk: title', () => assert.equal(title, 'The dragon next door'));
  const counts = await read(page, '.progress-row');
  check('walk: progress counts', () => {
    assert.match(counts, /Ingredients 0\/4/);
    assert.match(counts, /Beats 0\/9/);
    assert.match(counts, /Boosts 0\/10/);
  });
  // Step 1: the idea, the die, the sparks.
  await page.goto(base + '#/build/idea');
  await type(page, '#idea-text', 'a lighthouse that walks');
  await page.waitForTimeout(600); // debounced autosave
  await tap(page, '.action-bar .button:not(.secondary)');
  await present(page, '.prompt-panel');
  const firstLetter = await read(page, '.die-letter');
  check('idea: the die lands on a real face', () => assert.match(firstLetter, /^[PMQGNS]$/));

  await tap(page, '.prompt-panel .button');
  const history = await settled(page, '.roll-history', /rolled 2 times/);
  check('idea: every roll is kept, none discarded', () => assert.match(history, /rolled 2 times/));

  await tap(page, '.spark-row .button');
  const spark = await read(page, '.spark-out');
  check('idea: sparks produce something', () => assert.ok(spark.trim().length > 5, 'no spark text'));
  const houseFlag = await read(page, '.spark-note .house-flag');
  check('idea: sparks are labelled as ours', () => assert.match(houseFlag, /not the deck/));

  // Tapping the same spark twice must not hand back the same line — it reads as a dead button.
  const repeats = await page.evaluate(async () => {
    const button = document.querySelector('.spark-row .button');
    const out = document.querySelector('.spark-out');
    const seen = [];
    for (let i = 0; i < 12; i++) { button.click(); seen.push(out.textContent); }
    return seen.filter((text, i) => i > 0 && text === seen[i - 1]).length;
  });
  check('idea: a spark never repeats the line already showing', () => assert.equal(repeats, 0, `${repeats} repeats in 12 taps`));

  await page.goto(base + '#/build/idea');
  const savedIdea = await page.inputValue('#idea-text');
  check('idea: the sentence persists', () => assert.equal(savedIdea, 'a lighthouse that walks'));
  const headerAfter = await read(page, '.progress-row');
  check('idea: the header knows there is an idea', () => assert.match(headerAfter, /Idea yes/));

  // Step 2: ingredients, one question at a time, in any order.
  await page.goto(base + '#/build/ingredients');
  await tap(page, '.card-grid .card');
  const firstQ = await settled(page, '.question-label', /How old are they\?/);
  check('ingredients: opens on the first question', () => assert.match(firstQ, /How old are they\?/));
  await type(page, '#answer', 'about eleven');
  await page.waitForTimeout(600);
  await tap(page, '.action-bar .button:not(.secondary)');
  const secondQ = await settled(page, '.question-label', /What do they look like\?/);
  check('ingredients: Next advances', () => assert.match(secondQ, /What do they look like\?/));

  // The card's own printed questions are on the art. At 96px, with zoom locked (§4), opening it
  // big is the only way to read them.
  await tap(page, '.stage-card .face-button, .answer-face .face-button');
  const lightbox = await settled(page, '.modal', /\w/);
  check('a card face opens big', () => assert.ok(lightbox.length > 0, 'no lightbox'));
  const bigFace = await page.evaluate(() => {
    const img = document.querySelector('.lightbox .card-face');
    return img ? Math.round(img.getBoundingClientRect().width) : 0;
  });
  check('and it is actually big', () => assert.ok(bigFace >= 240, `${bigFace}px wide`));
  await tap(page, '.modal-actions .button');
  await page.waitForTimeout(100);
  const closed = await page.evaluate(() => document.querySelectorAll('.modal').length);
  check('and it closes again', () => assert.equal(closed, 0));

  // Jump straight to the name question via the pips (P2 survives the one-at-a-time format).
  await tap(page, '.pips .pip:nth-child(6)');
  await settled(page, '.question-label', /What are they called\?/);
  await type(page, '#answer', 'Bo');
  await page.waitForTimeout(600);
  await page.goto(base + '#/build/ingredients');
  const gridText = await read(page, '#screen');
  check('ingredients: the tile takes the character\'s name', () => assert.match(gridText, /Bo/));
  check('ingredients: the tile counts answers', () => assert.match(gridText, /2 of 6 answered/));
  const headerCounts = await read(page, '.progress-row');
  check('ingredients: the header counts the card', () => assert.match(headerCounts, /Ingredients 1\/4/));

  // P3: the same card twice.
  await tap(page, 'text=Add another main character');
  await present(page, '#answer');
  await page.goto(base + '#/build/ingredients');
  const twoHeroes = await page.evaluate(() => document.querySelectorAll('.card-grid')[0].children.length);
  check('ingredients: a second main character is allowed', () => assert.equal(twoHeroes, 2));

  // P1: skip a card, and get it back.
  const skipButtons = await page.$$('text=Skip this one for now');
  await skipButtons[1].click();
  const afterSkip = await settled(page, '#screen', /Skipped for now/);
  check('ingredients: skipping says so and offers it back', () => assert.match(afterSkip, /Skipped for now/));
  await tap(page, 'text=Bring it back');
  await page.waitForFunction(() => !/Skipped for now/.test(document.querySelector('#screen').textContent), null, { timeout: 5000 });
  const afterUnskip = await read(page, '#screen');
  check('ingredients: a skipped card comes back', () => assert.ok(!/Skipped for now/.test(afterUnskip)));

  // Sparks: three at a time, tap one into the field, and the label saying whose they are.
  await page.goto(base + '#/build/ingredients/inciting/0');
  await present(page, '#answer');
  const sparkLabel = await read(page, '.sparks .house-flag');
  check('sparks: labelled as ours, not the deck\'s', () => assert.match(sparkLabel, /not the deck/));
  const chipsBefore = await page.evaluate(() => document.querySelectorAll('.spark-chip').length);
  check('sparks: nothing is shown until asked for', () => assert.equal(chipsBefore, 0));

  await tap(page, '.sparks .button');
  await present(page, '.spark-chip');
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
  await tap(page, '.spark-chip');
  await page.waitForTimeout(650); // the debounced autosave
  const afterPick = await page.inputValue('#answer');
  check('sparks: tapping one drops it in the field', () => assert.equal(afterPick, chipText));
  await page.goto(base + '#/build/ingredients/inciting/0');
  const persisted2 = await page.inputValue('#answer');
  check('sparks: what it dropped in is saved like anything else', () => assert.equal(persisted2, chipText));

  // A beat's sparks fill in the names the story has, rather than saying "the hero".
  await page.goto(base + '#/build/structure/5');
  await tap(page, '.sparks .button');
  await present(page, '.spark-chip');
  const beatChips = await page.evaluate(() => [...document.querySelectorAll('.spark-chip')].map((c) => c.textContent).join(' | '));
  check('sparks: no placeholder ever reaches the screen', () => assert.ok(!/[{}]/.test(beatChips), beatChips));

  // Step 3: the nine beats, and ruling A5 in the browser.
  await page.goto(base + '#/build/ingredients/inciting/0');
  await type(page, '#answer', 'Grandma falls ill');
  await page.waitForTimeout(600);

  await page.goto(base + '#/build/structure');
  const beatList = await read(page, '.beat-list');
  check('structure: all nine beats are listed', () => {
    assert.match(beatList, /Once upon a time/);
    assert.match(beatList, /In the end/);
  });
  const beatRows = await page.evaluate(() => document.querySelectorAll('.beat-row').length);
  check('structure: nine of them', () => assert.equal(beatRows, 9));

  await page.goto(base + '#/build/structure/2');
  await present(page, '#beat-text');
  const prefilled = await page.inputValue('#beat-text');
  check('A5: beat 2 arrives pre-filled from the ingredient', () => assert.equal(prefilled, 'Grandma falls ill'));
  const provenance = await read(page, '.provenance');
  check('A5: and says where it came from', () => assert.match(provenance, /Something happens/));

  await type(page, '#beat-text', 'One morning a letter arrives instead');
  await page.waitForTimeout(600);
  await page.goto(base + '#/build/ingredients/inciting/0');
  const ingredientStillSays = await page.inputValue('#answer');
  check('A5: editing the beat leaves the card alone', () => assert.equal(ingredientStillSays, 'Grandma falls ill'));

  await page.goto(base + '#/build/structure/9');
  await type(page, '#beat-text', 'In the end everyone goes home.');
  await page.waitForTimeout(600);
  const beatCounts = await read(page, '.progress-row');
  check('structure: the header counts written beats', () => assert.match(beatCounts, /Beats 2\/9/));

  // Step 4: the boosts, the snapshot, and the two permissions the booklet demonstrates.
  await page.goto(base + '#/build/boost');
  const boostTiles = await page.evaluate(() => document.querySelectorAll('.card-grid .card').length);
  check('boost: all ten are offered', () => assert.equal(boostTiles, 10));
  const frozenNote = await read(page, '#screen');
  check('A8: the before-version is frozen on arrival', () => assert.match(frozenNote, /as it was when you started boosting/));

  await page.goto(base + '#/build/boost/boost-help');
  await type(page, '#boost-answer', 'He needs a sister');
  await page.waitForTimeout(600);

  // P6: this card invents a character, and the new card carries where it came from.
  await tap(page, 'text=This gives me a new character');
  await settled(page, '.question-label', /How old are they\?/);
  await type(page, '#answer', 'a bit younger');
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
  await tap(page, 'text=Change beat 4');
  await settled(page, '.provenance', /came here from a Boost card/);
  await type(page, '#beat-text', 'They are abandoned twice, and the second time the birds eat the crumbs.');
  await page.waitForTimeout(600);
  const backLink = await read(page, '.back-link');
  check('P7: the beat offers the way back to the boost', () => assert.match(backLink, /Back to/));
  await tap(page, '.action-bar .button:not(.secondary)');
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

  // P8: skipping a boost is a control, and it is reversible. Read the stored flag, not the label:
  // an assertion that cannot fail is not a guard.
  const boostFlag = () => page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('storyMachine.currentStory'));
    const story = JSON.parse(localStorage.getItem(`storyMachine.story.${id}`));
    return story.boosts?.['boost-narrator']?.skipped ?? null;
  });
  await page.goto(base + '#/build/boost/boost-narrator');
  check('P8: a boost starts unskipped', async () => {});
  const before = await boostFlag();
  await tap(page, 'text=Skip this one');
  await settled(page, '#screen', /Bring this one back/);
  const skipped = await boostFlag();
  await tap(page, 'text=Bring this one back');
  await settled(page, '#screen', /Skip this one/);
  const unskipped = await boostFlag();
  check('P8: skipping a boost is recorded, and undone again', () => {
    assert.notEqual(before, true, 'it was already skipped before the test touched it');
    assert.equal(skipped, true, 'skipping did not reach the story');
    assert.equal(unskipped, false, 'bringing it back did not reach the story');
  });

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
  await tap(page, '.version-toggle button');
  const beforeText = await settled(page, '.told-story', /draft you had when you started boosting/);
  check('D10: the before-version says what it is', () => assert.match(beforeText, /draft you had/));
  const pressed = await page.evaluate(() => document.querySelector('.version-toggle button').getAttribute('aria-pressed'));
  check('D10: the toggle says which is showing', () => assert.equal(pressed, 'true'));

  await tap(page, '.version-toggle button:nth-child(2)');
  const afterText = await settled(page, '.told-story', /abandoned twice/);
  check('D10: after the boosts holds the rewritten beat', () => assert.match(afterText, /abandoned twice/));
  check('D10: and the before-version did not', () => assert.ok(!/abandoned twice/.test(beforeText)));

  // The deck's own dividers, as bands rather than cards (G5, A2).
  await page.goto(base + '#/deck/prompts');
  const banner = await page.evaluate(() => {
    const b = document.querySelector('.group-banner');
    if (!b) return null;
    const box = b.getBoundingClientRect();
    return { h: Math.round(box.height), w: Math.round(box.width), inGrid: Boolean(b.closest('.card-grid')) };
  });
  check('a deck section wears its divider', () => assert.ok(banner, 'no group banner'));
  check('the divider is a band, not a card', () => {
    assert.ok(banner.h <= 120, `${banner.h}px tall`);
    assert.ok(banner.w > banner.h * 2, 'too tall to read as a band');
    assert.equal(banner.inGrid, false, 'a divider is sitting in the card grid');
  });

  // A deck has two sides (D28). A card with nothing written on it is lying face-down; answering
  // it turns it over. The back has to be somewhere a kid actually sees it, or it is dead art.
  await page.goto(base + '#/build/boost');
  await present(page, '.card-grid');
  const sides = await page.evaluate(() => [...document.querySelectorAll('.card-grid .card')].map((c) => ({
    down: Boolean(c.querySelector('.card-back')),
    blank: Boolean(c.querySelector('.card-blank')),
  })));
  check('an unanswered card lies face-down', () => {
    const wrong = sides.filter((c) => c.down !== c.blank);
    assert.deepEqual(wrong, [], `${wrong.length} cards show the wrong side`);
    assert.ok(sides.some((c) => c.down), 'no card is face-down');
    assert.ok(sides.some((c) => !c.down), 'every card is face-down');
  });

  // The Deck is the reference shelf: there, every card is face-up whatever the story has done.
  await page.goto(base + '#/deck/boosts');
  await present(page, '.card-grid');
  const deckDown = await page.evaluate(() => document.querySelectorAll('.card-grid .card-back').length);
  check('the Deck shows every face', () => assert.equal(deckDown, 0));

  // A finished card says so from across the room (G9), and a written beat fills its node (G7).
  await page.goto(base + '#/build/boost');
  await present(page, '.card-grid');
  const badges = await page.evaluate(() => document.querySelectorAll('.done-badge').length);
  check('answered boosts carry a mark', () => assert.ok(badges > 0, 'no done badges on an answered grid'));

  await page.goto(base + '#/build/structure');
  await present(page, '.beat-row');
  const rail = await page.evaluate(() => ({
    written: document.querySelectorAll('.beat-row.is-written').length,
    total: document.querySelectorAll('.beat-row').length,
  }));
  check('the beat rail marks what is written', () => {
    assert.ok(rail.written > 0, 'no beat is marked written');
    assert.ok(rail.written < rail.total, 'every beat is marked written');
  });

  // Learn: search, and the link from a card to its entry.
  await page.goto(base + '#/learn');
  await type(page, '#learn-search', 'Cinderella');
  const hits = await settled(page, '.learn-results', /match/);
  check('learn: search finds the booklet examples', () => assert.match(hits, /match/));
  await page.goto(base + '#/deck/card/beat-5');
  const cardLinks = await read(page, '#screen');
  check('learn: every card links to its entry', () => assert.match(cardLinks, /Read more about this card/));

  // The two worked stories, readable from the shelf.
  await page.goto(base + '#/example/example-hansel-gretel');
  const hg = await settled(page, '.told-story', /Once upon a time|Hänsel/);
  check('examples: Hänsel and Gretel reads back', () => assert.match(hg, /Hänsel/));
  const hgToggles = await page.evaluate(() => document.querySelectorAll('.version-toggle button').length);
  check('examples: it is told twice', () => assert.equal(hgToggles, 2));
  await tap(page, '.version-toggle button');
  await settled(page, '.told-story', /draft you had/);
  // The title says "Hänsel and Gretel" either way, so read the passages, not the whole card.
  const beforePassages = await page.evaluate(() => [...document.querySelectorAll('.told-passage')].map((n) => n.textContent).join(' '));
  check('examples: the first draft is Hänsel alone', () => {
    assert.ok(!/Gretel/.test(beforePassages), 'the draft mentions Gretel');
    assert.match(beforePassages, /Hänsel/);
  });
  await tap(page, '.version-toggle button:nth-child(2)');
  await settled(page, '.told-story', /Gretel throws|tricked the witch/);
  const afterPassages = await page.evaluate(() => [...document.querySelectorAll('.told-passage')].map((n) => n.textContent).join(' '));
  check('examples: the boosted version has a sister who saves him', () => assert.match(afterPassages, /Gretel/));
  const afterCard = await read(page, '.told-story');
  check('examples: and says which card invented her', () => assert.match(afterCard, /came from a boost/));

  // Adding a second character is a permission; removing it again has to exist, and confirm.
  await page.goto(base + '#/build/ingredients');
  const heroesBefore = await page.evaluate(() => document.querySelectorAll('.card-grid')[0].children.length);
  await tap(page, 'text=Add another main character');
  await settled(page, '.question-label', /How old are they\?/);
  const removeShown = await page.evaluate(() => Boolean([...document.querySelectorAll('button')].find((b) => /^Remove /.test(b.textContent))));
  check('a second character can be removed again', () => assert.ok(removeShown, 'no way to undo adding one'));
  await tap(page, '#screen .button.danger');
  const removeWarning = await settled(page, '.modal p', /answer/);
  check('removing one names what goes with it', () => assert.match(removeWarning, /Every answer on this card goes/));
  await tap(page, '.modal-actions .button:not(.secondary)');
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
  await tap(page, '.progress-row .button');
  await present(page, '.teller-row');
  await tap(page, '.teller-row .button.danger');
  const warning = await settled(page, '.modal p', /stor/);
  check('remove storyteller names what is lost', () => assert.match(warning, /stor(y|ies)/));
  await tap(page, '.modal-actions .button.secondary');
  await page.waitForTimeout(50);
  const stillThere = await page.evaluate(() => document.querySelectorAll('.modal').length);
  check('cancel leaves everything alone', () => assert.equal(stillThere, 0));

  await page.goto(base + '#/stories');
  const persisted = await read(page, '#screen');
  check('walk: story persists on the shelf', () => assert.match(persisted, /The dragon next door/));
  check('walk: the shelf shows the idea as the blurb', () => assert.match(persisted, /a lighthouse that walks/));

  // D23: the tablet adds columns rather than stretching a phone layout across a metre.
  for (const [w, wanted] of [[1024, 2], [390, 1]]) {
    const wide = await browser.newContext({ viewport: { width: w, height: 800 } });
    await seed(wide, 'stress');
    const widePage = await wide.newPage();
    for (const route of ['#/stories', '#/learn']) {
      await widePage.goto(base + route, { waitUntil: 'domcontentloaded' });
      await present(widePage, '.two-up');
      const columns = await widePage.evaluate(() => {
        const box = document.querySelector('.two-up');
        return getComputedStyle(box).gridTemplateColumns.split(' ').filter(Boolean).length;
      });
      check(`${w} ${route} columns`, () => assert.equal(columns, wanted, `${columns} columns at ${w}`));
    }
    await wide.close();
  }

  // Getting rid of things. Both controls existed before and neither was findable: the storyteller
  // one hid behind a button that said "Switch", and Settings — where a person looks to delete
  // themselves — offered neither. So the label is asserted, not just the behaviour.
  const tellerControl = await page.evaluate(() => {
    const b = document.querySelector('.progress-row .button');
    return `${b.textContent} ${b.getAttribute('aria-label') || ''}`;
  });
  check('the shelf control says it can remove a storyteller', () => assert.match(tellerControl, /remove/i));

  await page.goto(base + '#/settings');
  await present(page, '#screen h2');
  const settingsText = await read(page, '#screen');
  check('settings offers the storyteller manager', () => assert.match(settingsText, /Switch, add or remove/));
  check('settings offers to delete the open story', () => assert.match(settingsText, /Delete this story/));

  await tap(page, '#screen .button.danger');
  const storyWarning = await settled(page, '.modal', /beats/);
  check('deleting a story names what goes with it', () => assert.match(storyWarning, /all nine beats and every boost/));
  await tap(page, '.modal-actions .button:not(.secondary)');
  const emptyShelf = await settled(page, '#screen h2', /No stories yet/);
  check('and the story actually goes', () => assert.match(emptyShelf, /No stories yet/));

  // The last storyteller is removable too: a person who wants off this device gets all the way off.
  await tap(page, '.progress-row .button');
  await present(page, '.teller-row');
  await tap(page, '.teller-row .button.danger');
  await settled(page, '.modal', /Remove/);
  await tap(page, '.modal-actions .button:not(.secondary)');
  const firstRun = await settled(page, '#screen h2', /Who is telling stories/);
  check('the last storyteller can be removed', () => assert.match(firstRun, /Who is telling stories/));

  await context.close();

  // The action bar is the one measurement that is sensitive to width rather than to layout: the
  // context line shares a row with buttons that will not shrink. Sampling five widths missed it —
  // with both guards removed the bar only breaks its budget between 431 and 440px, a band narrower
  // than the gap between any two widths in the sweep. So this one walks the range.
  {
    const barCtx = await browser.newContext({ viewport: { width: 320, height: 800 } });
    await seed(barCtx, 'mid-story');
    const barPage = await barCtx.newPage();
    await barPage.goto(base + '#/build/tell', { waitUntil: 'domcontentloaded' });
    await present(barPage, '.action-bar');
    const tall = [];
    for (let width = 320; width <= 1024; width += 8) {
      await barPage.setViewportSize({ width, height: 800 });
      const height = await barPage.evaluate(() => Math.round(document.querySelector('.action-bar').getBoundingClientRect().height));
      if (height > 96) tall.push(`${width}px → ${height}px`);
    }
    check('the action bar stays one bar at every width', () => assert.deepEqual(tall, [], tall.join(', ')));
    await barCtx.close();
  }

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
    await present(messyPage, '#screen');
    const over = await messyPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`messy ${route} overflow`, () => assert.ok(over <= 0, `${over}px of horizontal overflow`));
    // No stray-text check here: this fixture types "null", "NaN" and "[object Object]" into its
    // answers on purpose, and rendering what the kid typed is correct. The mid-story sweep above
    // is what catches the app producing those itself.
  }
  check('messy: no errors anywhere', () => assert.deepEqual(messyErrors, []));
  await messyContext.close();

  // The spec requires the app to work with assets/cards/ empty (§11). With the art present that
  // path never runs, so block the requests and check what a kid sees instead of a broken image.
  const bareContext = await browser.newContext({ viewport: { width: 390, height: 740 } });
  await bareContext.route('**/assets/cards/*', (route) => route.abort());
  const barePage = await bareContext.newPage();
  await barePage.goto(base + '#/deck/structure', { waitUntil: 'domcontentloaded' });
  await present(barePage, '.card-grid .card');
  await barePage.waitForTimeout(400);
  const bare = await barePage.evaluate(() => {
    const cards = [...document.querySelectorAll('.card-grid .card')];
    return {
      cards: cards.length,
      placeholders: cards.filter((c) => c.querySelector('.card-face-missing')).length,
      broken: cards.filter((c) => {
        const img = c.querySelector('img.card-face');
        return img && img.naturalWidth === 0;
      }).length,
      label: document.querySelector('.card-face-missing')?.textContent?.trim() || '',
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  check('with no card art, every face falls back to a labelled placeholder', () => {
    assert.ok(bare.cards > 0, 'no cards rendered at all');
    assert.equal(bare.broken, 0, 'a broken image was left on the page');
    assert.equal(bare.placeholders, bare.cards, `${bare.cards - bare.placeholders} cards showed neither art nor a placeholder`);
    assert.match(bare.label, /Structure/, 'the placeholder should say which kind of card is missing');
    assert.ok(bare.overflow <= 0, 'the placeholder layout overflows');
  });
  await bareContext.close();

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
  await present(subPage, '#screen');
  check('deployed under a sub-path: the app boots', () => assert.deepEqual(subErrors, []));
  await subPage.goto(`${subBase}#/deck/structure`);
  await present(subPage, '.card-grid .card');
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
  await present(artPage, '.card-grid .card');
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
if (noBar.size) console.log(`  no pinned action (reference screens): ${[...noBar].join(', ')}`);
