// The guided five-step path and its section nav — the frame each step hangs on, carrying the
// escapes the booklet grants (P1, P2, P5, P9) on every screen.

import { icon } from './icons.js';
import { el, add } from './core.js';
import { clearActionBar, castRow } from './ui.js';
import { STEPS } from '../data.js';
import { getCurrentStory } from './store.js';
import { castStrip } from './derived.js';
import { ideaStep } from './idea.js';
import { ingredientsGrid, ingredientQuestion } from './ingredients.js';
import { structureList, beatScreen } from './structure.js';
import { boostGrid, boostScreen } from './boost.js';
import { tellScreen } from './tell.js';

// One sentence per step, said once (D44). Structure's and Boost's are the sentences those two
// modules used to print under the blurb — they are kept rather than the thinner ones because they
// carry the permissions (A9 and P5 for the beats, P8 for the boosts), and §10.8 wants the sentence
// that states a permission to survive next to the control that grants it.
const STEP_BLURB = {
  idea: 'One sentence about what your story is. Roll the die if you have not got one.',
  ingredients: 'Who is in it, who is against them, where it happens, and the thing that starts it all.',
  structure: 'Nine beats, in the order stories usually go. You can write them in any order you like, and leave any of them for later.',
  boost: 'Ten questions to make the story deeper. Use them in any order, and skip any you do not like — you do not have to answer them all.',
  tell: 'Read the whole thing back, before and after the boosts.',
};

export function buildScreen({ step, entryId, qIndex = 0, beatNumber, boostId, fromBoost }) {
  const story = getCurrentStory();
  if (!story) return noStory();

  const current = STEPS.find((s) => s.id === step) || STEPS[0];
  const screen = el('div');

  // A screen that surveys the step (the grid, the board, the fan) against one that answers a
  // single question. The difference decides almost everything below: a question screen carries
  // the question, not a paragraph about the step it belongs to.
  const surveying = !entryId && !beatNumber && !boostId;

  // D44 — the section nav is gone: the journey strip in the story header carries the same five
  // steps, in the same order, and it is sticky. That frees the step's own heading to be *drawn*
  // on the survey screens, because nothing else there names the step any more (§6, reversing the
  // consequence D37 recorded): the strip names its stops only to a screen reader. On a question
  // screen the card's own headline is the heading, so the step's stays in the outline only.
  const heading = el('h2', { class: surveying ? null : 'visually-hidden', text: `${current.n}. ${current.name}` });
  if (surveying) {
    // What the step is for, said once. It was said twice — a collapsed `explain()` and a visible
    // note under it — and D41 keeps `explain()` only where a screen is genuinely unclear.
    // S1: the heading and its lead are one block, side by side where there is width, so the work
    // starts in the top third of a phone rather than halfway down it.
    add(screen, add(el('header', { class: 'step-head' }), heading, el('p', { class: 'step-lead', text: STEP_BLURB[current.id] })));
    // What the story has made, above the work it is making (S3) — only on the two steps that are
    // about it: Ingredients, where it is being made, and Tell, where it is read. On the others it
    // was one more band between the kid and the work, and never on a question screen, where it
    // pushed the writing field off a 320 phone.
    if (current.id === 'ingredients' || current.id === 'tell') add(screen, castRow(castStrip(story)));
  } else {
    add(screen, heading);
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
