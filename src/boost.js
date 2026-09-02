// Step 4 — Boost: ten questions that turn a draft into a story.
//
// Permissions this screen owes controls to:
//   P8  skip any boost, use none of them   — the grid, nothing required
//   P6  a boost may invent a new card      — "This gives me a new character" (D17)
//   P7  a boost may rewrite a beat         — "Go and change beat N", and back again (D17)
//   A8  the before-version is frozen here  — automatically, on first arrival, with a re-freeze
//                                            control that names what it would discard

import { el, add, debounce, isBlank } from './core.js';
import { actionBar, cardTile, cardFace, exampleLine, showToast, confirmModal, answerLayout } from './ui.js';
import { BOOSTS, BEATS, INGREDIENTS, getCard } from '../data.js';
import { saveStory, ensureSnapshot, takeSnapshot } from './store.js';
import { spawnedBy } from './derived.js';
import { addEntry } from './ingredients.js';
import { fieldWithSparks } from './sparks.js';
import { renderStoryHeader } from './router.js';

/** Collect nodes for the answer column, skipping nullish ones the way `add` does. */
function push(list, ...nodes) {
  for (const node of nodes.flat()) if (node != null && node !== false) list.push(node);
  return list;
}

function boostState(story, id) {
  return { answer: '', skipped: false, editedBeats: [], ...(story.boosts?.[id] || {}) };
}

function writeBoost(story, id, patch) {
  return { ...story, boosts: { ...story.boosts, [id]: { ...boostState(story, id), ...patch } } };
}

/** Freeze the draft on arrival, so "before the boosts" means something (A8). */
function snapshotOnEntry(story) {
  const frozen = ensureSnapshot(story);
  if (!frozen) return story;
  const saved = saveStory(frozen);
  renderStoryHeader();
  return saved;
}

// ---------------------------------------------------------------------------
// The grid of ten
// ---------------------------------------------------------------------------

export function boostGrid(story) {
  const current = snapshotOnEntry(story);
  const wrap = el('div');

  add(wrap, el('p', { class: 'note', text: 'Ten questions to make the story deeper. Use them in any order, and skip any you do not like — you do not have to answer them all.' }));

  if (current.snapshot) {
    add(wrap, el('p', {
      class: 'provenance',
      text: 'Your story as it was when you started boosting is saved. You will be able to read both versions on the Tell page.',
    }));
  }

  const grid = el('div', { class: 'card-grid' });
  for (const boost of BOOSTS) {
    const state = boostState(current, boost.id);
    const done = !isBlank(state.answer);
    add(grid, cardTile(boost, {
      href: `#/build/boost/${boost.id}`,
      sub: state.skipped ? 'Skipped' : (done ? 'Answered' : 'Not yet'),
      blank: !done && !state.skipped,
    }));
  }
  add(wrap, grid);

  const answered = BOOSTS.filter((b) => !isBlank(boostState(current, b.id).answer)).length;
  add(wrap, el('h3', { text: 'The before-version' }));
  add(wrap, el('p', { class: 'note', text: current.snapshot ? `Frozen when you started boosting.` : 'Nothing frozen yet.' }));
  add(wrap, el('button', {
    type: 'button', class: 'button danger', text: 'Re-freeze it to how the story is now',
    onclick: () => confirmModal({
      title: 'Replace the before-version?',
      message: 'The draft you had when you started boosting would be replaced by the story as it stands now. You could not get the old one back, and the Tell page would show the two versions as identical until you boost again.',
      confirmLabel: 'Replace it',
      onConfirm: () => {
        saveStory(takeSnapshot(current));
        showToast('Before-version replaced');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    }),
  }));

  add(wrap, actionBar({
    context: `${answered} of ${BOOSTS.length} answered — none of them are required`,
    label: 'Read my story',
    href: '#/build/tell',
  }));
  return wrap;
}

// ---------------------------------------------------------------------------
// One boost
// ---------------------------------------------------------------------------

export function boostScreen(story, boostId) {
  let current = snapshotOnEntry(story);
  const boost = getCard(boostId);
  if (!boost || boost.group !== 'boost') {
    return add(
      el('div'),
      el('h3', { text: 'No such boost' }),
      el('p', { class: 'empty', text: 'There are ten boost cards, and that is not one of them.' }),
      el('a', { class: 'button', href: '#/build/boost', text: 'Back to the boosts' }),
    );
  }

  const wrap = el('div');
  add(wrap, el('a', { class: 'back-link', href: '#/build/boost', text: '← All ten boosts' }));
  const body = [];
  push(body, el('h2', { class: 'question-label', text: boost.headline }));
  const state = boostState(current, boost.id);

  const field = el('textarea', {
    id: 'boost-answer', 'aria-label': boost.headline, rows: '4',
    placeholder: 'What does this change about your story?',
  });
  field.value = state.answer;
  const save = debounce(() => {
    current = saveStory(writeBoost(current, boost.id, { answer: field.value }));
    renderStoryHeader();
  }, 400);
  field.addEventListener('input', save);
  push(body, ...fieldWithSparks(field, { key: boost.id, story: current }));
  push(body, el('p', { text: boost.guidance }));

  // P8 — skipping is a control, and it is reversible.
  push(body, el('button', {
    type: 'button', class: 'button secondary',
    text: state.skipped ? 'Bring this one back' : 'Skip this one',
    onclick: () => {
      saveStory(writeBoost(current, boost.id, { skipped: !state.skipped }));
      showToast(state.skipped ? 'Back in the pile' : 'Skipped — nothing here is required');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
  }));

  // P6 — a boost may invent a new Ingredient card.
  if (boost.canSpawn.length) {
    push(body, el('h3', { text: 'Does this give you somebody new?' }));
    push(body, el('p', { class: 'note', text: 'In the book, this is the card that invents a whole new character — and the story gets better for it. Make one here and it joins your ingredients.' }));
    const row = el('div', { class: 'row-actions' });
    for (const kind of boost.canSpawn) {
      const card = INGREDIENTS.find((i) => i.kind === kind);
      add(row, el('button', {
        type: 'button', class: 'button',
        text: kind === 'hero' ? 'This gives me a new character' : 'This gives me another antagonist',
        onclick: () => {
          // The card records which boost made it; nothing else needs to.
          const { story: next, id } = addEntry(current, kind, `boost:${boost.id}`);
          saveStory(next);
          showToast(`New ${card.headline.toLowerCase()} added`);
          location.hash = `#/build/ingredients/${id}`;
        },
      }));
    }
    push(body, row);
  }

  const made = spawnedBy(current, boost.id);
  if (made.length) {
    push(body, el('h3', { text: 'Made from this card' }));
    const list = el('ul');
    for (const entry of made) {
      const label = entry.answers?.name || (entry.kind === 'villain' ? 'A new antagonist' : 'A new main character');
      add(list, el('li', {}, el('a', { class: 'back-link', href: `#/build/ingredients/${entry.id}`, text: `${label} →` })));
    }
    push(body, list);
  }

  // P7 — a boost may send you back to rewrite a beat.
  if (boost.suggestsBeats.length) {
    push(body, el('h3', { text: 'Does a beat need changing?' }));
    const row = el('div', { class: 'row-actions' });
    for (const n of boost.suggestsBeats) {
      const beat = BEATS.find((b) => b.n === n);
      add(row, el('button', {
        type: 'button', class: 'button secondary',
        text: `Change beat ${n}: ${beat.beatName}`,
        onclick: () => {
          const marked = state.editedBeats.includes(n) ? state.editedBeats : [...state.editedBeats, n];
          saveStory(writeBoost(current, boost.id, { editedBeats: marked }));
          location.hash = `#/build/structure/${n}/from/${boost.id}`;
        },
      }));
    }
    push(body, row);
  }

  if (state.editedBeats.length) {
    push(body, el('p', {
      class: 'provenance',
      text: `Because of this card you went back to beat${state.editedBeats.length > 1 ? 's' : ''} ${state.editedBeats.join(', ')}.`,
    }));
  }

  if (boost.examples?.length) {
    push(body, el('h3', { text: 'How other stories answer it' }));
    const list = el('ul');
    for (const ex of boost.examples) add(list, exampleLine(ex));
    push(body, list);
  }

  add(wrap, answerLayout(cardFace(boost), body));

  const index = BOOSTS.findIndex((b) => b.id === boost.id);
  const next = BOOSTS[index + 1];
  add(wrap, actionBar({
    context: `Boost ${index + 1} of ${BOOSTS.length}`,
    label: next ? 'Next boost' : 'Read my story',
    href: next ? `#/build/boost/${next.id}` : '#/build/tell',
    secondary: index > 0
      ? el('a', { class: 'button secondary', href: `#/build/boost/${BOOSTS[index - 1].id}`, text: 'Back' })
      : null,
  }));
  return wrap;
}
