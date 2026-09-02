// Sparks — the house aid that sits under every field (CLAUDE.md §2.2, D7).
//
// A spark is a fragment, not an answer. Three at a time, tap one to drop it into the field where
// the cursor is, tap the button for three more. Every screen that shows one says it is ours and not
// the deck's.

import { el, add, clear, randomInt, isBlank } from './core.js';
import { IDEA_SPARKS, SPARK_PLACEHOLDERS, sparksFor } from '../data-sparks.js';

const HOW_MANY = 3;

/** What the story calls its hero, villain and world — or the generic word, until it names one. */
export function nameBook(story) {
  const named = (list) => list?.map((c) => c.answers?.name).find((n) => !isBlank(n));
  const cast = story?.cast || [];
  return {
    hero: named(cast.filter((c) => c.kind === 'hero')) || SPARK_PLACEHOLDERS.hero,
    villain: named(cast.filter((c) => c.kind === 'villain')) || SPARK_PLACEHOLDERS.villain,
    // The World card has no name field, so this one stays generic on purpose.
    world: SPARK_PLACEHOLDERS.world,
  };
}

/** Fill {hero}, {villain} and {world} from what the story has named so far. */
export function fillNames(row, story) {
  const names = nameBook(story);
  return row.replace(/\{(\w+)\}/g, (whole, key) => names[key] ?? SPARK_PLACEHOLDERS[key] ?? whole);
}

/** Three different rows, filled in. Fewer only if the table is smaller than three. */
export function drawSparks(key, story, count = HOW_MANY) {
  const rows = sparksFor(key);
  if (!rows) return [];
  const pool = [...rows];
  const drawn = [];
  while (drawn.length < Math.min(count, rows.length)) {
    drawn.push(...pool.splice(randomInt(pool.length), 1));
  }
  return drawn.map((row) => fillNames(row, story));
}

/**
 * The control under a field: one quiet button, three chips, and the house-aid label.
 * `onPick` receives the chosen fragment — the caller decides where it goes.
 */
export function sparkControl({ key, story, onPick }) {
  if (!sparksFor(key)) return null;

  const box = el('div', { class: 'sparks' });
  const list = el('div', { class: 'spark-row', role: 'group', 'aria-label': 'Suggestions' });
  const live = el('p', { class: 'sparks-live visually-hidden', 'aria-live': 'polite' });

  const roll = () => {
    clear(list);
    const drawn = drawSparks(key, story);
    for (const text of drawn) {
      add(list, el('button', {
        type: 'button', class: 'spark-chip', text,
        onclick: () => onPick(text),
      }));
    }
    live.textContent = `Three suggestions: ${drawn.join('; ')}`;
    // On a phone the chips land below the fold, so a tap would look like nothing happened.
    list.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  add(box, add(
    el('div', { class: 'sparks-head' }),
    el('button', {
      type: 'button', class: 'button secondary', text: 'Stuck? Three words',
      onclick: roll,
    }),
    el('span', { class: 'house-flag', text: 'ours, not the deck’s' }),
  ));
  add(box, list, live);
  return box;
}

/** Drop a fragment into a field at the cursor, and leave the cursor after it. */
export function insertAtCursor(field, text) {
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? field.value.length;
  const before = field.value.slice(0, start);
  const after = field.value.slice(end);
  const spacer = before && !/\s$/.test(before) ? ' ' : '';
  field.value = `${before}${spacer}${text}${after}`;
  const caret = (before + spacer + text).length;
  field.focus();
  field.setSelectionRange(caret, caret);
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Field plus its spark control, wired together — every answering screen uses this. */
export function fieldWithSparks(field, { key, story }) {
  const control = sparkControl({ key, story, onPick: (text) => insertAtCursor(field, text) });
  return control ? [field, control] : [field];
}

// ---------------------------------------------------------------------------
// The Idea screen's five open tables — no question has been asked yet there.
// ---------------------------------------------------------------------------

export function ideaSparkSection() {
  const box = el('div');
  add(box, el('h3', { text: 'Still stuck?' }));
  add(box, add(
    el('p', { class: 'note spark-note' }),
    document.createTextNode('A handful of words to knock something loose.'),
    el('span', { class: 'house-flag', text: 'ours, not the deck’s' }),
  ));

  const out = el('p', { class: 'spark-out', 'aria-live': 'polite' });
  const row = el('div', { class: 'spark-row' });
  for (const table of IDEA_SPARKS) {
    add(row, el('button', {
      type: 'button', class: 'button secondary', text: table.label,
      onclick: () => {
        out.textContent = `${table.prompt} ${table.rows[randomInt(table.rows.length)]}`;
      },
    }));
  }
  add(box, row, out);
  return box;
}
