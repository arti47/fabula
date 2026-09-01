// Hash routing, the tab bar, the persistent story header.

import { el, add, clear, qs } from './core.js';
import { getCurrentStory, getCurrentStoryteller } from './store.js';
import { progress } from './derived.js';
import { deckScreen, cardScreen, settingsScreen, notFoundScreen } from './screens.js';
import { learnScreen } from './learn.js';
import { tutorialScreen } from './tutorial.js';
import { storiesScreen, exampleScreen } from './library.js';
import { buildScreen } from './build.js';

const TABS = [
  { id: 'stories', label: 'Stories', icon: '❐', href: '#/stories', match: /^#\/(stories|example)/ },
  { id: 'build', label: 'Build', icon: '✎', href: '#/build', match: /^#\/build/ },
  { id: 'deck', label: 'Deck', icon: '🂠', href: '#/deck', match: /^#\/deck/ },
  { id: 'learn', label: 'Learn', icon: '?', href: '#/learn', match: /^#\/learn/ },
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

function renderTabs() {
  const bar = clear(qs('#tab-bar'));
  const hash = location.hash || '#/stories';
  for (const tab of TABS) {
    add(bar, add(
      el('a', { href: tab.href, 'aria-current': tab.match.test(hash) ? 'page' : null }),
      el('span', { class: 'tab-icon', 'aria-hidden': 'true', text: tab.icon }),
      el('span', { text: tab.label }),
    ));
  }
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
  const teller = getCurrentStoryteller();
  clear(header);
  header.hidden = false;
  add(header, el('p', { class: 'story-header-title', text: story.title }));
  add(header, add(
    el('div', { class: 'progress-row' }),
    item('Idea', p.idea ? 'yes' : 'not yet'),
    item('Ingredients', `${p.ingredients.done}/${p.ingredients.total}`),
    item('Beats', `${p.beats.done}/${p.beats.total}`),
    item('Boosts', `${p.boosts.done}/${p.boosts.total}`),
    teller ? el('span', { class: 'progress-item', text: `${teller.emoji} ${teller.name}` }) : null,
  ));
}

function item(label, value) {
  return add(el('span', { class: 'progress-item' }), document.createTextNode(`${label} `), el('b', { text: value }));
}

function render() {
  const hash = location.hash || '#/stories';
  const screen = qs('#screen');
  clear(screen);

  const route = ROUTES.find((r) => r.pattern.test(hash));
  const match = route ? hash.match(route.pattern) : null;
  add(screen, route ? route.render(match) : notFoundScreen());

  renderTabs();
  renderStoryHeader();
  window.scrollTo(0, 0);
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#/stories';
  render();
}
