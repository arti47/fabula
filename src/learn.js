// The rules library: one entry per card and per step, in play order, searchable, collapsed until
// opened. Every card in the app links here (CLAUDE.md §6.2 layer 2).

import { el, add, clear } from './core.js';
import { explain, clearActionBar, exampleLine } from './ui.js';
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
  const wrap = el('div');
  add(wrap, el('h2', { text: 'Learn' }));
  add(wrap, explain(
    'Everything the book teaches, in one place: what each card is for, how the five steps go, and how to draw your story.',
    'Search it, or open a chapter and read down. Nothing here changes your story.',
  ));

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

  const entries = learnEntries();
  for (const chapter of LEARN_CHAPTERS) {
    add(wrap, el('h3', { text: chapter.title }));
    if (chapter.intro) add(wrap, el('p', { class: 'note', text: chapter.intro }));
    for (const entry of entries.filter((e) => e.chapter === chapter.id)) {
      add(wrap, entryDetails(entry, { open: entry.id === openId }));
    }
  }
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
