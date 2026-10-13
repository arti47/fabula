// Step 4 — Boost: ten questions that turn a draft into a story.
//
// Permissions this screen owes controls to:
//   P8  skip any boost, use none of them   — the grid, nothing required
//   P6  a boost may invent a new card      — "This gives me a new character" (D17)
//   P7  a boost may rewrite a beat         — "Go and change beat N", and back again (D17)
//   A8  the before-version is frozen here  — automatically, on first arrival, with a re-freeze
//                                            control that names what it would discard

import { el, add, debounce, isBlank } from './core.js';
import { actionBar, cardTile, dealtFace, showToast, confirmModal, answerStage, teachingLine, optionsSheet, dealerBar } from './ui.js';
import { BOOSTS, BEATS, INGREDIENTS, getCard } from '../data.js';
import { saveStory, ensureSnapshot, takeSnapshot } from './store.js';
import { spawnedBy, dealNeighbours } from './derived.js';
import { addEntry } from './ingredients.js';
import { fieldWithSparks } from './sparks.js';
import { icon } from './icons.js';
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


  // D34 — this step's room is a hand of cards, fanned. The ten Boosts have no order and no arc
  // (unlike the nine beats), so overlapping them the way you would hold them costs nothing and
  // is the one shape that could not be mistaken for the Ingredients bench. It keeps the
  // `card-grid` class because it is still the same ten tiles: the fan is a layout over them.
  const grid = el('div', { class: 'card-grid boost-fan' });
  BOOSTS.forEach((boost, i) => {
    const state = boostState(current, boost.id);
    const done = !isBlank(state.answer);
    add(grid, cardTile(boost, {
      href: `#/build/boost/${boost.id}`,
      sub: state.skipped ? 'Skipped' : null,
      blank: !done && !state.skipped,
      done,
    }));
    // The card's place in the hand: negative on the left of the fan, positive on the right.
    grid.lastChild.style.setProperty('--seat', String(i - (BOOSTS.length - 1) / 2));
  });
  add(wrap, grid);

  // A8 — the before-version, at the end of the scroll: one line saying it exists, and the one
  // destructive control, which confirms and names what it discards.
  add(wrap, el('p', { class: 'note before-note', text: current.snapshot ? 'Your story from before the boosts is saved, to read beside the new one.' : 'Nothing frozen yet.' }));
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
  if (state.skipped) push(body, el('p', { class: 'provenance', text: 'Skipped for now — ⋯ brings it back.' }));

  // P6 and P7 are what this step is for, so they stay on the card — as at most two small chips,
  // each opening the choices it stands for, rather than four sentence-long buttons (D56).
  const powers = el('div', { class: 'card-powers' });
  if (boost.canSpawn.length) {
    add(powers, add(el('button', {
      type: 'button', class: 'button secondary chip-action',
      onclick: () => optionsSheet('Somebody new', boost.canSpawn.map((kind) => {
        const card = INGREDIENTS.find((i) => i.kind === kind);
        return {
          label: kind === 'hero' ? 'This gives me a new character' : 'This gives me another antagonist',
          onClick: () => {
            // The card records which boost made it; nothing else needs to.
            const { story: next, id } = addEntry(current, kind, `boost:${boost.id}`);
            saveStory(next);
            showToast(`New ${card.headline.toLowerCase()} added`);
            location.hash = `#/build/ingredients/${id}`;
          },
        };
      })),
    }), icon('plus', { size: 18 }), el('span', { text: 'Somebody new' })));
  }
  if (boost.suggestsBeats.length) {
    add(powers, add(el('button', {
      type: 'button', class: 'button secondary chip-action',
      onclick: () => optionsSheet('Change a beat', boost.suggestsBeats.map((n) => {
        const beat = BEATS.find((b) => b.n === n);
        return {
          label: `Change beat ${n}: ${beat.beatName}`,
          onClick: () => {
            const marked = state.editedBeats.includes(n) ? state.editedBeats : [...state.editedBeats, n];
            saveStory(writeBoost(current, boost.id, { editedBeats: marked }));
            location.hash = `#/build/structure/${n}/from/${boost.id}`;
          },
        };
      })),
    }), icon('build', { size: 18 }), el('span', { text: 'Change a beat' })));
  }
  if (powers.childNodes.length) push(body, powers);

  // P6, listed back: what this card has made so far.
  const made = spawnedBy(current, boost.id);
  if (made.length) {
    const list = el('p', { class: 'provenance made-from' });
    add(list, document.createTextNode('Made from this card: '));
    made.forEach((entry, i) => {
      const label = entry.answers?.name || (entry.kind === 'villain' ? 'a new antagonist' : 'a new main character');
      if (i) add(list, document.createTextNode(', '));
      add(list, el('a', { href: `#/build/ingredients/${entry.id}`, text: label }));
    });
    push(body, list);
  }

  if (state.editedBeats.length) {
    push(body, el('p', {
      class: 'provenance',
      text: `Because of this card you went back to beat${state.editedBeats.length > 1 ? 's' : ''} ${state.editedBeats.join(', ')}.`,
    }));
  }

  // The teaching, one line on the card; the rest and the examples behind "?" (D57).
  push(body, teachingLine(boost, { examples: boost.examples || [] }));

  add(wrap, answerStage(dealtFace(boost, { deal: true }), body));

  const deal = dealNeighbours(current, location.hash);
  add(wrap, dealerBar({
    prev: deal.prev,
    next: deal.next,
    // P8 — skipping is a control, and it is reversible; it lives behind ⋯ with the way to all ten.
    options: () => optionsSheet(boost.headline, [
      {
        label: state.skipped ? 'Bring this one back' : 'Skip this one',
        onClick: () => {
          saveStory(writeBoost(current, boost.id, { skipped: !state.skipped }));
          showToast(state.skipped ? 'Back in the pile' : 'Skipped — nothing here is required');
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        },
      },
      { label: 'See all ten boosts', href: '#/build/boost' },
    ]),
  }));
  return wrap;
}
