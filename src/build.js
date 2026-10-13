// The guided five-step path and its section nav — the frame each step hangs on, carrying the
// escapes the booklet grants (P1, P2, P5, P9) on every screen.

import { icon } from './icons.js';
import { el, add } from './core.js';
import { clearActionBar, swipeToDeal, dealerHint } from './ui.js';
import { STEPS } from '../data.js';
import { getCurrentStory, getPrefs, setPref } from './store.js';
import { dealNeighbours } from './derived.js';
import { ideaStep } from './idea.js';
import { ingredientsGrid, ingredientQuestion } from './ingredients.js';
import { structureList, beatScreen } from './structure.js';
import { boostGrid, boostScreen } from './boost.js';
import { tellScreen } from './tell.js';

export function buildScreen({ step, entryId, qIndex = 0, beatNumber, boostId, fromBoost }) {
  const story = getCurrentStory();
  if (!story) return noStory();

  const current = STEPS.find((s) => s.id === step) || STEPS[0];
  const screen = el('div');

  // A screen that surveys the step (the grid, the board, the fan) against one that answers a
  // single question. The difference decides almost everything below: a question screen carries
  // the question, not a paragraph about the step it belongs to.
  const surveying = !entryId && !beatNumber && !boostId;

  // D54 — nothing on the table but the work. The bar names the step; the step's heading stays in
  // the outline for a screen reader and is not drawn, and the line about what the step is for and
  // the strip of characters are gone: the card says what it wants, and the spread shows the rest.
  add(screen, el('h2', { class: 'visually-hidden', text: `${current.n}. ${current.name}` }));

  // A dealt card can be swiped for the next one, and the first one ever dealt says how (D53, D61).
  const dealing = !surveying || current.id === 'idea';
  if (dealing) {
    swipeToDeal(screen, dealNeighbours(story, location.hash || ''));
    add(screen, dealerHint(getPrefs().dealerHintSeen, () => setPref('dealerHintSeen', true)));
  }

  if (current.id === 'idea') {
    add(screen, ideaStep(story)); // owns its own action bar
    return screen;
  }

  if (current.id === 'ingredients') {
    add(screen, entryId ? ingredientQuestion(story, entryId, qIndex) : ingredientsGrid(story));
    return screen;
  }

  if (current.id === 'structure') {
    add(screen, beatNumber ? beatScreen(story, beatNumber, fromBoost) : structureList(story));
    return screen;
  }

  if (current.id === 'boost') {
    add(screen, boostId ? boostScreen(story, boostId) : boostGrid(story));
    return screen;
  }

  add(screen, tellScreen(story));
  return screen;
}

function noStory() {
  clearActionBar();
  const screen = el('div');
  add(screen, el('h2', { text: 'No story open' }));
  add(screen, add(
    el('p', { class: 'empty' }),
    icon('empty-shelf', { size: 48 }),
    document.createTextNode('Pick a story from your shelf, or start a new one.'),
  ));
  add(screen, el('p'), el('a', { class: 'button', href: '#/stories', text: 'Go to your stories' }));
  return screen;
}
