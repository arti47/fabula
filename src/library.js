// Storytellers and the shelf of stories.

import { el, add } from './core.js';
import { icon } from './icons.js';
import { explain, actionBar, promptModal, confirmModal, showToast, modal, cardFan, clearActionBar } from './ui.js';
import { storyBlurb, coverCard } from './derived.js';
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

  // D58 — one button, and the first thing it does is deal. The name used to be a form between a
  // kid and the first card; it is asked at the end now, on the cover of the book they made.
  const panel = add(stage, el('div', { class: 'first-run-panel' })).lastChild;
  add(panel, el('h2', { text: 'Make a story with the deck' }));
  add(panel, add(
    el('div', { class: 'first-run-go' }),
    el('button', {
      type: 'button', class: 'button deal-me', text: 'Deal me a story',
      onclick: () => {
        addStoryteller('Storyteller', EMOJI[Math.floor(Math.random() * EMOJI.length)]);
        createStory('Untitled story');
        location.hash = '#/build/idea';
      },
    }),
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

  add(screen, el('h2', { text: stories.length ? 'Your stories' : 'No stories yet' }));

  if (!stories.length) {
    add(screen, add(
      el('p', { class: 'empty' }),
      icon('empty-shelf', { size: 48 }),
      document.createTextNode('Tap New story and the deck deals you the first card. '),
      // §6.2 — the walkthrough is linked from here while the shelf is empty.
      el('a', { href: '#/tutorial', text: 'Or see how it goes first.' }),
    ));
  }

  // D59 — a shelf of books, each wearing its cover, not a list of rows of words and numbers.
  const books = el('div', { class: 'bookshelf' });
  for (const meta of stories) {
    const story = getStory(meta.id);
    if (story) add(books, bookTile(story));
  }
  if (stories.length) add(screen, books);

  add(screen, exampleShelf());

  // A new story is dealt straight away; it is named at the end, on its own cover (D58).
  add(screen, actionBar({
    label: 'New story',
    onClick: () => {
      createStory('Untitled story', teller.id);
      location.hash = '#/build/idea';
    },
  }));
  return screen;
}

/** The booklet's two worked stories, readable any time (D11). */
function exampleShelf() {
  const box = el('div', { class: 'example-shelf' });
  add(box, el('h3', { text: 'From the book' }));
  const books = el('div', { class: 'bookshelf' });
  for (const example of EXAMPLE_STORIES) {
    // The worked stories are books on the same shelf, wearing their covers (D40, D59).
    const book = el('a', { class: 'book-tile example-row', href: `#/example/${example.id}` });
    add(book, coverImage(coverCard(example)));
    add(book, add(el('span', { class: 'book-label' }), el('span', { class: 'book-title', text: example.title })));
    add(books, book);
  }
  add(box, books);
  return box;
}

/** A book's cover: the card it wears. Gone without a word if the art is not installed (§11). */
function coverImage(card) {
  const art = el('img', { class: 'book-cover-img', src: `assets/cards/${card.art}.webp`, alt: '', loading: 'lazy', decoding: 'async' });
  art.addEventListener('error', () => art.remove());
  return art;
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

function bookTile(story) {
  const blurb = storyBlurb(story);
  const row = el('div', { class: 'book-tile story-row' });
  add(row, coverImage(coverCard(story)));

  // S7 — the whole book opens the story. The title is the one real control, stretched over the
  // cover in CSS, so the tap area is the book and a screen reader hears one button.
  const body = el('span', { class: 'book-label' });
  add(body, el('button', {
    type: 'button', class: 'story-open book-title', text: story.title,
    onclick: () => { setCurrentStoryId(story.id); location.hash = '#/build'; },
  }));
  if (blurb) add(body, el('span', { class: 'book-blurb', text: blurb }));

  // Rename and Delete behind one labelled button, so the destructive control is never beside
  // the one a thumb reaches for (§6.1). Delete is last in the sheet, and still confirms.
  add(row, add(el('button', {
    type: 'button', class: 'icon-button story-more',
    'aria-label': `More for ${story.title}: rename or delete`, 'aria-haspopup': 'dialog',
    onclick: () => modal({
      title: story.title,
      body: [],
      actions: [
        {
          label: 'Rename',
          kind: 'primary',
          onClick: () => promptModal({
            title: 'Rename this story',
            label: 'New name',
            value: story.title,
            onConfirm: (title) => {
              if (!title) return;
              saveStory({ ...story, title });
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            },
          }),
        },
        { label: 'Close', kind: 'secondary' },
        {
          label: 'Delete',
          kind: 'danger',
          onClick: () => confirmModal({
            title: `Delete “${story.title}”?`,
            message: 'Everything in it goes: the idea, the characters, all nine beats and every boost. There is no way to get it back.',
            confirmLabel: 'Delete it',
            onConfirm: () => {
              deleteStory(story.id);
              showToast('Story deleted');
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            },
          }),
        },
      ],
    }),
  }), icon('more', { size: 22 })));
  return add(row, body);
}
