// Step 5 — Tell: the story read back, before and after the boosts (D10, permission P9).
//
// Nothing is withheld here and nothing is scored (ruling A10). A story with three beats written
// reads back as three beats, and the page says how many are still blank without making a fuss.
//
// D60 — it reads as a book: a cover, one page per beat with that beat's card as its picture, and an
// end page with the ways to keep it. Pages turn sideways; printing lays them out one after another.

import { icon, illustration } from './icons.js';
import { el, add, clear, isBlank } from './core.js';
import { actionBar, showToast, promptModal } from './ui.js';
import { assemble, asPlainText, hasBothVersions } from './derived.js';
import { BEATS } from '../data.js';
import { saveStory, getCurrentStoryteller, renameStoryteller } from './store.js';

export function tellScreen(story, { readOnly = false } = {}) {
  const wrap = el('div');
  const both = hasBothVersions(story);
  let version = 'now';

  const page = el('article', { class: 'told-story' });
  const toggle = el('div', { class: 'version-toggle', role: 'group', 'aria-label': 'Which version' });
  if (both) {
    for (const [id, label] of [['before', 'Before the boosts'], ['now', 'After the boosts']]) {
      add(toggle, el('button', {
        type: 'button', class: 'button secondary', text: label,
        dataset: { version: id },
        onclick: () => { version = id; render(); },
      }));
    }
  }

  // The ways to keep it, on the book's last page (D50: Print stays the bar's primary).
  const keep = () => {
    const actions = el('div', { class: 'row-actions' });
    if (readOnly) {
      add(actions, el('button', { type: 'button', class: 'button secondary', text: 'Print it', onclick: () => window.print() }));
    }
    add(actions, el('button', {
      type: 'button', class: 'button secondary', text: 'Save it as text',
      onclick: () => {
        const text = asPlainText(assemble(story, version));
        const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
        const a = el('a', { href: url, download: `${slug(story.title)}.txt` });
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Saved as a text file');
      },
    }));
    add(actions, el('button', {
      type: 'button', class: 'button secondary', text: 'Copy it',
      onclick: async () => {
        const text = asPlainText(assemble(story, version));
        try {
          await navigator.clipboard.writeText(text);
          showToast('Copied');
        } catch {
          showToast('Your browser would not let me copy — use “Save it as text”');
        }
      },
    }));
    if (!readOnly) add(actions, el('a', { class: 'button secondary', href: '#/stories', text: 'Back to my stories' }));
    return actions;
  };

  const render = () => {
    const assembled = assemble(story, version);
    clear(page);
    add(page, storyMarkup(assembled, {
      toggle: both ? toggle : null,
      byline: readOnly ? null : bylineFor(story),
      later: !both ? 'Once you start the Boost step, this book will hold two versions — the story as it is now, and the one you had before boosting.' : null,
      keep: keep(),
    }));
    for (const button of toggle.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.version === version));
    }
  };
  add(wrap, page);
  render();

  if (!readOnly) {
    add(wrap, actionBar({
      label: 'Print it',
      onClick: () => window.print(),
      secondary: el('a', { class: 'button secondary', href: '#/build/boost', text: 'Keep boosting' }),
    }));
  }
  return wrap;
}

/**
 * The title and the storyteller, asked for here — at the end — rather than before the first card
 * (D58). Untitled until named, and a story is still a story without one.
 */
function bylineFor(story) {
  const teller = getCurrentStoryteller();
  const line = el('div', { class: 'book-byline' });
  add(line, el('button', {
    type: 'button', class: 'button secondary chip-action',
    text: story.title === 'Untitled story' ? 'Give it a title' : 'Rename it',
    onclick: () => promptModal({
      title: 'What is it called?', label: 'Title', value: story.title === 'Untitled story' ? '' : story.title,
      onConfirm: (title) => {
        if (!title) return;
        saveStory({ ...story, title });
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    }),
  }));
  if (teller) {
    add(line, el('button', {
      type: 'button', class: 'button secondary chip-action',
      text: isBlank(teller.name) || teller.name === 'Storyteller' ? 'Who wrote it?' : `by ${teller.name}`,
      'aria-label': 'Who wrote it? Change the storyteller’s name',
      onclick: () => promptModal({
        title: 'Who wrote it?', label: 'Your name', value: teller.name === 'Storyteller' ? '' : teller.name,
        onConfirm: (name) => {
          if (!name) return;
          renameStoryteller(teller.id, name);
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        },
      }),
    }));
  }
  return line;
}

function storyMarkup(assembled, { toggle, byline, later, keep }) {
  // Named, because the page's margins hang off it.
  const box = el('div', { class: 'told-body' });
  const pages = add(box, el('div', { class: 'book-pages', tabindex: '0', 'aria-label': 'The book — scroll sideways to turn the page' })).lastChild;
  const pageOf = (cls = '') => add(pages, el('section', { class: `book-page ${cls}`.trim() })).lastChild;

  // The cover: the card the story wears, its title, what it is the story of, and who wrote it.
  const cover = pageOf('book-cover');
  const head = add(cover, el('div', { class: 'told-head' })).lastChild;
  add(head, el('div', {
    class: 'told-head-art', 'aria-hidden': 'true',
    style: `background-image: url("assets/cards/${assembled.cover}.webp")`,
  }));
  add(head, el('h2', { class: 'told-title', id: 'told-top', text: assembled.title }));
  if (assembled.idea) add(head, el('p', { class: 'told-idea', text: `The story of ${assembled.idea}` }));
  add(cover, byline, toggle);
  if (assembled.version === 'before') {
    add(cover, el('p', { class: 'note', text: 'This is the draft you had when you started boosting.' }));
  }
  if (!assembled.passages.length) {
    add(cover, add(
      el('p', { class: 'empty' }),
      icon('empty-page', { size: 48 }),
      document.createTextNode('Nothing written yet. Fill in a beat or two and it will appear here.'),
    ));
  }

  // One page per beat, its card as the picture. The connector has a line of its own and the cap
  // drops on the first letter the kid actually wrote (D37).
  assembled.passages.forEach((passage, i) => {
    const leaf = pageOf();
    const beat = BEATS.find((b) => b.n === passage.n);
    if (beat) {
      const art = el('img', { class: 'book-art', alt: '', loading: 'lazy', decoding: 'async', src: `assets/cards/${beat.art}.webp` });
      art.addEventListener('error', () => art.remove());
      add(leaf, art);
    }
    add(leaf, el('p', { class: 'told-connector', style: `--i: ${i}`, text: passage.connector }));
    add(leaf, el('p', { class: 'told-passage has-cap', style: `--i: ${i}`, text: passage.text }));
    add(leaf, el('p', { class: 'book-folio', 'aria-hidden': 'true', text: String(i + 1) }));
  });

  // Who and where, and the boosts' notes, as the book's appendix — one page, only if there is any.
  if (assembled.cast.length || assembled.worlds.length || assembled.boosts.length) {
    const back = pageOf('book-appendix');
    if (assembled.cast.length) {
      add(back, el('h3', { id: 'told-cast', text: 'Who is in it' }));
      const list = el('ul');
      for (const c of assembled.cast) {
        add(list, add(
          el('li'),
          el('b', { text: c.name }),
          c.description ? document.createTextNode(` — ${c.description}`) : null,
          c.fromBoost ? el('span', { class: 'house-flag', text: 'came from a boost' }) : null,
        ));
      }
      add(back, list);
    }
    if (assembled.worlds.length) {
      add(back, el('h3', { id: 'told-worlds', text: 'Where it happens' }));
      const list = el('ul');
      for (const w of assembled.worlds) add(list, el('li', { text: w.description }));
      add(back, list);
    }
    if (assembled.boosts.length) {
      add(back, el('h3', { id: 'told-notes', text: 'Notes from the boosts' }));
      const list = el('ul');
      for (const b of assembled.boosts) {
        add(list, add(el('li'), el('b', { text: `${b.headline} ` }), document.createTextNode(b.answer)));
      }
      add(back, list);
    }
  }

  // The end: the story closes the way a page closes (G12), and the ways to keep it.
  const end = pageOf('book-end');
  if (assembled.passages.length) {
    add(end, add(el('div', { class: 'told-end', 'aria-hidden': 'true', style: `--i: ${assembled.passages.length}` }), illustration('story-end')));
  }
  if (assembled.blanks) {
    add(end, el('p', {
      class: 'note told-blanks',
      text: `${assembled.blanks} of the nine beats ${assembled.blanks === 1 ? 'is' : 'are'} still blank. You can read it like this, or go back and fill them in.`,
    }));
  }
  if (later) add(end, el('p', { class: 'note tell-later', text: later }));
  add(end, keep);

  // Turning the page: two quiet arrows over the book's edges, and the arrow keys (D60).
  const turn = (by) => pages.scrollBy({
    left: by * pages.clientWidth,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
  pages.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
  });
  const back = add(el('button', { type: 'button', class: 'icon-button book-turn', 'aria-label': 'Previous page', onclick: () => turn(-1) }), icon('prev', { size: 22 }));
  const fwd = add(el('button', { type: 'button', class: 'icon-button book-turn', 'aria-label': 'Next page', onclick: () => turn(1) }), icon('next', { size: 22 }));
  // No page before the cover and none after the end: say so rather than do nothing.
  const ends = () => {
    back.disabled = pages.scrollLeft <= 2;
    fwd.disabled = pages.scrollLeft >= pages.scrollWidth - pages.clientWidth - 2;
  };
  pages.addEventListener('scroll', ends, { passive: true });
  requestAnimationFrame(ends);
  add(box, add(el('div', { class: 'book-turns' }), back, fwd));
  return box;
}

function slug(title) {
  return (title || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'story';
}
