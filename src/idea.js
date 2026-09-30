// Step 1 — the Idea: one sentence, and the die that finds you one.
//
// The booklet's permission P4 governs this screen: roll as often as you like, at no cost, until a
// Prompt card gives you something. Nothing here is ever refused.

import { el, add, clear, randomInt, debounce, isBlank, nowIso } from './core.js';
import { actionBar, zoomableFace, dealtFace, exampleLine, answerLayout } from './ui.js';
import { PROMPTS, IDEA_CARD, DIE_FACES } from '../data.js';
import { ideaSparkSection } from './sparks.js';
import { saveStory } from './store.js';
import { renderStoryHeader } from './router.js';

export function ideaStep(story) {
  const wrap = el('div');
  let current = story; // the working copy this screen saves from

  const save = debounce((patch) => {
    current = saveStory({ ...current, ...patch });
    renderStoryHeader();
  }, 400);

  // ---- the sentence, beside the card the book hands you first ---------------
  const field = el('textarea', {
    id: 'idea-text',
    'aria-label': 'Your idea',
    placeholder: 'a panda who wants to learn kung fu…',
    rows: '3',
  });
  field.value = current.idea.text || '';
  field.addEventListener('input', () => {
    save({ idea: { ...current.idea, text: field.value } });
  });

  const ideaExamples = el('ul');
  for (const ex of IDEA_CARD.examples) add(ideaExamples, exampleLine(ex));

  add(wrap, answerLayout(zoomableFace(IDEA_CARD), [
    el('h2', { class: 'question-label', text: IDEA_CARD.headline }),
    el('p', { class: 'question-card-name', text: IDEA_CARD.starter }),
    field,
    el('p', { class: 'guidance', text: IDEA_CARD.guidance }),
    el('details', { class: 'explain' },
      el('summary', { text: 'What other stories started as' }),
      el('div', {}, ideaExamples)),
  ]));

  // ---- the die, on a table (D34) -------------------------------------------
  // This step's room is a die lying on a table. Before a roll the die is the biggest thing on the
  // screen and is itself the control; after one it moves to the corner of the Prompt card it
  // threw, which is where it already lived.
  const dieArea = el('div', { class: 'die-area die-table' });
  add(wrap, el('h3', { text: 'No idea yet?' }));
  add(wrap, el('p', { class: 'note', text: 'Roll the die. Each face sends you to one of the six Prompt cards. If it gives you nothing, roll again — you can do that as many times as you like.' }));
  add(wrap, dieArea);
  add(wrap, rollHistory(current));

  const showPrompt = (letter, { tumble = false } = {}) => {
    const prompt = PROMPTS.find((p) => p.letter === letter);
    clear(dieArea);
    // Thrown, the card is dealt face-down and turned over; merely shown again, it is just there.
    add(dieArea, promptPanel(prompt, () => roll(), { deal: tumble }));
    const die = dieArea.querySelector('.die-letter');
    die?.focus();
    // The die tumbles when it is thrown, never when a stored roll is simply shown again (D24).
    if (die && tumble) {
      die.classList.add('is-rolling');
      die.addEventListener('animationend', () => die.classList.remove('is-rolling'), { once: true });
    }
  };

  const roll = () => {
    const letter = DIE_FACES[randomInt(DIE_FACES.length)];
    // Roll once, store it, render from the stored value — never re-roll on a re-render.
    current = saveStory({
      ...current,
      idea: { ...current.idea, fromPrompt: letter, rolls: [...current.idea.rolls, { letter, ts: nowIso() }] },
    });
    showPrompt(letter, { tumble: true });
    const history = wrap.querySelector('.roll-history');
    if (history) history.replaceWith(rollHistory(current));
    renderStoryHeader();
  };

  if (current.idea.fromPrompt) showPrompt(current.idea.fromPrompt);
  else {
    // An untouched table with one die on it. The die is a button rather than a picture beside a
    // button: the thing you want to touch is the thing you touch.
    add(dieArea, el('button', {
      type: 'button', class: 'die-letter die-big', 'aria-label': 'Roll the die',
      text: '?', onclick: () => roll(),
    }));
    add(dieArea, el('p', { class: 'note', text: 'Tap the die, or Roll the die below.' }));
  }

  // ---- sparks (house aid) -------------------------------------------------
  add(wrap, ideaSparkSection());

  add(wrap, actionBar({
    context: isBlank(current.idea.text) ? 'No idea written yet — that is fine' : 'Idea saved',
    label: 'Roll the die',
    onClick: roll,
    secondary: el('a', { class: 'button secondary', href: '#/build/ingredients', text: 'Next' }),
  }));

  return wrap;
}

function promptPanel(prompt, onRoll, { deal = false } = {}) {
  const panel = el('div', { class: 'prompt-panel', style: 'border-top-color: var(--group-prompt)' });
  add(panel, el('div', {
    class: 'die-letter', tabindex: '-1',
    'aria-live': 'polite',
    text: prompt.letter,
  }));
  add(panel, dealtFace(prompt, { deal }));
  add(panel, el('h3', { class: 'prompt-headline', text: prompt.headline }));
  add(panel, el('p', { class: 'guidance', text: prompt.guidance }));

  const list = el('ul');
  for (const ex of prompt.examples) add(list, exampleLine(ex));
  add(panel, list);

  add(panel, el('button', {
    type: 'button', class: 'button secondary', text: 'Roll again',
    onclick: onRoll,
  }));
  return panel;
}

function rollHistory(story) {
  const rolls = story.idea.rolls || [];
  const box = el('div', { class: 'roll-history note' });
  if (!rolls.length) return box;
  add(box, document.createTextNode(
    rolls.length === 1 ? 'You have rolled once: ' : `You have rolled ${rolls.length} times: `,
  ));
  add(box, el('b', { text: rolls.map((r) => r.letter).join(' · ') }));
  return box;
}

