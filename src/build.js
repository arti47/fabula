// The guided five-step path and its section nav — the frame each step hangs on, carrying the
// escapes the booklet grants (P1, P2, P5, P9) on every screen.

import { icon } from './icons.js';
import { el, add } from './core.js';
import { explain, clearActionBar, castRow } from './ui.js';
import { STEPS } from '../data.js';
import { getCurrentStory } from './store.js';
import { blankSteps, castStrip } from './derived.js';
import { ideaStep } from './idea.js';
import { ingredientsGrid, ingredientQuestion } from './ingredients.js';
import { structureList, beatScreen } from './structure.js';
import { boostGrid, boostScreen } from './boost.js';
import { tellScreen } from './tell.js';

const STEP_BLURB = {
  idea: 'One sentence about what your story is. Roll the die if you have not got one.',
  ingredients: 'Who is in it, who is against them, where it happens, and the thing that starts it all.',
  structure: 'The nine beats, from “once upon a time” to “in the end”.',
  boost: 'Ten questions that make the story better — none of them compulsory.',
  tell: 'Read the whole thing back, before and after the boosts.',
};

export function buildScreen({ step, entryId, qIndex = 0, beatNumber, boostId, fromBoost }) {
  const story = getCurrentStory();
  if (!story) return noStory();

  const current = STEPS.find((s) => s.id === step) || STEPS[0];
  const blanks = blankSteps(story);
  const screen = el('div');

  add(screen, stepNav(current.id, blanks));
  // The nav pill above already says "3. Structure" in the accent colour; a heading two centimetres
  // below saying it again cost 45px on a phone and told nobody anything. It stays in the document
  // for the heading outline and for a screen reader, and stops being drawn twice.
  add(screen, el('h2', { class: 'visually-hidden', text: `${current.n}. ${current.name}` }));
  // What the story has made, above the work it is making (S3) — on the screens that survey the
  // step, never on the one-question screens, where it pushed the writing field off a 320 phone.
  const surveying = !entryId && !beatNumber && !boostId;
  if (surveying) add(screen, castRow(castStrip(story)));
  add(screen, explain(
    STEP_BLURB[current.id],
    'You do not have to do these in order, and you can leave anything blank and come back to it. The story is yours.',
  ));

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

function stepNav(currentId, blanks) {
  const nav = el('nav', { class: 'section-nav', 'aria-label': 'Story steps' });
  for (const step of STEPS) {
    add(nav, add(
      el('a', {
        href: step.route,
        'aria-current': step.id === currentId ? 'step' : null,
      }),
      document.createTextNode(`${step.n}. ${step.name}`),
      blanks[step.id] && step.id !== currentId
        ? el('span', { class: 'blank-dot', role: 'img', 'aria-label': 'still has blanks' })
        : null,
    ));
  }
  return nav;
}

function noStory() {
  clearActionBar();
  const screen = el('div');
  add(screen, el('h2', { text: 'No story open' }));
  add(screen, explain(
    'This is where you build a story, one step at a time.',
    'Nothing is open at the moment. Pick one off your shelf, or start a new one, and the five steps appear here.',
  ));
  add(screen, add(
    el('p', { class: 'empty' }),
    icon('empty-shelf', { size: 48 }),
    document.createTextNode('Pick a story from your shelf, or start a new one.'),
  ));
  add(screen, el('p'), el('a', { class: 'button', href: '#/stories', text: 'Go to your stories' }));
  return screen;
}
