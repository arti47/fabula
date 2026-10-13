// Step 1 — the Idea: one sentence, and the die that finds you one.
//
// The booklet's permission P4 governs this screen: roll as often as you like, at no cost, until a
// Prompt card gives you something. Nothing here is ever refused.

import { el, add, clear, randomInt, debounce, nowIso } from './core.js';
import { dealtFace, answerStage, teachingLine, dealerBar } from './ui.js';
import { PROMPTS, IDEA_CARD, DIE_FACES } from '../data.js';
import { ideaSparkSection } from './sparks.js';
import { saveStory } from './store.js';
import { dealNeighbours } from './derived.js';
import { icon } from './icons.js';
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

  // D53 — the Idea card is the first card dealt: its question, the sentence, one line of teaching
  // and the rest behind "?" (D57). The five open spark tables wait behind one bulb (D62).
  add(wrap, answerStage(dealtFace(IDEA_CARD, { deal: false }), [
    el('h2', { class: 'question-label', text: IDEA_CARD.headline }),
    el('p', { class: 'question-card-name', text: IDEA_CARD.starter }),
    field,
    ideaSparks(),
    teachingLine(IDEA_CARD, { examples: IDEA_CARD.examples }),
  ]));

  // ---- the die, on a table (D34) -------------------------------------------
  // This step's room is a die lying on a table. Before a roll the die is the biggest thing on the
  // screen and is itself the control; after one it moves to the corner of the Prompt card it
  // threw, which is where it already lived.
  const dieArea = el('div', { class: 'die-area die-table' });
  add(wrap, el('h3', { class: 'die-call', text: 'No idea yet? Roll the die.' }));
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
    // S16 — one short tick in the hand as the die lands (Android; iOS has no vibration API). Never
    // for anyone who has asked for less motion, and it carries nothing the screen does not say.
    if (navigator.vibrate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(20);
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
  }

  // The die is the control on the table, so Next is the one primary in the bar (D46).
  add(wrap, dealerBar({ prev: null, next: dealNeighbours(current, '#/build/idea').next }));

  return wrap;
}

function promptPanel(prompt, onRoll, { deal = false } = {}) {
  const panel = el('div', { class: 'prompt-panel', style: 'border-top-color: var(--group-prompt)' });
  // S11 — the die stays on the table after it is thrown, in the corner of the card it dealt, and
  // it is still the thing you throw: tapping it rolls again, as it did before the first roll.
  add(panel, el('button', {
    type: 'button', class: 'die-letter',
    'aria-live': 'polite',
    'aria-label': `You rolled ${prompt.letter}. Roll again`,
    text: prompt.letter,
    onclick: onRoll,
  }));
  add(panel, dealtFace(prompt, { deal }));
  add(panel, el('h3', { class: 'prompt-headline', text: prompt.headline }));
  add(panel, teachingLine(prompt, { examples: prompt.examples }));
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


/**
 * The Idea screen's open spark tables (house aid, §2.1) behind one bulb (D62): five buttons and a
 * line of fragments were a second screen's worth of things to look at under the first question.
 */
function ideaSparks() {
  const box = el('div', { class: 'idea-sparks' });
  let section = null;
  const toggle = add(el('button', {
    type: 'button', class: 'button secondary spark-bulb', 'aria-expanded': 'false',
    onclick: () => {
      // Made when asked for, gone when closed: a hidden section is still words in the document.
      if (section) { section.remove(); section = null; } else { section = ideaSparkSection(); box.append(section); }
      toggle.setAttribute('aria-expanded', String(Boolean(section)));
    },
  }), icon('bulb', { size: 20 }), el('span', { text: 'Stuck?' }));
  return add(box, toggle);
}
