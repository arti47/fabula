// Hash routing, the tab bar, the persistent story header.

import { el, add, clear, qs } from './core.js';
import { modal } from './ui.js';
import { icon } from './icons.js';
import { getCurrentStory, getCurrentStoryteller } from './store.js';
import { progress } from './derived.js';
import { deckScreen, cardScreen, settingsScreen, notFoundScreen } from './screens.js';
import { learnScreen } from './learn.js';
import { tutorialScreen } from './tutorial.js';
import { storiesScreen, exampleScreen, storytellerManager } from './library.js';
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
  // On a story, the bar names the step you are standing in — it is the only heading drawn (D54).
  const step = hash.startsWith('#/build')
    ? STEP_ROWS.find((r) => r.id === (stepFor(hash) || (hash.startsWith('#/build/tell') ? 'tell' : null)))
    : null;
  here.textContent = settings ? 'Settings' : (step ? step.name : (place ? place.label : 'Stories'));
  here.setAttribute('href', settings ? '#/settings' : (step ? step.route : (place ? place.href : '#/stories')));
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

/**
 * The menu: the one button that opens everything else (D31, D54). The four places, then Settings
 * and the storyteller — who moved here from the bar, which now carries nothing but where you are
 * and your story's pile.
 */
function openMenu() {
  const hash = location.hash || '#/stories';
  const list = el('div', { class: 'place-list' });
  const row = (href, iconName, name, blurb, here) => add(
    el('a', { class: `place${here ? ' is-here' : ''}`, href, 'aria-current': here ? 'page' : null }),
    icon(iconName, { size: 26 }),
    add(el('span', { class: 'place-text' }), el('span', { class: 'place-name', text: name }), el('span', { class: 'place-blurb', text: blurb })),
  );
  for (const place of PLACES) add(list, row(place.href, place.id, place.label, place.blurb, place.match.test(hash)));
  add(list, row('#/settings', 'settings', 'Settings', 'Text size, backups', hash.startsWith('#/settings')));
  const teller = getCurrentStoryteller();
  let close = () => {};
  if (teller) {
    // Named for everything it does: switch, add and remove (§0.2).
    add(list, add(
      el('button', {
        type: 'button', class: 'place place-teller', 'aria-label': 'Switch, add or remove a storyteller',
        onclick: () => { close(); storytellerManager(); },
      }),
      el('span', { class: 'teller-face', 'aria-hidden': 'true', text: teller.emoji }),
      add(el('span', { class: 'place-text' }), el('span', { class: 'place-name', text: teller.name }), el('span', { class: 'place-blurb', text: 'Switch, add or remove' })),
    ));
  }
  close = modal({ title: 'Go somewhere else', body: [list], actions: [{ label: 'Stay here', kind: 'secondary' }] });
  for (const link of list.querySelectorAll('a')) link.addEventListener('click', () => close());
}

function wireMenu() {
  const button = qs('#menu-button');
  if (!button || button.dataset.wired) return;
  button.dataset.wired = 'yes';
  button.addEventListener('click', openMenu);
}

const STEP_ROWS = [
  { id: 'idea', name: 'Idea', route: '#/build/idea', sigil: 'die' },
  { id: 'ingredients', name: 'Ingredients', route: '#/build/ingredients', sigil: 'flask' },
  { id: 'structure', name: 'Structure', route: '#/build/structure', sigil: 'number' },
  { id: 'boost', name: 'Boost', route: '#/build/boost', sigil: 'magnifier' },
  { id: 'tell', name: 'Tell', route: '#/build/tell', sigil: 'stories' },
];

/** What each step has, in words — the same counts the header always carried (§6.2, A10). */
function stepCounts(p) {
  return {
    idea: p.idea ? 'written' : 'not yet',
    ingredients: `${p.ingredients.done} of ${p.ingredients.total}`,
    structure: `${p.beats.done} of ${p.beats.total} beats`,
    boost: `${p.boosts.done} of ${p.boosts.total}`,
    tell: p.beats.done ? 'something to read' : 'nothing to read yet',
  };
}

/**
 * The persistent resource header, as a pile of cards (D54). It used to be the story's cover, its
 * title and a five-stop road with counts under each — a band of chrome on every screen. Progress
 * is now the thing it is in the box: the cards you have written, stacked, thickening as the story
 * grows, in the bar. It says the counts in words to a screen reader and opens the five steps.
 * Still progress, never a score (A10). Every module calls this after a save.
 */
export function renderStoryHeader() {
  const header = qs('#story-header');
  if (header) { header.hidden = true; clear(header); }
  const button = qs('#pile-button');
  if (!button) return;
  const story = getCurrentStory();
  const onStoryScreen = (location.hash || '').startsWith('#/build');
  button.hidden = !story || !onStoryScreen;
  if (button.hidden) return;
  const p = progress(story);
  const written = (p.idea ? 1 : 0) + p.ingredients.done + p.beats.done + p.boosts.done;
  const counts = stepCounts(p);
  button.setAttribute('aria-label', `Your story so far: Idea ${counts.idea}, Ingredients ${counts.ingredients}, `
    + `Beats ${p.beats.done} of ${p.beats.total}, Boosts ${counts.boost}. Open the five steps`);
  const stack = el('span', { class: 'pile-stack', 'aria-hidden': 'true', style: `--layers: ${Math.min(5, 1 + Math.ceil(written / 5))}` });
  for (let i = 0; i < Math.min(5, 1 + Math.ceil(written / 5)); i += 1) add(stack, el('i'));
  button.replaceChildren(stack, el('span', { class: 'pile-count', 'aria-hidden': 'true', text: String(written) }));
  if (!button.dataset.wired) {
    button.dataset.wired = 'yes';
    button.addEventListener('click', openSteps);
  }
}

/** The five steps, each with what it has — the step nav, one tap behind the pile (D54). */
function openSteps() {
  const story = getCurrentStory();
  if (!story) return;
  const counts = stepCounts(progress(story));
  const here = stepFor(location.hash || '') || ((location.hash || '').startsWith('#/build/tell') ? 'tell' : null);
  const list = el('nav', { class: 'place-list step-list', 'aria-label': 'Story steps' });
  for (const step of STEP_ROWS) {
    add(list, add(
      el('a', { class: `place${here === step.id ? ' is-here' : ''}`, href: step.route, 'aria-current': here === step.id ? 'step' : null }),
      icon(step.sigil, { size: 26 }),
      add(el('span', { class: 'place-text' }), el('span', { class: 'place-name', text: step.name }), el('span', { class: 'place-blurb', text: counts[step.id] })),
    ));
  }
  const close = modal({ title: story.title, body: [list], actions: [{ label: 'Back to the card', kind: 'secondary' }] });
  for (const link of list.querySelectorAll('a')) link.addEventListener('click', () => close());
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

// S15 — where you were on each screen, for this session. Coming back to the board from beat 7 put
// you at the top of it again, and a re-render on the same screen (a skip, a bring-back) jumped
// the page to the top under your thumb. Kept in memory only: nothing about it is worth saving.
const scrollMemory = new Map();
let lastHash = null;

function render() {
  const hash = location.hash || '#/stories';
  if (lastHash) scrollMemory.set(lastHash, window.scrollY);
  lastHash = hash;
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
  window.scrollTo(0, scrollMemory.get(hash) || 0);
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#/stories';
  render();
}
