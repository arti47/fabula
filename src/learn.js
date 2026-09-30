// The rules library: one entry per card and per step, in play order, searchable, collapsed until
// opened. Every card in the app links here (CLAUDE.md §6.2 layer 2).

import { el, add, clear } from './core.js';
import { clearActionBar, exampleLine, groupBanner } from './ui.js';
import { LEARN_CHAPTERS, DRAWING_TIPS } from '../data-learn.js';
import { getCard, GROUPS } from '../data.js';

/** Flatten every chapter into searchable entries, resolving card-backed ones through one lookup. */
export function learnEntries() {
  const out = [];
  for (const chapter of LEARN_CHAPTERS) {
    for (const entry of chapter.entries || []) {
      out.push({ ...entry, chapter: chapter.id, chapterTitle: chapter.title, body: entry.text });
    }
    for (const cardId of chapter.cards || []) {
      const card = getCard(cardId);
      if (!card) continue;
      out.push({
        id: cardId,
        chapter: chapter.id,
        chapterTitle: chapter.title,
        title: card.beatName ? `${card.n}. ${card.headline} — ${card.beatName}` : card.headline,
        body: card.guidance,
        card,
      });
    }
    if (chapter.tips) {
      for (const tip of DRAWING_TIPS) {
        out.push({
          id: `tip-${tip.n}`,
          chapter: chapter.id,
          chapterTitle: chapter.title,
          title: `${tip.n}. ${tip.title}`,
          body: tip.text,
        });
      }
    }
  }
  return out;
}

export function matchEntries(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return learnEntries().filter((e) => {
    const haystack = [e.title, e.body, ...(e.card?.examples || []).map((x) => `${x.ref} ${x.text}`)].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

export function learnScreen({ openId } = {}) {
  clearActionBar();
  // D42 — one route, resolved by what the id names. A chapter id opens that chapter; an entry id
  // opens the chapter holding it, with the entry open. The two id spaces provably never collide
  // (a data test asserts it), so every "Read more about this card" link in the app still lands.
  const chapter = LEARN_CHAPTERS.find((c) => c.id === openId);
  if (chapter) return chapterScreen(chapter);
  const entries = learnEntries();
  const holding = openId && entries.find((e) => e.id === openId);
  if (holding) return chapterScreen(LEARN_CHAPTERS.find((c) => c.id === holding.chapter), openId);
  return indexScreen();
}

/**
 * The index (D42). It was 3,299 words, 77 controls and 42 near-identical collapsed rows in one
 * flat scroll — four screens of it. It is seven covers and a search field now, and a chapter is
 * a screen of its own.
 */
function indexScreen() {
  const wrap = el('div');
  add(wrap, el('h2', { text: 'Learn' }));

  const results = el('div', { class: 'learn-results' });
  const search = el('input', {
    type: 'search', id: 'learn-search', placeholder: 'Search — “villain”, “twist”, “colours”…',
    'aria-label': 'Search the rules library',
  });
  search.addEventListener('input', () => {
    clear(results);
    const query = search.value;
    if (!query.trim()) return;
    const hits = matchEntries(query);
    add(results, el('p', { class: 'note', text: hits.length ? `${hits.length} match${hits.length === 1 ? '' : 'es'}` : 'Nothing matches that.' }));
    for (const hit of hits) add(results, entryDetails(hit, { open: true, showChapter: true }));
  });
  add(wrap, el('label', { for: 'learn-search', text: 'Search' }), search, results);

  const shelf = el('div', { class: 'two-up learn-shelf' });
  for (const chapter of LEARN_CHAPTERS) {
    const tile = el('a', { class: 'card learn-chapter', href: `#/learn/${chapter.id}` });
    // A chapter about a group of cards wears that group's own divider (G5, A2: a band, never a
    // playable face). The others carry the group colour alone.
    const banner = chapterBanner(chapter);
    if (banner) add(tile, banner);
    add(tile, add(
      el('div', { class: 'card-body' }),
      el('p', { class: 'card-headline', text: chapter.title }),
      el('div', { class: 'card-sub', text: countOf(chapter) }),
    ));
    add(shelf, tile);
  }
  add(wrap, shelf);
  return wrap;
}

/**
 * The divider a chapter wears. The *first* card is not always the right one to ask: the prompts
 * chapter opens with the Idea card, whose group the deck prints no divider for, so asking that
 * card left the chapter with no band at all. Ask the first card whose group actually has one.
 */
function chapterBanner(chapter) {
  for (const cardId of chapter.cards || []) {
    const card = getCard(cardId);
    const banner = card && groupBanner(card.group);
    if (banner) return banner;
  }
  return null;
}

/** How much is behind a cover, so the index says what opening it costs. */
function countOf(chapter) {
  const n = (chapter.entries?.length || 0) + (chapter.cards?.length || 0) + (chapter.tips ? DRAWING_TIPS.length : 0);
  return `${n} ${n === 1 ? 'thing' : 'things'} to read`;
}

/** One chapter, on its own screen, in its group's colour. */
function chapterScreen(chapter, openId) {
  const wrap = el('div');
  add(wrap, el('a', { class: 'back-link', href: '#/learn', text: '← All of Learn' }));
  add(wrap, el('h2', { text: chapter.title }));

  const banner = chapterBanner(chapter);
  if (banner) add(wrap, banner);
  if (chapter.intro) add(wrap, el('p', { class: 'step-lead', text: chapter.intro }));

  const column = el('div', { class: 'two-up' });
  for (const entry of learnEntries().filter((e) => e.chapter === chapter.id)) {
    add(column, entryDetails(entry, { open: entry.id === openId }));
  }
  add(wrap, column);
  return wrap;
}

function entryDetails(entry, { open = false, showChapter = false } = {}) {
  const box = el('details', { class: 'explain learn-entry', id: `learn-${entry.id}`, open: open || null });
  add(box, el('summary', { text: entry.title }));
  const body = el('div');
  if (showChapter) add(body, el('p', { class: 'note', text: entry.chapterTitle }));
  add(body, el('p', { text: entry.body }));

  if (entry.card) {
    const card = entry.card;
    if (card.questions) {
      add(body, el('p', { class: 'note', text: 'What the card asks:' }));
      const list = el('ul');
      for (const q of card.questions) add(list, el('li', { text: q.label }));
      add(body, list);
    }
    const examples = card.examples || card.examplesOther || [];
    if (examples.length) {
      const list = el('ul');
      for (const ex of examples) add(list, exampleLine(ex));
      add(body, list);
    }
    if (card.example?.text) add(body, el('p', { class: 'note', text: `${card.example.ref}: ${card.example.text}` }));
    add(body, el('a', { class: 'back-link', href: `#/deck/card/${card.id}`, text: `See the ${GROUPS[card.group].name} card →` }));
  }
  add(box, body);
  return box;
}
