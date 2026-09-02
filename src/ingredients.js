// Step 2 — Ingredients: the main character, the antagonist, the world, and the thing that happens.
//
// Permissions this screen owes controls to:
//   P2  any order            — the grid, not a queue
//   P3  the same card twice  — "Add another" on hero, villain and world, uncapped
//   P1  skip a card          — "Skip this one for now", reversible
//   P5  leave it blank       — Next never refuses; blanks are counted, never blocked
//
// Answering is one question at a time (product decision), but the questions themselves are
// reachable in any order from the pips, so the permission survives the format.

import { el, add, uid, debounce, isBlank } from './core.js';
import { actionBar, cardTile, cardFace, showToast, answerLayout, confirmModal } from './ui.js';
import { fieldWithSparks } from './sparks.js';
import { INGREDIENTS } from '../data.js';
import { saveStory, removeEntry } from './store.js';
import { hasAnyAnswer } from './derived.js';
import { renderStoryHeader } from './router.js';

// ---------------------------------------------------------------------------
// Entries: one record per answered card. `inciting` is the singleton (not repeatable).
// ---------------------------------------------------------------------------

function entriesFor(story, kind) {
  if (kind === 'event') return [{ id: 'inciting', kind, answers: story.inciting.answers || {} }];
  if (kind === 'world') return story.worlds.map((w) => ({ ...w, kind: 'world' }));
  return story.cast.filter((c) => c.kind === kind);
}

function findEntry(story, entryId) {
  if (entryId === 'inciting') {
    return { entry: { id: 'inciting', kind: 'event', answers: story.inciting.answers || {} }, card: INGREDIENTS.find((i) => i.kind === 'event') };
  }
  const cast = story.cast.find((c) => c.id === entryId);
  if (cast) return { entry: cast, card: INGREDIENTS.find((i) => i.kind === cast.kind) };
  const world = story.worlds.find((w) => w.id === entryId);
  if (world) return { entry: { ...world, kind: 'world' }, card: INGREDIENTS.find((i) => i.kind === 'world') };
  return { entry: null, card: null };
}

function writeAnswer(story, entryId, key, value) {
  if (entryId === 'inciting') {
    return { ...story, inciting: { ...story.inciting, answers: { ...story.inciting.answers, [key]: value } } };
  }
  if (story.cast.some((c) => c.id === entryId)) {
    return {
      ...story,
      cast: story.cast.map((c) => (c.id === entryId ? { ...c, answers: { ...c.answers, [key]: value } } : c)),
    };
  }
  return {
    ...story,
    worlds: story.worlds.map((w) => (w.id === entryId ? { ...w, answers: { ...w.answers, [key]: value } } : w)),
  };
}

/** Create an entry of this kind and hand back the story and the new id. */
export function addEntry(story, kind, origin = 'ingredients') {
  const id = uid(kind);
  if (kind === 'world') return { story: { ...story, worlds: [...story.worlds, { id, answers: {} }] }, id };
  return { story: { ...story, cast: [...story.cast, { id, kind, answers: {}, origin }] }, id };
}

function entryLabel(card, entry, index, total) {
  const named = entry.answers?.name || entry.answers?.whereWhen;
  if (!isBlank(named)) return named;
  return total > 1 ? `${card.headline} ${index + 1}` : card.headline;
}

// ---------------------------------------------------------------------------
// The grid — four cards, any order
// ---------------------------------------------------------------------------

export function ingredientsGrid(story) {
  const wrap = el('div');
  let current = story;

  for (const card of INGREDIENTS) {
    const entries = entriesFor(current, card.kind);
    const skipped = current.skipped.includes(card.id);

    add(wrap, el('h3', { text: card.headline }));
    add(wrap, el('p', { class: 'note', text: card.guidance }));

    if (skipped) {
      add(wrap, add(
        el('p', { class: 'empty' }),
        document.createTextNode('Skipped for now. '),
        el('button', {
          type: 'button', class: 'button secondary', text: 'Bring it back',
          onclick: () => {
            saveStory({ ...current, skipped: current.skipped.filter((s) => s !== card.id) });
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          },
        }),
      ));
      continue;
    }

    const grid = el('div', { class: 'card-grid' });
    entries.forEach((entry, i) => {
      const answered = Object.values(entry.answers || {}).filter((v) => !isBlank(v)).length;
      add(grid, cardTile(card, {
        href: `#/build/ingredients/${entry.id}`,
        sub: `${answered} of ${card.questions.length} answered`,
        blank: !hasAnyAnswer(entry),
      }));
      const tile = grid.lastChild;
      tile.querySelector('.card-headline').textContent = entryLabel(card, entry, i, entries.length);
    });

    if (!entries.length) {
      add(grid, cardTile(card, { href: `#/build/ingredients/new-${card.kind}`, sub: 'Nothing written yet', blank: true }));
    }
    add(wrap, grid);

    const row = el('div', { class: 'row-actions' });
    if (card.repeatable && entries.length) {
      add(row, el('button', {
        type: 'button', class: 'button secondary',
        text: card.kind === 'world' ? 'Add another world' : `Add another ${card.kind === 'hero' ? 'main character' : 'antagonist'}`,
        onclick: () => {
          const { story: next, id } = addEntry(current, card.kind);
          saveStory(next);
          location.hash = `#/build/ingredients/${id}`;
        },
      }));
    }
    add(row, el('button', {
      type: 'button', class: 'button secondary', text: 'Skip this one for now',
      onclick: () => {
        saveStory({ ...current, skipped: [...current.skipped, card.id] });
        showToast('Skipped — you can bring it back any time');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    }));
    add(wrap, row);
  }

  add(wrap, actionBar({
    context: 'Answer them in any order — or none of them yet',
    label: 'Next: Structure',
    href: '#/build/structure',
  }));
  return wrap;
}

// ---------------------------------------------------------------------------
// One question at a time
// ---------------------------------------------------------------------------

export function ingredientQuestion(story, entryId, qIndex) {
  let current = story;

  // "new-hero" and friends: create on arrival so a tap on an empty card just works.
  if (entryId.startsWith('new-')) {
    const kind = entryId.slice(4);
    const { story: next, id } = addEntry(current, kind);
    saveStory(next);
    location.replace(`#/build/ingredients/${id}`);
    return el('div');
  }

  const { entry, card } = findEntry(current, entryId);
  if (!entry) {
    return add(
      el('div'),
      el('h3', { text: 'That card is gone' }),
      el('p', { class: 'empty', text: 'It may have been deleted. Go back and pick another.' }),
      el('a', { class: 'button', href: '#/build/ingredients', text: 'Back to the ingredients' }),
    );
  }

  const index = Math.min(Math.max(qIndex, 0), card.questions.length - 1);
  const question = card.questions[index];
  const wrap = el('div');

  add(wrap, el('a', { class: 'back-link', href: '#/build/ingredients', text: '← All four ingredients' }));
  add(wrap, el('h3', { class: 'question-card-name', text: card.headline }));

  // Pips: every question reachable in any order (P2 inside the card).
  const pips = el('nav', { class: 'pips', 'aria-label': 'Questions' });
  card.questions.forEach((q, i) => {
    add(pips, add(
      el('a', {
        class: 'pip', href: `#/build/ingredients/${entryId}/${i}`,
        'aria-current': i === index ? 'step' : null,
        'aria-label': `Question ${i + 1}: ${q.label}`,
      }),
      document.createTextNode(String(i + 1)),
      isBlank(entry.answers?.[q.key]) ? el('span', { class: 'blank-dot' }) : null,
    ));
  });
  add(wrap, pips);

  const body = [];
  body.push(el('h2', { class: 'question-label', text: question.label }));
  if (question.hint) body.push(el('p', { class: 'note', text: question.hint }));

  const field = el('textarea', {
    id: 'answer', 'aria-label': question.label, rows: '3',
    placeholder: 'A few words is plenty',
  });
  field.value = entry.answers?.[question.key] || '';
  const save = debounce(() => {
    current = saveStory(writeAnswer(current, entryId, question.key, field.value));
    renderStoryHeader();
    const pip = pips.querySelectorAll('.pip')[index];
    const dot = pip.querySelector('.blank-dot');
    if (!isBlank(field.value) && dot) dot.remove();
    else if (isBlank(field.value) && !dot) add(pip, el('span', { class: 'blank-dot' }));
  }, 400);
  field.addEventListener('input', save);
  body.push(...fieldWithSparks(field, { key: `${card.kind}.${question.key}`, story: current }));

  const exampleAnswer = card.example?.answers?.[question.key];
  if (exampleAnswer) {
    body.push(el(
      'details',
      { class: 'explain' },
      el('summary', { text: `How ${card.example.ref} answers this` }),
      el('div', {}, el('p', { text: exampleAnswer })),
    ));
  }

  add(wrap, answerLayout(cardFace(card), body));

  // Adding one of these is a permission (P3); taking it away again has to be possible too.
  // Destructive, so it sits at the end of the scroll rather than in the thumb's arc (§6.3.11).
  if (card.repeatable && entriesFor(current, card.kind).length > 1) {
    const label = entryLabel(card, entry, 0, 1);
    add(wrap, el('button', {
      type: 'button', class: 'button danger', text: `Remove ${label}`,
      onclick: () => confirmModal({
        title: `Remove ${label}?`,
        message: `Every answer on this card goes with it. The rest of the story is untouched, and if you `
          + `have already read your story once, the saved version keeps them.`,
        confirmLabel: 'Remove',
        onConfirm: () => {
          saveStory(removeEntry(current, entryId));
          showToast(`${label} removed`);
          location.hash = '#/build/ingredients';
        },
      }),
    }));
  }

  const next = card.questions[index + 1];
  const prev = card.questions[index - 1];
  add(wrap, actionBar({
    context: `Question ${index + 1} of ${card.questions.length}`,
    label: next ? 'Next question' : 'Done with this card',
    href: next ? `#/build/ingredients/${entryId}/${index + 1}` : '#/build/ingredients',
    secondary: prev
      ? el('a', { class: 'button secondary', href: `#/build/ingredients/${entryId}/${index - 1}`, text: 'Back' })
      : null,
  }));
  return wrap;
}
