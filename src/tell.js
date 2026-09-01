// Step 5 — Tell: the story read back, before and after the boosts (D10, permission P9).
//
// Nothing is withheld here and nothing is scored (ruling A10). A story with three beats written
// reads back as three beats, and the page says how many are still blank without making a fuss.

import { el, add, clear } from './core.js';
import { actionBar, showToast } from './ui.js';
import { assemble, asPlainText, hasBothVersions } from './derived.js';

export function tellScreen(story, { readOnly = false } = {}) {
  const wrap = el('div');
  const both = hasBothVersions(story);
  let version = 'now';

  const page = el('article', { class: 'told-story' });

  const toggle = el('div', { class: 'version-toggle', role: 'group', 'aria-label': 'Which version' });
  const render = () => {
    const assembled = assemble(story, version);
    clear(page);
    add(page, storyMarkup(assembled));
    for (const button of toggle.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.version === version));
    }
  };

  if (both) {
    for (const [id, label] of [['before', 'Before the boosts'], ['now', 'After the boosts']]) {
      add(toggle, el('button', {
        type: 'button', class: 'button secondary', text: label,
        dataset: { version: id },
        onclick: () => { version = id; render(); },
      }));
    }
    add(wrap, toggle);
    add(wrap, el('p', { class: 'note', text: 'The book tells Hänsel and Gretel twice, before and after the boosts, so you can see what changed. Here is yours.' }));
  } else {
    add(wrap, el('p', { class: 'note', text: 'Once you start the Boost step, this page will hold two versions — the story as it is now, and the one you had before boosting.' }));
  }

  add(wrap, page);
  render();

  const actions = el('div', { class: 'row-actions' });
  add(actions, el('button', {
    type: 'button', class: 'button secondary', text: 'Print it',
    onclick: () => window.print(),
  }));
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
  add(wrap, actions);

  if (!readOnly) {
    add(wrap, actionBar({
      context: 'Tell it out loud — that is the whole point',
      label: 'Back to my stories',
      href: '#/stories',
      secondary: el('a', { class: 'button secondary', href: '#/build/boost', text: 'Keep boosting' }),
    }));
  }
  return wrap;
}

function storyMarkup(assembled) {
  const box = el('div');
  add(box, el('h2', { class: 'told-title', id: 'told-top', text: assembled.title }));

  // A told story is legitimately long, so it gets a jump row rather than losing anything (§6.5).
  const sections = [
    assembled.passages.length && { id: 'told-story-text', label: 'The story' },
    assembled.cast.length && { id: 'told-cast', label: 'Who is in it' },
    assembled.worlds.length && { id: 'told-worlds', label: 'Where' },
    assembled.boosts.length && { id: 'told-notes', label: 'Boost notes' },
  ].filter(Boolean);
  if (sections.length > 1) {
    // Buttons, not anchors: an in-page href would be read as a route by the hash router.
    const jump = el('nav', { class: 'section-nav', 'aria-label': 'Jump to' });
    for (const section of sections) {
      add(jump, el('button', {
        type: 'button', class: 'jump-pill', text: section.label,
        onclick: () => document.getElementById(section.id)?.scrollIntoView({
          block: 'start',
          // No animation for anyone who has asked not to have any.
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        }),
      }));
    }
    add(box, jump);
  }
  if (assembled.version === 'before') {
    add(box, el('p', { class: 'note', text: 'This is the draft you had when you started boosting.' }));
  }
  if (assembled.idea) add(box, el('p', { class: 'told-idea', text: `The story of ${assembled.idea}` }));
  add(box, el('div', { id: 'told-story-text' }));

  if (!assembled.passages.length) {
    add(box, el('p', { class: 'empty', text: 'Nothing written yet. Fill in a beat or two and it will appear here.' }));
  }

  for (const passage of assembled.passages) {
    add(box, add(
      el('p', { class: 'told-passage' }),
      el('span', { class: 'told-connector', text: `${passage.connector} ` }),
      document.createTextNode(passage.text),
    ));
  }

  if (assembled.blanks) {
    add(box, el('p', {
      class: 'note told-blanks',
      text: `${assembled.blanks} of the nine beats ${assembled.blanks === 1 ? 'is' : 'are'} still blank. You can read it like this, or go back and fill them in.`,
    }));
  }

  if (assembled.cast.length) {
    add(box, el('h3', { id: 'told-cast', text: 'Who is in it' }));
    const list = el('ul');
    for (const c of assembled.cast) {
      add(list, add(
        el('li'),
        el('b', { text: c.name }),
        c.description ? document.createTextNode(` — ${c.description}`) : null,
        c.fromBoost ? el('span', { class: 'house-flag', text: 'came from a boost' }) : null,
      ));
    }
    add(box, list);
  }

  if (assembled.worlds.length) {
    add(box, el('h3', { id: 'told-worlds', text: 'Where it happens' }));
    const list = el('ul');
    for (const w of assembled.worlds) add(list, el('li', { text: w.description }));
    add(box, list);
  }

  if (assembled.boosts.length) {
    add(box, el('h3', { id: 'told-notes', text: 'Notes from the boosts' }));
    const list = el('ul');
    for (const b of assembled.boosts) {
      add(list, add(el('li'), el('b', { text: `${b.headline} ` }), document.createTextNode(b.answer)));
    }
    add(box, list);
  }
  return box;
}

function slug(title) {
  return (title || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'story';
}
