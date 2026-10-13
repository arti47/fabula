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
import { actionBar, cardTile, dealtFace, showToast, answerStage, confirmModal, teachingLine, optionsSheet, dealerBar } from './ui.js';
import { fieldWithSparks } from './sparks.js';
import { icon } from './icons.js';
import { INGREDIENTS, GROUPS } from '../data.js';
import { saveStory, removeEntry } from './store.js';
import { hasAnyAnswer, dealNeighbours } from './derived.js';
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
  // S4 — `bench` so a tablet can stand the four stations two-up; one per row made this step
  // longer on a 1024 screen than on a phone.
  const wrap = el('div', { class: 'bench' });
  let current = story;

  // D34 — this step's room is a workbench: four stations, each with its own cards lying on it,
  // rather than four identical blocks stacked down a page. The stations are nudged off true by a
  // fraction of a degree each, so the bench reads as things put down rather than as table cells.
  INGREDIENTS.forEach((card, stationIndex) => {
    const entries = entriesFor(current, card.kind);
    const skipped = current.skipped.includes(card.id);

    const station = el('section', { class: 'bench-station', style: `--tilt: ${[-0.5, 0.55, -0.45, 0.6][stationIndex % 4]}deg` });
    add(wrap, station);
    add(station, el('h3', { class: 'bench-label', text: card.headline }));

    if (skipped) {
      add(station, add(
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
      return;
    }

    const grid = el('div', { class: 'card-grid' });
    entries.forEach((entry, i) => {
      const answered = Object.values(entry.answers || {}).filter((v) => !isBlank(v)).length;
      add(grid, cardTile(card, {
        href: `#/build/ingredients/${entry.id}`,
        sub: `${answered}/${card.questions.length}`,
        blank: !hasAnyAnswer(entry),
        done: answered === card.questions.length,
      }));
      const tile = grid.lastChild;
      tile.querySelector('.card-headline').textContent = entryLabel(card, entry, i, entries.length);
    });

    if (!entries.length) {
      add(grid, cardTile(card, { href: `#/build/ingredients/new-${card.kind}`, blank: true }));
    }
    add(station, grid);

    // P3 — another of the same card is one more card on the bench: a blank one with a plus on it,
    // rather than a sentence-long button under the row (D59).
    if (card.repeatable && entries.length) {
      const another = card.kind === 'world' ? 'Add another world' : `Add another ${card.kind === 'hero' ? 'main character' : 'antagonist'}`;
      add(grid, add(el('button', {
        type: 'button', class: 'card add-card', 'aria-label': another,
        onclick: () => {
          const { story: next, id } = addEntry(current, card.kind);
          saveStory(next);
          location.hash = `#/build/ingredients/${id}`;
        },
      }), icon('plus', { size: 30 }), el('span', { class: 'add-card-label', text: 'Another' })));
    }
  });

  add(wrap, actionBar({
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

  // D53 — the card is the screen. No way back to the spread drawn on it, no card name over it (the
  // art prints its own): the bar's ⋯ and the menu hold those.

  // Pips: every question reachable in any order (P2 inside the card).
  const pips = el('nav', { class: 'pips', 'aria-label': 'Questions' });
  card.questions.forEach((q, i) => {
    add(pips, add(
      el('a', {
        class: `pip${isBlank(entry.answers?.[q.key]) ? ' is-blank' : ''}`, href: `#/build/ingredients/${entryId}/${i}`,
        'aria-current': i === index ? 'step' : null,
        'aria-label': `Question ${i + 1}: ${q.label}`,
      }),
      document.createTextNode(String(i + 1)),
      isBlank(entry.answers?.[q.key]) ? el('span', { class: 'blank-dot' }) : null,
    ));
  });

  const body = [];
  // D64 — which card this is, above its question. The art is cropped to its picture, so the card's
  // printed name (Main character, Antagonist…) was off the screen, and "How old are they?" read
  // the same for the hero and the villain. Named once it has a name; numbered if there are two.
  const siblings = entriesFor(current, card.kind);
  const at = siblings.findIndex((e) => e.id === entry.id);
  const named = entry.answers?.name;
  body.push(add(
    el('p', { class: 'card-eyebrow', style: `--card-color: var(${GROUPS[card.group]?.colorVar || '--accent'})` }),
    GROUPS[card.group]?.badge ? icon(GROUPS[card.group].badge, { size: 16 }) : null,
    el('span', { text: `${card.headline}${siblings.length > 1 && isBlank(named) ? ` ${at + 1}` : ''}` }),
    isBlank(named) ? null : el('span', { class: 'card-eyebrow-name', text: named }),
  ));
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
    pip.classList.toggle('is-blank', isBlank(field.value));
  }, 400);
  field.addEventListener('input', save);
  body.push(...fieldWithSparks(field, { key: `${card.kind}.${question.key}`, story: current }));

  // The teaching, one line on the card; the rest and the booklet's own answer behind "?" (D57).
  const exampleAnswer = card.example?.answers?.[question.key];
  body.push(teachingLine(card, {
    answer: exampleAnswer ? { title: `How ${card.example.ref} answers “${question.label}”`, text: exampleAnswer } : null,
  }));
  body.push(pips);

  add(wrap, answerStage(dealtFace(card, { deal: true }), body));

  // Everything else this card can do, behind its ⋯ (D56). Each is a permission (P1, P3) or its
  // undo, so each is a control; the destructive one sorts itself last.
  const deal = dealNeighbours(current, location.hash);
  const label = entryLabel(card, entry, 0, 1);
  const options = () => optionsSheet(label, [
    card.repeatable ? {
      label: card.kind === 'world' ? 'Add another world' : `Add another ${card.kind === 'hero' ? 'main character' : 'antagonist'}`,
      onClick: () => {
        const { story: next, id } = addEntry(current, card.kind);
        saveStory(next);
        location.hash = `#/build/ingredients/${id}`;
      },
    } : null,
    {
      label: 'Skip this card for now',
      onClick: () => {
        saveStory({ ...current, skipped: [...current.skipped, card.id] });
        showToast('Skipped — bring it back from the ingredients any time');
        location.hash = deal.next?.route || '#/build/ingredients';
      },
    },
    { label: 'See all four ingredients', href: '#/build/ingredients' },
    // Adding one of these is a permission (P3); taking it away again has to be possible too.
    card.repeatable && entriesFor(current, card.kind).length > 1 ? {
      label: `Remove ${label}`,
      kind: 'danger',
      onClick: () => confirmModal({
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
    } : null,
  ]);

  // Inside a card, Next walks its questions; off its last question the Dealer deals the next card.
  const nextQ = card.questions[index + 1];
  const prevQ = card.questions[index - 1];
  add(wrap, dealerBar({
    prev: prevQ ? { route: `#/build/ingredients/${entryId}/${index - 1}`, label: prevQ.label } : deal.prev,
    next: nextQ ? { route: `#/build/ingredients/${entryId}/${index + 1}`, label: nextQ.label } : deal.next,
    options,
  }));
  return wrap;
}
