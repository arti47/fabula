// Storytellers and the shelf of stories.

import { el, add, relativeTime } from './core.js';
import { explain, actionBar, promptModal, confirmModal, showToast, modal } from './ui.js';
import { storyBlurb, progress } from './derived.js';
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
  add(screen, el('h2', { text: 'Who is telling stories?' }));
  add(screen, explain(
    'Put your name in, and this shelf becomes yours.',
    'If somebody else uses this tablet too, they can add their own name and keep their own stories separate.',
  ));

  const input = el('input', { type: 'text', id: 'teller-name', placeholder: 'Your name', autocomplete: 'off' });
  add(screen, el('label', { for: 'teller-name', text: 'Your name' }), input);

  const create = () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    addStoryteller(name, EMOJI[Math.floor(Math.random() * EMOJI.length)]);
    location.hash = '#/stories';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); });

  add(screen, actionBar({ label: 'Start', onClick: create, context: 'One tap and you are in' }));
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
  add(screen, explain(
    'Every story you have started lives here.',
    'Open one to keep going, or start a new one. Nothing is ever finished until you say it is.',
  ));

  if (!stories.length) {
    add(screen, el('p', {
      class: 'empty',
      text: 'Start your first story: an idea, then who is in it, then what happens.',
    }));
  }

  for (const meta of stories) {
    const story = getStory(meta.id);
    if (!story) continue;
    add(screen, storyRow(story));
  }

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

function tellerRow(teller) {
  const row = el('div', { class: 'progress-row' });
  add(row, el('span', { class: 'progress-item', text: `${teller.emoji} ${teller.name}` }));
  add(row, el('button', {
    type: 'button', class: 'button secondary', text: 'Switch',
    onclick: () => switchStoryteller(),
  }));
  return row;
}

function switchStoryteller() {
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
  const row = el('div', { class: 'card', style: 'border-top-color: var(--group-structure)' });
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
