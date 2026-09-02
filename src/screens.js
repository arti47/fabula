// Top-level screens. Phase 0 ships the frame, the Deck browser (which proves the data layer and
// the art placeholders), and stubs that name what is coming, per the roadmap.

import { el, add } from './core.js';
import { explain, cardTile, exampleLine, clearActionBar, showToast, confirmModal } from './ui.js';
import { PROMPTS, INGREDIENTS, BEATS, BOOSTS, IDEA_CARD, GROUPS, getCard, CARD_ERRATA } from '../data.js';
import { getPrefs, setPref, exportAll, importAll, describeImport } from './store.js';

function sectionNav(items, currentId) {
  const nav = el('nav', { class: 'section-nav', 'aria-label': 'Sections' });
  for (const item of items) {
    add(nav, el('a', {
      href: item.href,
      text: item.label,
      'aria-current': item.id === currentId ? 'page' : null,
    }));
  }
  return nav;
}

// ---------------------------------------------------------------------------
// Deck — every playable card, grouped, browsable
// ---------------------------------------------------------------------------

const DECK_SECTIONS = [
  { id: 'idea', label: 'The Idea', cards: () => [IDEA_CARD] },
  { id: 'prompts', label: 'Prompts', cards: () => PROMPTS },
  { id: 'ingredients', label: 'Ingredients', cards: () => INGREDIENTS },
  { id: 'structure', label: 'Structure', cards: () => BEATS },
  { id: 'boosts', label: 'Boosts', cards: () => BOOSTS },
];

export function deckScreen(params) {
  clearActionBar();
  const sectionId = params.section || 'prompts';
  const section = DECK_SECTIONS.find((s) => s.id === sectionId) || DECK_SECTIONS[0];
  const screen = el('div');

  add(screen, sectionNav(
    DECK_SECTIONS.map((s) => ({ id: s.id, label: s.label, href: `#/deck/${s.id}` })),
    section.id,
  ));

  add(screen, el('h2', { text: section.label }));
  add(screen, explain(
    'Every card in the deck, to look at whenever you like.',
    'Tap one to read what it is for and how the book uses it. Nothing here changes your story — this is the shelf, not the workbench.',
  ));

  const grid = el('div', { class: 'card-grid' });
  for (const card of section.cards()) {
    add(grid, cardTile(card, {
      href: `#/deck/card/${card.id}`,
      sub: card.beatName || (card.letter ? `Die face ${card.letter}` : null),
    }));
  }
  add(screen, grid);
  return screen;
}

export function cardScreen(params) {
  clearActionBar();
  const card = getCard(params.cardId);
  const screen = el('div');
  if (!card) {
    add(screen, el('h2', { text: 'No such card' }));
    add(screen, el('p', { class: 'empty', text: 'That card is not in the deck.' }));
    add(screen, el('a', { class: 'button secondary', href: '#/deck', text: 'Back to the deck' }));
    return screen;
  }

  add(screen, el('a', { href: '#/deck', text: '← Back to the deck', class: 'back-link' }));
  add(screen, el('h2', { text: card.headline }));
  add(screen, explain(
    'One card, close up: what it is for, what it asks you, and how the book answers it.',
    'This is the card on its own, away from your story — nothing you do here changes what you have written.',
  ));
  add(screen, el('p', { class: 'note', text: `${GROUPS[card.group]?.name}${card.beatName ? ` · ${card.beatName}` : ''}${card.letter ? ` · die face ${card.letter}` : ''}` }));
  add(screen, cardTile(card));
  add(screen, el('p', { text: card.guidance }));

  if (card.questions) {
    add(screen, el('h3', { text: 'What the card asks' }));
    const list = el('ul');
    for (const q of card.questions) add(list, el('li', { text: q.label }));
    add(screen, list);
  }

  const examples = card.examples || card.examplesOther || [];
  if (examples.length) {
    add(screen, el('h3', { text: 'Examples' }));
    const list = el('ul');
    for (const ex of examples) add(list, exampleLine(ex));
    add(screen, list);
  }

  add(screen, el('p', {}, el('a', { class: 'back-link', href: `#/learn/${card.id}`, text: 'Read more about this card →' })));

  if (card.example) {
    add(screen, el('h3', { text: `How ${card.example.ref} answers it` }));
    if (card.example.text) {
      add(screen, el('p', { text: card.example.text }));
    } else {
      const list = el('ul');
      for (const q of card.questions || []) {
        const answer = card.example.answers[q.key];
        if (answer) add(list, add(el('li'), el('b', { text: `${q.label} ` }), document.createTextNode(answer)));
      }
      add(screen, list);
    }
  }
  return screen;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function settingsScreen() {
  clearActionBar();
  const prefs = getPrefs();
  const screen = el('div');
  add(screen, el('h2', { text: 'Settings' }));
  add(screen, explain(
    'Everything about how the app looks, and how to keep a copy of your stories.',
    'Your stories are saved on this device only. Nothing is sent anywhere, and nobody else can see them.',
  ));

  add(screen, el('h3', { text: 'Text size' }));
  const scale = el('input', {
    type: 'range', min: '0.85', max: '1.5', step: '0.05', value: String(prefs.textScale),
    'aria-label': 'Text size',
  });
  scale.addEventListener('input', () => {
    document.documentElement.style.setProperty('--text-scale', scale.value);
    setPref('textScale', Number(scale.value));
  });
  add(screen, scale);

  add(screen, el('h3', { text: 'Your stories, as a file' }));
  add(screen, el('p', { class: 'note', text: 'A backup you can keep, or move to another device. It is plain text you can open and read.' }));
  add(screen, el('button', {
    type: 'button', class: 'button secondary', text: 'Save a backup file',
    onclick: () => {
      const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: `story-machine-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Backup saved');
    },
  }));

  const file = el('input', { type: 'file', id: 'import-file', accept: 'application/json', class: 'note' });
  file.addEventListener('change', async () => {
    const chosen = file.files?.[0];
    if (!chosen) return;
    try {
      const payload = JSON.parse(await chosen.text());
      const plan = describeImport(payload);
      const load = () => {
        const result = importAll(payload);
        showToast(`Loaded ${result.stories} stor${result.stories === 1 ? 'y' : 'ies'}`);
        location.hash = '#/stories';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      };
      if (plan.replaced) {
        // Overwriting is the loss worth naming: say which stories, not how many files.
        confirmModal({
          title: 'This backup would replace some of your stories',
          message: `It holds ${plan.stories} stor${plan.stories === 1 ? 'y' : 'ies'}, and ${plan.replaced} of them `
            + `${plan.replaced === 1 ? 'has' : 'have'} the same name as ${plan.replaced === 1 ? 'one' : 'ones'} you already have: `
            + `${plan.replacedTitles.join(', ')}. Loading it puts the backup's version in place, and whatever you have written `
            + 'since is gone. Everything else on your shelf is left alone.',
          confirmLabel: 'Load it anyway',
          onConfirm: load,
        });
      } else {
        load();
      }
    } catch (err) {
      confirmModal({
        title: 'That file did not load',
        message: err.message,
        confirmLabel: 'OK',
        danger: false,
        onConfirm: () => {},
      });
    }
    file.value = '';
  });
  add(screen, el('h3', { text: 'Load a backup' }), el('label', { for: 'import-file', text: 'Choose a backup file' }), file);

  add(screen, el('h3', { text: 'Your first story' }));
  add(screen, el('p', { class: 'note', text: 'A walk through making one story from beginning to end.' }));
  add(screen, el('p', {}, el('a', { class: 'button secondary', href: '#/tutorial', text: 'Read the walkthrough' })));

  add(screen, el('h3', { text: 'About' }));
  add(screen, el('p', { class: 'note', text: 'Story Machine runs the Fabula Deck for Kids by Sefirot (Torino, 2021), written by Andrea Binasco and Matteo di Pascale, illustrated by Matteo Ufocinque. This app is a personal play aid built from a copy of the deck.' }));
  for (const e of CARD_ERRATA) {
    add(screen, el('p', { class: 'note', text: `Note: the ${e.app} divider is printed "${e.printed}" in the English deck. ${e.note}` }));
  }
  return screen;
}

export function notFoundScreen() {
  clearActionBar();
  // Every screen leads somewhere (§6.3.6) — including this one.
  return add(
    el('div'),
    el('h2', { text: 'Nothing here' }),
    el('p', { class: 'empty', text: 'That page does not exist — the link may have been mistyped.' }),
    el('a', { class: 'button', href: '#/stories', text: 'Back to your stories' }),
  );
}


