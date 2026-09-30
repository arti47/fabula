// Hash routing, the tab bar, the persistent story header.

import { el, add, clear, qs } from './core.js';
import { modal } from './ui.js';
import { icon } from './icons.js';
import { getCurrentStory } from './store.js';
import { progress, coverCard } from './derived.js';
import { BEATS } from '../data.js';
import { isBlank } from './core.js';
import { deckScreen, cardScreen, settingsScreen, notFoundScreen } from './screens.js';
import { learnScreen } from './learn.js';
import { tutorialScreen } from './tutorial.js';
import { storiesScreen, exampleScreen } from './library.js';
import { buildScreen } from './build.js';

// Where else you can go. A fixed bar of four tabs took 61px off every screen for navigation a kid
// uses a few times a session; it lives behind one button now, and the table gets the room (D31).
const PLACES = [
  { id: 'stories', label: 'Stories', blurb: 'Your shelf', href: '#/stories', match: /^#\/(stories|example)/ },
  { id: 'build', label: 'Build', blurb: 'The story you are making', href: '#/build', match: /^#\/build/ },
  { id: 'deck', label: 'Deck', blurb: 'All thirty cards', href: '#/deck', match: /^#\/deck/ },
  { id: 'learn', label: 'Learn', blurb: 'How it all works', href: '#/learn', match: /^#\/(learn|tutorial)/ },
];

const ROUTES = [
  { pattern: /^#\/stories\/?$/, render: () => storiesScreen() },
  { pattern: /^#\/example\/([\w-]+)\/?$/, render: (m) => exampleScreen(m[1]) },
  { pattern: /^#\/build\/?$/, render: () => buildScreen({ step: null }) },
  { pattern: /^#\/build\/ingredients\/([\w-]+)\/(\d+)\/?$/, render: (m) => buildScreen({ step: 'ingredients', entryId: m[1], qIndex: Number(m[2]) }) },
  { pattern: /^#\/build\/ingredients\/([\w-]+)\/?$/, render: (m) => buildScreen({ step: 'ingredients', entryId: m[1], qIndex: 0 }) },
  { pattern: /^#\/build\/structure\/(\d+)\/from\/([\w-]+)\/?$/, render: (m) => buildScreen({ step: 'structure', beatNumber: Number(m[1]), fromBoost: m[2] }) },
  { pattern: /^#\/build\/structure\/(\d+)\/?$/, render: (m) => buildScreen({ step: 'structure', beatNumber: Number(m[1]) }) },
  { pattern: /^#\/build\/boost\/([\w-]+)\/?$/, render: (m) => buildScreen({ step: 'boost', boostId: m[1] }) },
  { pattern: /^#\/build\/([\w-]+)\/?$/, render: (m) => buildScreen({ step: m[1] }) },
  { pattern: /^#\/deck\/card\/([\w-]+)\/?$/, render: (m) => cardScreen({ cardId: m[1] }) },
  { pattern: /^#\/deck\/([\w-]+)\/?$/, render: (m) => deckScreen({ section: m[1] }) },
  { pattern: /^#\/deck\/?$/, render: () => deckScreen({}) },
  { pattern: /^#\/learn\/([\w-]+)\/?$/, render: (m) => learnScreen({ openId: m[1] }) },
  { pattern: /^#\/learn\/?$/, render: () => learnScreen() },
  { pattern: /^#\/settings\/?$/, render: () => settingsScreen() },
  { pattern: /^#\/tutorial\/?$/, render: () => tutorialScreen() },
];

/** The bar names the place you are standing in, and marks it. */
function markHere() {
  const here = qs('#here');
  if (!here) return;
  const hash = location.hash || '#/stories';
  const place = PLACES.find((p) => p.match.test(hash));
  const settings = hash.startsWith('#/settings');
  here.textContent = settings ? 'Settings' : (place ? place.label : 'Stories');
  here.setAttribute('href', settings ? '#/settings' : (place ? place.href : '#/stories'));
  here.setAttribute('aria-current', 'page');
}

/** The header's own links are navigation too: say when you are standing on one. */
function markHeaderLinks() {
  const hash = location.hash || '';
  // Not the here-link: it is current by *place* (tutorial is Learn, an example is Stories), and
  // marking by href prefix stripped it on exactly those two routes.
  for (const link of document.querySelectorAll('.app-header a[href^="#/"]:not(#here)')) {
    if (hash.startsWith(link.getAttribute('href'))) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

/** The menu: one button, four places, the one you are standing on marked. */
function openMenu() {
  const hash = location.hash || '#/stories';
  const list = el('div', { class: 'place-list' });
  for (const place of PLACES) {
    const here = place.match.test(hash);
    const row = el('a', {
      class: `place${here ? ' is-here' : ''}`,
      href: place.href,
      'aria-current': here ? 'page' : null,
    });
    row.append(icon(place.id, { size: 26 }));
    add(row, add(
      el('span', { class: 'place-text' }),
      el('span', { class: 'place-name', text: place.label }),
      el('span', { class: 'place-blurb', text: place.blurb }),
    ));
    add(list, row);
  }
  const close = modal({ title: 'Go somewhere else', body: [list], actions: [{ label: 'Stay here', kind: 'secondary' }] });
  for (const row of list.querySelectorAll('a')) row.addEventListener('click', () => close());
}

function wireMenu() {
  const button = qs('#menu-button');
  if (!button || button.dataset.wired) return;
  button.dataset.wired = 'yes';
  button.addEventListener('click', openMenu);
}

/** The persistent resource header: the counts that say what is still blank (§6). */
export function renderStoryHeader() {
  const header = qs('#story-header');
  const story = getCurrentStory();
  const onStoryScreen = (location.hash || '').startsWith('#/build');
  if (!story || !onStoryScreen) {
    header.hidden = true;
    clear(header);
    return;
  }
  const p = progress(story);
  clear(header);
  header.hidden = false;
  // Two lines, not three. Who is telling the story does not change while you write it, and it is
  // named on the shelf and in Settings; the counts do change, which is what this header is for.
  // The cover the story wears (G6). Only the looks that want art behind their header show it;
  // the others hide it in CSS, so the markup is the same either way.
  const cover = coverCard(story);
  add(header, el('div', {
    class: 'story-header-art',
    'aria-hidden': 'true',
    style: `background-image: url("assets/cards/${cover.art}.webp")`,
  }));
  add(header, el('p', { class: 'story-header-title', text: story.title }));
  // The nine beats as an object rather than a fraction (S1): it thickens as the story is written.
  // A second channel for what the counts already say in words — never the only one (§6).
  const spine = el('div', { class: 'spine', 'aria-hidden': 'true' });
  for (const beat of BEATS) {
    add(spine, el('span', { class: `spine-bone${isBlank(story.beats?.[beat.n]?.text) ? '' : ' is-written'}` }));
  }
  add(header, spine);
  add(header, journeyStrip(p));
}

/**
 * The five steps as a road with four milestones on it, rather than four numbers (D35).
 *
 * Same information the counts carried, same words, and still never a score (§1): a stop shows how
 * much of its step is answered and nothing about how good it is. The stops are not labelled in
 * text on purpose — the section nav names all five directly underneath, in this order, and §6
 * forbids naming a thing twice on one screen. Each carries its group's sigil, its group's colour
 * and a hidden name, so the channel is never colour alone.
 */
function journeyStrip(p) {
  const stops = [
    { id: 'idea', name: 'Idea', route: '#/build/idea', sigil: 'die', color: 'var(--group-prompt)', value: p.idea ? 'yes' : 'not yet', fill: p.idea ? 1 : 0 },
    { id: 'ingredients', name: 'Ingredients', route: '#/build/ingredients', sigil: 'flask', color: 'var(--group-ingredient)', value: `${p.ingredients.done}/${p.ingredients.total}`, fill: p.ingredients.done / p.ingredients.total },
    { id: 'structure', name: 'Beats', route: '#/build/structure', sigil: 'number', color: 'var(--group-structure)', value: `${p.beats.done}/${p.beats.total}`, fill: p.beats.done / p.beats.total },
    { id: 'boost', name: 'Boosts', route: '#/build/boost', sigil: 'magnifier', color: 'var(--group-boost)', value: `${p.boosts.done}/${p.boosts.total}`, fill: p.boosts.done / p.boosts.total },
  ];
  const here = stepFor(location.hash || '');
  // D44 — the stops are the step nav. The strip already drew five milestones in the order the
  // section nav listed them, so the nav was a second copy of the same five names taking a band of
  // its own; folding it in here also makes the navigation sticky, which the nav never was.
  const nav = el('nav', { class: 'journey-nav', 'aria-label': 'Story steps' });
  const strip = add(nav, el('ol', { class: 'journey' })).lastChild;
  for (const stop of stops) {
    const node = add(
      el('span', { class: 'journey-node', 'aria-hidden': 'true', style: `--stop: ${stop.color}; --fill: ${Math.round(stop.fill * 100)}%` }),
      icon(stop.sigil, { size: 14 }),
    );
    add(strip, add(
      el('li', { class: `journey-stop${here === stop.id ? ' is-here' : ''}` }),
      add(
        el('a', { href: stop.route, 'aria-current': here === stop.id ? 'step' : null }),
        el('span', { class: 'visually-hidden', text: `${stop.name} ${stop.value}` }),
        node,
        el('span', { class: 'journey-value', 'aria-hidden': 'true', text: stop.value }),
      ),
    ));
  }
  // The end of the road. It has no count — nothing about the told story is measured (A10) — so it
  // is a destination rather than a milestone, and it opens once there is anything to read.
  const readable = p.beats.done > 0;
  add(strip, add(
    el('li', { class: `journey-stop journey-end${readable ? ' is-open' : ''}${here === 'tell' ? ' is-here' : ''}` }),
    add(
      el('a', { href: '#/build/tell', 'aria-current': (location.hash || '').startsWith('#/build/tell') ? 'step' : null }),
      el('span', { class: 'visually-hidden', text: readable ? 'Tell: there is something to read' : 'Tell: nothing to read yet' }),
      add(el('span', { class: 'journey-node', 'aria-hidden': 'true', style: '--stop: var(--accent); --fill: 0%' }), icon('stories', { size: 14 })),
    ),
  ));
  return nav;
}

/**
 * Scroll the section nav so the pill you are standing on is visible.
 *
 * The nav scrolls horizontally and started at zero every render, so from step 5 the current pill
 * sat off the right edge: the one pill that says where you are was the one you could not see.
 * Measured from boxes rather than `scrollIntoView`, which would also scroll the page.
 */
function centreCurrentPill() {
  for (const nav of document.querySelectorAll('.section-nav')) {
    const current = nav.querySelector('[aria-current]');
    if (!current) continue;
    const navBox = nav.getBoundingClientRect();
    const pill = current.getBoundingClientRect();
    nav.scrollLeft += (pill.left - navBox.left) - (navBox.width - pill.width) / 2;
  }
}

/**
 * Which of the deck's rooms the current route stands in (D33).
 *
 * The step sets `--accent` and tints the ground, so the answer has to come from the hash rather
 * than from whichever module happened to render last. A route that belongs to no group — the
 * shelf, Learn, Settings, Tell — returns null and the base palette applies.
 */
const STEP_BY_ROUTE = [
  [/^#\/build\/idea/, 'idea'],
  [/^#\/build\/ingredients/, 'ingredients'],
  [/^#\/build\/structure/, 'structure'],
  [/^#\/build\/boost/, 'boost'],
  [/^#\/deck\/prompts/, 'idea'],
  [/^#\/deck\/ingredients/, 'ingredients'],
  [/^#\/deck\/structure/, 'structure'],
  [/^#\/deck\/boosts/, 'boost'],
];

export function stepFor(hash) {
  const row = STEP_BY_ROUTE.find(([pattern]) => pattern.test(hash));
  return row ? row[1] : null;
}

function markStep(hash) {
  const step = stepFor(hash);
  if (step) document.documentElement.dataset.step = step;
  else delete document.documentElement.dataset.step;
}

function render() {
  const hash = location.hash || '#/stories';
  const screen = qs('#screen');
  clear(screen);

  // The screen arrives (D24). The class is removed as soon as the animation ends so a re-render
  // during it never leaves the screen stuck mid-fade.
  screen.classList.add('is-entering');
  screen.addEventListener('animationend', () => screen.classList.remove('is-entering'), { once: true });

  const route = ROUTES.find((r) => r.pattern.test(hash));
  const match = route ? hash.match(route.pattern) : null;
  add(screen, route ? route.render(match) : notFoundScreen());

  markStep(hash);
  wireMenu();
  markHere();
  markHeaderLinks();
  renderStoryHeader();
  centreCurrentPill();
  window.scrollTo(0, 0);
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#/stories';
  render();
}
