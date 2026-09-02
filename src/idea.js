// Step 1 — the Idea: one sentence, and the die that finds you one.
//
// The booklet's permission P4 governs this screen: roll as often as you like, at no cost, until a
// Prompt card gives you something. Nothing here is ever refused.

import { el, add, clear, randomInt, debounce, isBlank, nowIso } from './core.js';
import { actionBar, cardFace, exampleLine } from './ui.js';
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

  // ---- the sentence -------------------------------------------------------
  add(wrap, el('h3', { text: IDEA_CARD.starter }));
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
  add(wrap, field);
  add(wrap, el('p', { class: 'note', text: 'One sentence is plenty. It is the heart of the story — everything else grows around it.' }));

  // ---- the die ------------------------------------------------------------
  const dieArea = el('div', { class: 'die-area' });
  add(wrap, el('h3', { text: 'No idea yet?' }));
  add(wrap, el('p', { class: 'note', text: 'Roll the die. Each face sends you to one of the six Prompt cards. If it gives you nothing, roll again — you can do that as many times as you like.' }));
  add(wrap, dieArea);
  add(wrap, rollHistory(current));

  const showPrompt = (letter) => {
    const prompt = PROMPTS.find((p) => p.letter === letter);
    clear(dieArea);
    add(dieArea, promptPanel(prompt, () => roll()));
    dieArea.querySelector('.die-letter')?.focus();
  };

  const roll = () => {
    const letter = DIE_FACES[randomInt(DIE_FACES.length)];
    // Roll once, store it, render from the stored value — never re-roll on a re-render.
    current = saveStory({
      ...current,
      idea: { ...current.idea, fromPrompt: letter, rolls: [...current.idea.rolls, { letter, ts: nowIso() }] },
    });
    showPrompt(letter);
    const history = wrap.querySelector('.roll-history');
    if (history) history.replaceWith(rollHistory(current));
    renderStoryHeader();
  };

  if (current.idea.fromPrompt) showPrompt(current.idea.fromPrompt);
  else add(dieArea, el('p', { class: 'note', text: 'Tap Roll the die below.' }));

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

function promptPanel(prompt, onRoll) {
  const panel = el('div', { class: 'prompt-panel', style: 'border-top-color: var(--group-prompt)' });
  add(panel, el('div', {
    class: 'die-letter', tabindex: '-1',
    'aria-live': 'polite',
    text: prompt.letter,
  }));
  add(panel, cardFace(prompt));
  add(panel, el('h3', { class: 'prompt-headline', text: prompt.headline }));
  add(panel, el('p', { text: prompt.guidance }));

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

