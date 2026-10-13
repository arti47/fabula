// Step 3 — Structure: the nine beats, from "once upon a time" to "in the end".
//
// Ruling A5: beat 2 (Call to Action) and the "Something happens" ingredient are one story fact with
// two homes. Beat 2 opens pre-filled from the ingredient and says where it came from; from then on
// the two go their own way, and editing the beat never rewrites the card.
//
// Ruling A9: the order is presentational. Any beat is answerable at any time, and blank is legal.

import { el, add, debounce, isBlank } from './core.js';
import { actionBar, dealtFace, answerStage, burst, teachingLine, optionsSheet, dealerBar } from './ui.js';
import { fieldWithSparks } from './sparks.js';
import { BEATS, getCard } from '../data.js';
import { saveStory } from './store.js';
import { dealNeighbours } from './derived.js';
import { renderStoryHeader } from './router.js';

export function beatText(story, n) {
  return story.beats?.[n]?.text || '';
}

/** The beat the deck says carries an ingredient over, read from the card rather than hardcoded. */
export const PREFILLED_BEAT = BEATS.find((b) => b.prefillFrom) || null;

/** What that beat would be pre-filled with, or '' if there is nothing to carry over (A5). */
export function incitingAsBeat2(story) {
  if (!PREFILLED_BEAT) return '';
  return story[PREFILLED_BEAT.prefillFrom]?.answers?.what || '';
}

export function writeBeat(story, n, text, extra = {}) {
  return {
    ...story,
    beats: { ...story.beats, [n]: { ...story.beats?.[n], text, updatedAt: new Date().toISOString(), ...extra } },
  };
}

/** Pre-fill that beat once, the first time it is opened with nothing in it (A5). */
export function prefillBeat2(story) {
  if (!PREFILLED_BEAT) return null;
  const existing = story.beats?.[PREFILLED_BEAT.n];
  if (existing && !isBlank(existing.text)) return null;      // already written — never overwrite
  if (existing?.prefilledFrom) return null;                  // already offered once
  const text = incitingAsBeat2(story);
  if (isBlank(text)) return null;
  return writeBeat(story, PREFILLED_BEAT.n, text, { prefilledFrom: PREFILLED_BEAT.prefillFrom });
}

// ---------------------------------------------------------------------------
// The nine beats, listed
// ---------------------------------------------------------------------------

export function structureList(story) {
  const wrap = el('div');

  const list = el('ol', { class: 'beat-list' });
  for (const beat of BEATS) {
    const text = beatText(story, beat.n);
    // A frame on a board, not a row in a list: the beat's own card sits behind what you wrote on
    // it, so the nine of them read as one arc rather than nine paragraphs (D30, amended).
    const row = el('a', { class: `beat-row${isBlank(text) ? '' : ' is-written'}`, href: `#/build/structure/${beat.n}` });
    const art = el('img', {
      class: 'frame-art', alt: '', loading: 'lazy', decoding: 'async',
      src: `assets/cards/${beat.art}.webp`,
    });
    art.addEventListener('error', () => art.remove());
    add(row, art);
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

  const firstBlank = BEATS.find((b) => isBlank(beatText(story, b.n)));
  add(wrap, actionBar({
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
  if (PREFILLED_BEAT && beat.n === PREFILLED_BEAT.n) {
    const prefilled = prefillBeat2(current);
    if (prefilled) {
      current = saveStory(prefilled);
      renderStoryHeader();
    }
  }

  const wrap = el('div');
  const boost = fromBoost ? getCard(fromBoost) : null;
  // P7 — a Boost sent you here, so the way back to it stays on the card.
  if (boost) {
    add(wrap, el('a', { class: 'back-link', href: `#/build/boost/${boost.id}`, text: `← Back to “${boost.headline}”` }));
  }

  const pips = el('nav', { class: 'pips', 'aria-label': 'Beats' });
  for (const b of BEATS) {
    add(pips, add(
      el('a', {
        class: `pip${isBlank(beatText(current, b.n)) ? ' is-blank' : ''}`, href: `#/build/structure/${b.n}`,
        'aria-current': b.n === n ? 'step' : null,
        'aria-label': `Beat ${b.n}: ${b.beatName}`,
      }),
      document.createTextNode(String(b.n)),
      isBlank(beatText(current, b.n)) ? el('span', { class: 'blank-dot' }) : null,
    ));
  }

  const body = [];
  body.push(el('h2', { class: 'question-label', text: beat.headline }));
  body.push(el('p', { class: 'question-card-name', text: `Beat ${beat.n} · ${beat.beatName}` }));

  const field = el('textarea', {
    id: 'beat-text', 'aria-label': `Beat ${beat.n}: ${beat.beatName}`, rows: '4',
    placeholder: 'A sentence or two is plenty',
  });
  field.value = beatText(current, beat.n);
  const save = debounce(() => {
    // D36: the ninth beat is the only moment in the app worth marking, and it is marked on the
    // transition — the write that leaves nothing blank — never on merely opening a finished
    // story. Read before the write, so "was it already whole?" is answerable.
    const wasWhole = BEATS.every((b) => !isBlank(beatText(current, b.n)));
    // Editing beat 2 changes the beat, never the ingredient it was pre-filled from (A5).
    current = saveStory(writeBeat(current, beat.n, field.value));
    if (!wasWhole && BEATS.every((b) => !isBlank(beatText(current, b.n)))) burst();
    renderStoryHeader();
    const pip = pips.querySelectorAll('.pip')[beat.n - 1];
    const dot = pip.querySelector('.blank-dot');
    if (!isBlank(field.value) && dot) dot.remove();
    else if (isBlank(field.value) && !dot) add(pip, el('span', { class: 'blank-dot' }));
    pip.classList.toggle('is-blank', isBlank(field.value));
  }, 400);
  field.addEventListener('input', save);
  body.push(...fieldWithSparks(field, { key: `beat.${beat.n}`, story: current }));

  if (PREFILLED_BEAT && beat.n === PREFILLED_BEAT.n && current.beats?.[beat.n]?.prefilledFrom) {
    body.push(el('p', {
      class: 'provenance',
      text: 'This came from your “Something happens” card. Change it here as much as you like — the card stays as you wrote it.',
    }));
  }

  // The teaching, one line on the card; the rest and every worked example behind "?" (D57).
  body.push(teachingLine(beat, {
    examples: beat.examples || [],
    answer: beat.example ? { title: `How ${beat.example.ref} tells this beat`, text: beat.example.text } : null,
  }));
  body.push(pips);

  add(wrap, answerStage(dealtFace(beat, { deal: true }), body));

  if (boost) {
    // Sent here by a Boost (P7): the only way forward is back to it.
    add(wrap, dealerBar({
      prev: null,
      next: { route: `#/build/boost/${boost.id}`, label: boost.headline },
      nextText: 'Back to the boost',
    }));
  } else {
    const deal = dealNeighbours(current, location.hash);
    add(wrap, dealerBar({
      prev: deal.prev,
      next: deal.next,
      options: () => optionsSheet(`Beat ${beat.n}`, [{ label: 'See all nine beats', href: '#/build/structure' }]),
    }));
  }
  return wrap;
}
