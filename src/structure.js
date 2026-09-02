// Step 3 — Structure: the nine beats, from "once upon a time" to "in the end".
//
// Ruling A5: beat 2 (Call to Action) and the "Something happens" ingredient are one story fact with
// two homes. Beat 2 opens pre-filled from the ingredient and says where it came from; from then on
// the two go their own way, and editing the beat never rewrites the card.
//
// Ruling A9: the order is presentational. Any beat is answerable at any time, and blank is legal.

import { el, add, debounce, isBlank } from './core.js';
import { actionBar, cardFace, exampleLine, answerLayout } from './ui.js';
import { fieldWithSparks } from './sparks.js';
import { BEATS, getCard } from '../data.js';
import { saveStory } from './store.js';
import { renderStoryHeader } from './router.js';

export function beatText(story, n) {
  return story.beats?.[n]?.text || '';
}

/** What beat 2 would be pre-filled with, or '' if there is nothing to carry over (A5). */
export function incitingAsBeat2(story) {
  return story.inciting?.answers?.what || '';
}

export function writeBeat(story, n, text, extra = {}) {
  return {
    ...story,
    beats: { ...story.beats, [n]: { ...story.beats?.[n], text, updatedAt: new Date().toISOString(), ...extra } },
  };
}

/** Pre-fill beat 2 once, the first time it is opened with nothing in it (A5). */
export function prefillBeat2(story) {
  const beat = story.beats?.[2];
  if (beat && !isBlank(beat.text)) return null;              // already written — never overwrite
  if (beat?.prefilledFrom) return null;                      // already offered once
  const text = incitingAsBeat2(story);
  if (isBlank(text)) return null;
  return writeBeat(story, 2, text, { prefilledFrom: 'inciting' });
}

// ---------------------------------------------------------------------------
// The nine beats, listed
// ---------------------------------------------------------------------------

export function structureList(story) {
  const wrap = el('div');
  add(wrap, el('p', { class: 'note', text: 'Nine beats, in the order stories usually go. You can write them in any order you like, and leave any of them for later.' }));

  const list = el('ol', { class: 'beat-list' });
  for (const beat of BEATS) {
    const text = beatText(story, beat.n);
    const row = el('a', { class: 'beat-row', href: `#/build/structure/${beat.n}` });
    add(row, el('span', { class: 'beat-number', text: String(beat.n) }));
    add(row, add(
      el('span', { class: 'beat-body' }),
      add(
        el('span', { class: 'beat-headline' }),
        document.createTextNode(beat.headline),
        isBlank(text) ? el('span', { class: 'card-blank', role: 'img', 'aria-label': 'nothing written here yet' }) : null,
      ),
      el('span', { class: 'beat-name', text: beat.beatName }),
      isBlank(text) ? null : el('span', { class: 'beat-preview', text }),
    ));
    add(list, el('li', {}, row));
  }
  add(wrap, list);

  const written = BEATS.filter((b) => !isBlank(beatText(story, b.n))).length;
  const firstBlank = BEATS.find((b) => isBlank(beatText(story, b.n)));
  add(wrap, actionBar({
    context: `${written} of ${BEATS.length} written`,
    label: firstBlank ? `Write beat ${firstBlank.n}` : 'Next: Boost',
    href: firstBlank ? `#/build/structure/${firstBlank.n}` : '#/build/boost',
    secondary: firstBlank ? el('a', { class: 'button secondary', href: '#/build/boost', text: 'Boost' }) : null,
  }));
  return wrap;
}

// ---------------------------------------------------------------------------
// One beat
// ---------------------------------------------------------------------------

export function beatScreen(story, n, fromBoost) {
  const beat = BEATS.find((b) => b.n === n);
  if (!beat) {
    return add(
      el('div'),
      el('h3', { text: 'No such beat' }),
      el('p', { class: 'empty', text: 'The story has nine beats, numbered 1 to 9.' }),
      el('a', { class: 'button', href: '#/build/structure', text: 'Back to the nine beats' }),
    );
  }

  let current = story;
  if (beat.n === 2) {
    const prefilled = prefillBeat2(current);
    if (prefilled) {
      current = saveStory(prefilled);
      renderStoryHeader();
    }
  }

  const wrap = el('div');
  const boost = fromBoost ? getCard(fromBoost) : null;
  add(wrap, el('a', {
    class: 'back-link',
    href: boost ? `#/build/boost/${boost.id}` : '#/build/structure',
    text: boost ? `← Back to “${boost.headline}”` : '← All nine beats',
  }));
  if (boost) {
    add(wrap, el('p', { class: 'provenance', text: `You came here from a Boost card: ${boost.headline}` }));
  }

  const pips = el('nav', { class: 'pips', 'aria-label': 'Beats' });
  for (const b of BEATS) {
    add(pips, add(
      el('a', {
        class: 'pip', href: `#/build/structure/${b.n}`,
        'aria-current': b.n === n ? 'step' : null,
        'aria-label': `Beat ${b.n}: ${b.beatName}`,
      }),
      document.createTextNode(String(b.n)),
      isBlank(beatText(current, b.n)) ? el('span', { class: 'blank-dot' }) : null,
    ));
  }
  add(wrap, pips);

  const body = [];
  body.push(el('h2', { class: 'question-label', text: beat.headline }));
  body.push(el('p', { class: 'question-card-name', text: `Beat ${beat.n} · ${beat.beatName}` }));

  const field = el('textarea', {
    id: 'beat-text', 'aria-label': `Beat ${beat.n}: ${beat.beatName}`, rows: '5',
    placeholder: 'A sentence or two is plenty',
  });
  field.value = beatText(current, beat.n);
  const save = debounce(() => {
    // Editing beat 2 changes the beat, never the ingredient it was pre-filled from (A5).
    current = saveStory(writeBeat(current, beat.n, field.value));
    renderStoryHeader();
    const pip = pips.querySelectorAll('.pip')[beat.n - 1];
    const dot = pip.querySelector('.blank-dot');
    if (!isBlank(field.value) && dot) dot.remove();
    else if (isBlank(field.value) && !dot) add(pip, el('span', { class: 'blank-dot' }));
  }, 400);
  field.addEventListener('input', save);
  body.push(...fieldWithSparks(field, { key: `beat.${beat.n}`, story: current }));
  body.push(el('p', { text: beat.guidance }));

  if (beat.n === 2 && current.beats?.[2]?.prefilledFrom === 'inciting') {
    body.push(el('p', {
      class: 'provenance',
      text: 'This came from your “Something happens” card. Change it here as much as you like — the card stays as you wrote it.',
    }));
  }

  if (beat.example) {
    body.push(el(
      'details',
      { class: 'explain' },
      el('summary', { text: `How ${beat.example.ref} tells this beat` }),
      el('div', {}, el('p', { text: beat.example.text })),
    ));
  }
  if (beat.examples?.length) {
    body.push(el('h3', { text: 'Other stories at this moment' }));
    const list = el('ul');
    for (const ex of beat.examples) add(list, exampleLine(ex));
    body.push(list);
  }

  add(wrap, answerLayout(cardFace(beat), body));

  const next = BEATS.find((b) => b.n === n + 1);
  const prev = BEATS.find((b) => b.n === n - 1);
  add(wrap, actionBar({
    context: `Beat ${beat.n} of ${BEATS.length}`,
    label: boost ? 'Back to the boost' : (next ? `Next: ${next.beatName}` : 'Done — on to the Boosts'),
    href: boost ? `#/build/boost/${boost.id}` : (next ? `#/build/structure/${next.n}` : '#/build/boost'),
    secondary: prev
      ? el('a', { class: 'button secondary', href: `#/build/structure/${prev.n}`, text: 'Back' })
      : null,
  }));
  return wrap;
}
