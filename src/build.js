// The guided five-step path and its section nav. Steps land in later phases; this is the frame
// they hang on, and it already carries the escapes the booklet grants (P1, P2, P5, P9).

import { el, add } from './core.js';
import { explain, actionBar, clearActionBar } from './ui.js';
import { STEPS } from '../data.js';
import { getCurrentStory } from './store.js';
import { blankSteps, progress } from './derived.js';
import { ideaStep } from './idea.js';
import { ingredientsGrid, ingredientQuestion } from './ingredients.js';

const STEP_BLURB = {
  idea: 'One sentence about what your story is. Roll the die if you have not got one.',
  ingredients: 'Who is in it, who is against them, where it happens, and the thing that starts it all.',
  structure: 'The nine beats, from “once upon a time” to “in the end”.',
  boost: 'Ten questions that make the story better — none of them compulsory.',
  tell: 'Read the whole thing back, before and after the boosts.',
};

export function buildScreen({ step, entryId, qIndex = 0 }) {
  const story = getCurrentStory();
  if (!story) return noStory();

  const current = STEPS.find((s) => s.id === step) || STEPS[0];
  const blanks = blankSteps(story);
  const screen = el('div');

  add(screen, stepNav(current.id, blanks));
  add(screen, el('h2', { text: `${current.n}. ${current.name}` }));
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

  add(screen, el('p', {
    class: 'empty',
    text: `This step is being built. ${STEP_BLURB[current.id]}`,
  }));

  const next = STEPS[STEPS.indexOf(current) + 1];
  add(screen, actionBar({
    context: contextLine(story, current.id),
    label: next ? `Next: ${next.name}` : 'Back to your stories',
    href: next ? next.route : '#/stories',
  }));
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

function contextLine(story, stepId) {
  const p = progress(story);
  if (stepId === 'ingredients') return `${p.ingredients.done} of ${p.ingredients.total} ingredients`;
  if (stepId === 'structure') return `${p.beats.done} of ${p.beats.total} beats`;
  if (stepId === 'boost') return `${p.boosts.done} of ${p.boosts.total} boosts`;
  if (stepId === 'idea') return p.idea ? 'You have an idea' : 'No idea yet — that is fine';
  return story.title;
}

function noStory() {
  clearActionBar();
  const screen = el('div');
  add(screen, el('h2', { text: 'No story open' }));
  add(screen, explain(
    'This is where you build a story, one step at a time.',
    'Nothing is open at the moment. Pick one off your shelf, or start a new one, and the five steps appear here.',
  ));
  add(screen, el('p', { class: 'empty', text: 'Pick a story from your shelf, or start a new one.' }));
  add(screen, el('p'), el('a', { class: 'button', href: '#/stories', text: 'Go to your stories' }));
  return screen;
}
