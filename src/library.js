// Storytellers and the shelf of stories.

import { el, add, relativeTime } from './core.js';
import { icon } from './icons.js';
import { explain, actionBar, promptModal, confirmModal, showToast, modal, cardFan, clearActionBar } from './ui.js';
import { storyBlurb, progress, coverCard } from './derived.js';
import { EXAMPLE_STORIES, getExample } from '../data-examples.js';
import { tellScreen } from './tell.js';
import {
  getStorytellers, addStoryteller, removeStoryteller, getCurrentStoryteller, setCurrentStoryteller,
  listStories, getStory, createStory, deleteStory, saveStory, setCurrentStoryId,
} from './store.js';

const EMOJI = ['✶', '🦊', '🐉', '🚀', '🌙', '🦉', '🐙', '🎈'];

export function storiesScreen() {
  const teller = getCurrentStoryteller();
  return teller ? shelf(teller) : firstRun();
}

// ---------------------------------------------------------------------------
// First run: no storyteller yet
// ---------------------------------------------------------------------------

function firstRun() {
  const screen = el('div');

  // D43 — the first screen anybody sees showed 37 words, one field and 420px of black, and not
  // one of the deck's 34 illustrations. It opens on the deck now: five real faces, fanned and
  // bled off the edges, with the question and the field standing on them.
  const stage = el('div', { class: 'first-run' });
  add(screen, stage);
  add(stage, cardFan(['ing-hero', 'prompt-m', 'idea', 'beat-1', 'ing-world']));

  const panel = add(stage, el('div', { class: 'first-run-panel' })).lastChild;
  add(panel, el('h2', { text: 'Who is telling stories?' }));

  const input = el('input', { type: 'text', id: 'teller-name', placeholder: 'Your name', autocomplete: 'off' });
  add(panel, el('label', { for: 'teller-name', text: 'Your name' }), input);

  const create = () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    addStoryteller(name, EMOJI[Math.floor(Math.random() * EMOJI.length)]);
    location.hash = '#/stories';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); });

  // Start belongs beside the field it submits. Pinned across the foot of the screen it was as far
  // from the one thing on the screen as the layout allowed.
  add(panel, add(
    el('div', { class: 'first-run-go' }),
    el('button', { type: 'button', class: 'button', text: 'Start', onclick: create }),
    el('span', { class: 'note', text: 'One tap and you are in' }),
  ));
  clearActionBar();

  // The lower half was the same emptiness, moved down. The two worked stories already exist as a
  // component and they are the one thing that answers "what is this for?" before you have typed
  // anything: they are readable without a name, and they are what the app makes.
  add(screen, exampleShelf());
  return screen;
}

// ---------------------------------------------------------------------------
// The shelf
// ---------------------------------------------------------------------------

function shelf(teller) {
  const screen = el('div');
  const stories = listStories(teller.id);

  add(screen, tellerRow(teller));
  add(screen, el('h2', { text: stories.length ? 'Your stories' : 'No stories yet' }));

  if (!stories.length) {
    add(screen, add(
      el('p', { class: 'empty' }),
      icon('empty-shelf', { size: 48 }),
      document.createTextNode('Start your first story: an idea, then who is in it, then what happens. '),
      el('a', { href: '#/tutorial', text: 'Or read how it goes, first.' }),
    ));
  }

  // Two shelves side by side on a tablet, one on a phone (D23).
  const rows = el('div', { class: 'two-up' });
  for (const meta of stories) {
    const story = getStory(meta.id);
    if (!story) continue;
    add(rows, storyRow(story));
  }
  add(screen, rows);

  add(screen, exampleShelf());

  add(screen, actionBar({
    label: 'New story',
    context: stories.length ? `${stories.length} on the shelf` : 'Nothing on the shelf yet',
    onClick: () => promptModal({
      title: 'A new story',
      label: 'What shall we call it?',
      message: 'You can change this later — even after you know what it is about.',
      value: '',
      confirmLabel: 'Start it',
      onConfirm: (title) => {
        const story = createStory(title || 'Untitled story', teller.id);
        location.hash = '#/build/idea';
        showToast(`Started “${story.title}”`);
      },
    }),
  }));
  return screen;
}

/** The booklet's two worked stories, readable any time (D11). */
function exampleShelf() {
  const box = el('div');
  add(box, el('h3', { text: 'Two stories from the book' }));
  add(box, el('p', { class: 'note', text: 'Built with these same cards, and readable like your own. Handy when you are stuck on what a beat is supposed to do.' }));
  const rows = el('div', { class: 'two-up' });
  for (const example of EXAMPLE_STORIES) {
    const row = el('a', { class: 'card example-row', href: `#/example/${example.id}` });
    // A worked story wears the card its hero lives on, the same way a kid's own does on the
    // shelf (D40): these were two text rows on a screen whose whole point is the deck.
    const cover = coverCard(example);
    const art = el('img', {
      class: 'shelf-cover-img', src: `assets/cards/${cover.art}.webp`,
      alt: '', loading: 'lazy', decoding: 'async',
    });
    art.addEventListener('error', () => art.parentElement?.remove());
    add(row, add(el('div', { class: 'shelf-cover' }), art));
    add(row, add(
      el('div', { class: 'card-body' }),
      el('p', { class: 'card-headline', text: example.title }),
      el('div', { class: 'card-sub', text: example.blurb }),
    ));
    add(rows, row);
  }
  add(box, rows);
  return box;
}

/** An example story, read-only, through the same Tell page as a kid's own (§10.9). */
export function exampleScreen(id) {
  const example = getExample(id);
  if (!example) {
    return add(
      el('div'),
      el('h2', { text: 'No such story' }),
      el('p', { class: 'empty', text: 'The book has two worked stories, and that is not one of them.' }),
      el('a', { class: 'button', href: '#/stories', text: 'Back to the shelf' }),
    );
  }
  const wrap = el('div');
  add(wrap, el('a', { class: 'back-link', href: '#/stories', text: '← Back to the shelf' }));
  add(wrap, el('h2', { text: example.title }));
  add(wrap, explain(
    'One of the two stories the booklet works through, built with exactly the cards you are using.',
    'It is here to read, not to change. Copy it to your own shelf if you want to take it somewhere else.',
  ));
  add(wrap, el('p', { class: 'note', text: example.blurb }));
  add(wrap, tellScreen(example, { readOnly: true }));
  add(wrap, el('button', {
    type: 'button', class: 'button secondary', text: 'Copy it to my shelf',
    onclick: () => {
      const teller = getCurrentStoryteller();
      if (!teller) { showToast('Add your name first'); return; }
      const copy = saveStory({
        ...JSON.parse(JSON.stringify(example)),
        id: `story-copy-${Date.now().toString(36)}`,
        example: false,
        ownerId: teller.id,
        title: `${example.title} (my copy)`,
      });
      setCurrentStoryId(copy.id);
      showToast('Copied — it is yours to change now');
      location.hash = '#/build/tell';
    },
  }));
  return wrap;
}

function tellerRow(teller) {
  const row = el('div', { class: 'progress-row' });
  add(row, el('span', { class: 'progress-item', text: `${teller.emoji} ${teller.name}` }));
  // Named for everything it does. It used to say "Switch", so the only way to remove a
  // storyteller was hidden behind a word that does not mean remove (§0.2).
  add(row, el('button', {
    type: 'button', class: 'button secondary', text: 'Storytellers',
    'aria-label': 'Switch, add or remove a storyteller',
    onclick: () => storytellerManager(),
  }));
  return row;
}

/**
 * Switch to another storyteller, add one, or remove one and everything they have written.
 * Exported because Settings is the other place a person looks for it (§6.1).
 */
export function storytellerManager() {
  // The confirm replaces the switcher rather than stacking on top of it.
  let closeSwitcher = () => {};
  const list = el('div', { class: 'teller-list' });
  for (const t of getStorytellers()) {
    const row = el('div', { class: 'teller-row' });
    add(row, el('button', {
      type: 'button', class: 'button secondary', text: `${t.emoji} ${t.name}`,
      onclick: () => {
        setCurrentStoryteller(t.id);
        setCurrentStoryId(null);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    }));
    const count = listStories(t.id).length;
    add(row, el('button', {
      type: 'button', class: 'button danger', text: 'Remove',
      'aria-label': `Remove ${t.name}`,
      onclick: () => {
        closeSwitcher();
        confirmModal({
        title: `Remove ${t.name}?`,
        message: count
          ? `Their ${count} stor${count === 1 ? 'y goes' : 'ies go'} too — the ideas, the characters, every beat. There is no way to get them back.`
          : 'They have no stories yet, so nothing else is lost.',
        confirmLabel: 'Remove them',
        onConfirm: () => {
          removeStoryteller(t.id);
          showToast(`${t.name} removed`);
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        },
        });
      },
    }));
    add(list, row);
  }
  closeSwitcher = promptModalAddPerson(list);
}

function promptModalAddPerson(list) {
  return modal({
    title: 'Who is telling stories?',
    body: [list],
    actions: [
      {
        label: 'Add someone new',
        onClick: () => promptModal({
          title: 'Add a storyteller',
          label: 'Their name',
          confirmLabel: 'Add',
          onConfirm: (name) => {
            if (!name) return;
            addStoryteller(name, EMOJI[Math.floor(Math.random() * EMOJI.length)]);
            setCurrentStoryId(null);
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          },
        }),
      },
      { label: 'Close', kind: 'secondary' },
    ],
  });
}

function storyRow(story) {
  const p = progress(story);
  const blurb = storyBlurb(story);
  const row = el('div', { class: 'card story-row', style: 'border-top-color: var(--group-structure)' });
  const cover = coverCard(story);
  add(row, add(
    el('div', { class: 'story-cover' }),
    el('img', { src: `assets/cards/${cover.art}.webp`, alt: '', loading: 'lazy', decoding: 'async' }),
  ));
  const body = el('div', { class: 'card-body' });

  add(body, el('p', { class: 'card-headline', text: story.title }));
  if (blurb) add(body, el('div', { class: 'card-sub', text: blurb }));
  add(body, el('div', {
    class: 'card-sub',
    text: `Ingredients ${p.ingredients.done}/${p.ingredients.total} · Beats ${p.beats.done}/${p.beats.total} · Boosts ${p.boosts.done}/${p.boosts.total} · ${relativeTime(story.updatedAt)}`,
  }));

  const actions = el('div', { class: 'row-actions' });
  add(actions, el('button', {
    type: 'button', class: 'button', text: 'Open',
    onclick: () => { setCurrentStoryId(story.id); location.hash = '#/build'; },
  }));
  add(actions, el('button', {
    type: 'button', class: 'button secondary', text: 'Rename',
    onclick: () => promptModal({
      title: 'Rename this story',
      label: 'New name',
      value: story.title,
      onConfirm: (title) => {
        if (!title) return;
        saveStory({ ...story, title });
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    }),
  }));
  add(actions, el('button', {
    type: 'button', class: 'button danger', text: 'Delete',
    onclick: () => confirmModal({
      title: `Delete “${story.title}”?`,
      message: 'Everything in it goes: the idea, the characters, all nine beats and every boost. There is no way to get it back.',
      confirmLabel: 'Delete it',
      onConfirm: () => {
        deleteStory(story.id);
        showToast('Story deleted');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
    }),
  }));
  add(body, actions);
  return add(row, body);
}
