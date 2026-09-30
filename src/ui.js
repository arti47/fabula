// Themed primitives: modals, toasts, the explain() note, the action bar, the card face.
// No native alert/confirm/prompt anywhere in this app (CLAUDE.md §4).

import { el, add, clear, qs } from './core.js';
import { GROUPS, DIVIDERS, ALL_CARDS } from '../data.js';
import { icon } from './icons.js';

// ---------------------------------------------------------------------------
// explain(): the "what this does" note. Collapsed by default, on every screen (§6.2).
// ---------------------------------------------------------------------------

export function explain(...paragraphs) {
  // `screen-note` marks this as *the screen's* explanation, as against the several collapsible
  // disclosures that share the `.explain` look (a card's examples, a Learn entry). Only one of
  // these may appear on a screen, and D41 says only a few screens carry one at all.
  return el(
    'details',
    { class: 'explain screen-note' },
    el('summary', { text: 'What is this screen for?' }),
    add(el('div'), ...paragraphs.map((p) => el('p', { text: p }))),
  );
}

// ---------------------------------------------------------------------------
// S12 — long guidance folds to three lines, with a "Read more" under it.
//
// The booklet's teaching stays on the screen (§0.1): the whole text is in the document and the
// first three lines are drawn, so the kid meets it at the moment it was written for; only the
// seven-line bubbles that pushed the work down stop taking the screen. One observer on the screen
// mount rather than a call in every module: a Prompt card dealt after a roll brings its own
// guidance with it, long after the route rendered.
// ---------------------------------------------------------------------------

let clampSeq = 0;

function clampOne(node) {
  if (node.dataset.clamp) return;
  node.dataset.clamp = 'measured';
  // The clamp needs `overflow: hidden`, which would cut off the bubble's speech tail above it
  // (D37), so the words go in a box of their own and the bubble keeps its shape.
  const words = add(el('span', { class: 'guidance-text' }), ...node.childNodes);
  node.append(words);
  node.classList.add('is-clamped');
  // Measured with the clamp on: if three lines already hold it, there is nothing to fold.
  if (words.scrollHeight <= words.clientHeight + 2) {
    node.classList.remove('is-clamped');
    return;
  }
  words.id = `guidance-${++clampSeq}`;
  const toggle = el('button', {
    type: 'button', class: 'more-toggle',
    'aria-expanded': 'false', 'aria-controls': words.id,
    text: 'Read more',
    onclick: () => {
      const open = node.classList.toggle('is-clamped') === false;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Show less' : 'Read more';
    },
  });
  // Inside the bubble, under the words it opens: part of what is being said, not a control
  // floating between it and the next thing.
  node.append(toggle);
}

export function watchClamps(root) {
  let queued = false;
  const run = () => {
    queued = false;
    for (const node of root.querySelectorAll('.guidance:not([data-clamp])')) {
      // Not laid out yet (a hidden panel): leave it for the next pass.
      if (node.getClientRects().length) clampOne(node);
    }
  };
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }).observe(root, { childList: true, subtree: true });
  run();
}

// ---------------------------------------------------------------------------
// Action bar. Returns the bar and its spacer together so a caller cannot forget the spacer.
// ---------------------------------------------------------------------------

export function actionBar({ context, label, onClick, href, secondary } = {}) {
  const mount = qs('#action-bar-mount');
  clear(mount);
  if (!label) return null;
  const action = href
    ? el('a', { class: 'button', href, text: label })
    : el('button', { type: 'button', class: 'button', onclick: onClick, text: label });
  add(
    mount,
    add(
      el('div', { class: 'action-bar' }),
      context ? el('span', { class: 'context', text: context }) : null,
      secondary || null,
      action,
    ),
  );
  return el('div', { class: 'action-bar-spacer' });
}

export function clearActionBar() {
  clear(qs('#action-bar-mount'));
}

// ---------------------------------------------------------------------------
// Modals — focus trapped, Escape closes, focus restored, actions primary-first.
// ---------------------------------------------------------------------------

export function modal({ title, body, actions = [] }) {
  const mount = qs('#modal-mount');
  const previous = document.activeElement;

  const dialog = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
  add(dialog, el('h2', { text: title }));
  add(dialog, ...(Array.isArray(body) ? body : [body]));

  const close = () => {
    backdrop.remove();
    if (previous && previous.focus) previous.focus();
  };

  const row = el('div', { class: 'modal-actions' });
  for (const a of actions) {
    add(row, el('button', {
      type: 'button',
      class: `button ${a.kind || 'secondary'}`,
      text: a.label,
      onclick: () => { close(); a.onClick?.(); },
    }));
  }
  add(dialog, row);

  const backdrop = el('div', { class: 'modal-backdrop' }, dialog);
  backdrop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key !== 'Tab') return;
    const focusable = dialog.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });

  add(mount, backdrop);
  (dialog.querySelector('input, textarea, button') || dialog).focus();
  return close;
}

/** Confirm that names what is lost — never "Are you sure?" (§6.1). */
export function confirmModal({ title, message, confirmLabel = 'Yes, do it', onConfirm, danger = true }) {
  modal({
    title,
    body: el('p', { text: message }),
    actions: [
      { label: confirmLabel, kind: danger ? 'danger' : '', onClick: onConfirm },
      { label: 'Cancel', kind: 'secondary' },
    ],
  });
}

export function promptModal({ title, message, label, value = '', confirmLabel = 'Save', onConfirm }) {
  const input = el('input', { type: 'text', id: 'prompt-input', value, class: 'text-input' });
  modal({
    title,
    body: [
      message ? el('p', { text: message }) : null,
      el('label', { for: 'prompt-input', text: label }),
      input,
    ].filter(Boolean),
    actions: [
      { label: confirmLabel, onClick: () => onConfirm(input.value.trim()) },
      { label: 'Cancel', kind: 'secondary' },
    ],
  });
  input.focus();
  input.select();
}

export function showToast(text, ms = 2600) {
  const mount = qs('#toast-mount');
  const node = el('div', { class: 'toast', text });
  add(mount, node);
  setTimeout(() => node.remove(), ms);
}

// ---------------------------------------------------------------------------
// Card face. Art is generated locally and may be absent — render a labelled
// placeholder rather than a broken image (CLAUDE.md §11).
// ---------------------------------------------------------------------------

function cardFace(card) {
  const alt = `${GROUPS[card.group]?.name || ''} card: ${card.headline}`;
  const img = el('img', { class: 'card-face', src: `assets/cards/${card.art}.webp`, alt, loading: 'lazy', decoding: 'async' });
  const holder = el('div');
  img.addEventListener('error', () => {
    img.replaceWith(el('div', {
      class: 'card-face-missing',
      text: `${GROUPS[card.group]?.name || 'Card'} — art not installed`,
    }));
  });
  return add(holder, img).firstChild;
}

/**
 * The same face, as a button that opens it big.
 *
 * The Ingredient cards print their six questions on the art itself, and the answering layout shows
 * that art at 96px. Since the zoom lock (§4) a kid cannot pinch it open either, so without this the
 * card's own words are unreadable everywhere they matter. Not used inside `cardTile`, where the
 * whole tile is already a link.
 */
export function zoomableFace(card) {
  const group = GROUPS[card.group]?.name || 'card';
  const button = el('button', {
    type: 'button',
    class: 'face-button',
    'aria-label': `Look closely at the ${group} card: ${card.headline}`,
    onclick: () => cardLightbox(card),
  });
  return add(button, cardFace(card));
}

/**
 * The card, as big as the screen allows, over whatever you were doing.
 *
 * S14 — and the rest of its group beside it: a swipe, an arrow key or the two buttons turn to the
 * next card of the same kind, the way you would leaf through that part of the deck in your hand.
 */
function cardLightbox(card) {
  const hand = ALL_CARDS.filter((c) => c.group === card.group);
  let index = Math.max(0, hand.findIndex((c) => c.id === card.id));
  const stage = el('div', { class: 'lightbox' });
  const body = [stage];
  let count = null;
  const show = () => {
    const current = hand[index];
    stage.replaceChildren(cardFace(current));
    const dialog = stage.closest('.modal');
    if (dialog) {
      dialog.querySelector('h2').textContent = current.headline;
      dialog.setAttribute('aria-label', current.headline);
    }
    if (count) count.textContent = `${index + 1} of ${hand.length}`;
  };
  const turn = (by) => { index = (index + by + hand.length) % hand.length; show(); };
  if (hand.length > 1) {
    count = el('span', { class: 'lightbox-count', 'aria-live': 'polite' });
    body.push(add(el('div', { class: 'lightbox-turn' }),
      add(el('button', { type: 'button', class: 'icon-button', 'aria-label': 'Previous card', onclick: () => turn(-1) }), icon('prev')),
      count,
      add(el('button', { type: 'button', class: 'icon-button', 'aria-label': 'Next card', onclick: () => turn(1) }), icon('next'))));
    let startX = null;
    stage.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) turn(dx < 0 ? 1 : -1);
    });
  }
  modal({ title: card.headline, body, actions: [{ label: 'Close', kind: 'secondary' }] });
  if (hand.length > 1) {
    stage.closest('.modal')?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') turn(1);
      if (e.key === 'ArrowLeft') turn(-1);
    });
  }
  show();
}

/** One card in a grid. `blank` shows the gentle dot for an untouched card. */
/**
 * One spark burst, once (D36).
 *
 * Fired at the moment the ninth beat stops being blank — not on every render of a finished
 * story, which would be a reward for arriving rather than for writing. It is decoration and
 * carries nothing (§6): `aria-hidden`, no text, removed when it ends, and skipped entirely for
 * anyone who has asked for less motion.
 */
export function burst() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const node = el('div', { class: 'burst', 'aria-hidden': 'true' });
  for (let i = 0; i < 9; i += 1) add(node, el('i', { style: `--a: ${i * 40}deg` }));
  document.body.append(node);
  setTimeout(() => node.remove(), 1100);
}

/**
 * A spread of real card faces, fanned, as the ground of a screen that would otherwise be empty
 * (D40, D43).
 *
 * The deck's art is this product's whole distinction and the first screen showed none of it. This
 * is decoration: `aria-hidden`, every face `alt=""`, nothing here is a control. A face whose file
 * is missing removes itself, so the screen degrades to its own ground rather than to a row of
 * broken images (§11) — the harness runs with `assets/cards/` empty.
 */
export function cardFan(artIds) {
  const fan = el('div', { class: 'card-fan', 'aria-hidden': 'true' });
  artIds.forEach((art, i) => {
    const img = el('img', {
      class: 'fan-card', alt: '', loading: 'eager', decoding: 'async',
      src: `assets/cards/${art}.webp`,
      style: `--seat: ${i - (artIds.length - 1) / 2}`,
    });
    img.addEventListener('error', () => img.remove());
    add(fan, img);
  });
  return fan;
}

export function cardTile(card, { href, sub, blank = false, done = false } = {}) {
  const group = GROUPS[card.group];
  const tile = el(href ? 'a' : 'div', {
    class: 'card',
    href,
    style: `--card-color: var(${group?.colorVar || '--rule'})`,
  });
  return add(
    tile,
    add(
      el('div', { class: 'card-face-holder' }),
      // Nothing written on it yet means it has not been turned over yet (D28). The headline below
      // still names the card, so face-down hides the picture, never which card it is.
      blank ? cardBack(card.group) : cardFace(card),
      // The word below says it too; the mark says it from across the room (G9).
      done ? el('span', { class: 'done-badge', 'aria-hidden': 'true', text: '✓' }) : null,
    ),
    add(
      el('div', { class: 'card-body' }),
      // The group's own sigil beside its name — the deck's five badges, finally drawn (G10).
      add(
        el('div', { class: 'card-group' }),
        group?.badge ? icon(group.badge, { size: 13 }) : null,
        el('span', { text: group?.name || '' }),
      ),
      add(
        el('p', { class: 'card-headline' }),
        document.createTextNode(card.headline),
        blank ? el('span', { class: 'card-blank', role: 'img', 'aria-label': 'nothing written here yet' }) : null,
      ),
      sub ? el('div', { class: 'card-sub', text: sub }) : null,
    ),
  );
}

/**
 * The cast strip (S3): who and where the story has, pinned above the work.
 *
 * Steps one to four are forms; without this a kid writes for twenty minutes and never sees what
 * they have made. Each chip wears the card its answers live on and links back to it. Returns null
 * when the story has invented nobody, so an empty strip never takes up room.
 */
export function castRow(entries) {
  if (!entries.length) return null;
  const strip = el('div', { class: 'cast-strip' });
  add(strip, el('h3', { class: 'visually-hidden', text: 'Who and where, so far' }));
  for (const entry of entries) {
    const chip = el('a', { class: `cast-chip is-${entry.kind}`, href: entry.href });
    const art = el('span', { class: 'cast-art', 'aria-hidden': 'true' });
    if (entry.art) art.style.backgroundImage = `url("assets/cards/${entry.art}.webp")`;
    add(chip, art);
    add(chip, el('span', { class: 'cast-name', text: entry.name }));
    add(strip, chip);
  }
  return strip;
}

/**
 * A card that arrives face-down and turns over (D26/D29).
 *
 * One at a time, never a grid: two sides in the DOM is fine for the card you are looking at and a
 * paint budget problem for thirty of them (§4). `deal` starts it face-down and turns it on the
 * next frame; reduced motion collapses the turn to nothing, which is the same card either way.
 */
export function dealtFace(card, { deal = false } = {}) {
  const wrap = el('div', { class: `flipper${deal ? ' is-face-down' : ''}` });
  add(wrap, add(
    el('div', { class: 'flipper-inner' }),
    add(el('div', { class: 'flipper-side is-front' }), zoomableFace(card)),
    add(el('div', { class: 'flipper-side is-back' }), cardBack(card.group)),
  ));
  if (deal) requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove('is-face-down')));
  return wrap;
}

/**
 * The back of a card (D28).
 *
 * The deck ships no back, so the group's divider becomes one: scaled to fill, washed in the
 * group's colour and framed. A2 is amended for exactly this — a divider may be card-shaped when it
 * is a back, never when it is a face. The Idea group has no divider and gets the plain colour.
 */
export function cardBack(groupId) {
  const divider = DIVIDERS.find((d) => d.group === groupId);
  const back = el('div', {
    class: 'card-back',
    'aria-hidden': 'true',
    style: `--card-color: var(${GROUPS[groupId]?.colorVar || '--rule'})`,
  });
  if (divider) back.style.backgroundImage = `url("assets/cards/${divider.art}.webp")`;
  return add(back, el('span', { class: 'card-back-frame' }));
}

/**
 * The deck's own group divider, as a band across the head of its section.
 *
 * The four divider images shipped in `assets/` and appeared on no screen at all — dead art, the
 * §0.1 defect in another coat. A2 says the app does not render a divider *as a card*, so this is a
 * wide strip rather than an upright face: it cannot be mistaken for something to tap, and it never
 * sits in a card grid (D25, G5). Returns null for a group with no divider, so the Idea section
 * simply has none.
 */
export function groupBanner(groupId) {
  const divider = DIVIDERS.find((d) => d.group === groupId);
  if (!divider) return null;
  const band = el('div', {
    class: 'group-banner',
    style: `--card-color: var(${GROUPS[groupId]?.colorVar || '--rule'})`,
  });
  const img = el('img', {
    src: `assets/cards/${divider.art}.webp`,
    alt: '',
    loading: 'lazy',
    decoding: 'async',
  });
  img.addEventListener('error', () => band.remove());
  return add(band, img);
}

/**
 * The answering layout: a card face and the question about it. One column on a phone, two on a
 * tablet — the card stays visible beside the field instead of scrolling away above it (D12).
 */
/**
 * The answering stage (D29): the card at its real proportion, and the question written on it.
 *
 * The field sits on a panel laid over the card's lower half, so the illustration is visible above
 * and around it and the thing you are writing on is the card rather than a form with a thumbnail.
 * The panel is axis-aligned and opaque — a tilted or translucent writing surface breaks focus
 * rings, carets and iOS scroll-into-view, which is where "physical" stops being worth it.
 * From 768 it goes back to two columns, where there is width for the card to stand beside.
 */
export function answerStage(face, body) {
  return add(
    el('div', { class: 'answer-stage' }),
    add(el('div', { class: 'stage-card' }), face),
    add(el('div', { class: 'stage-panel' }), ...body),
  );
}

export function answerLayout(face, body) {
  return add(
    el('div', { class: 'answer-layout' }),
    add(el('div', { class: 'answer-face' }), face),
    add(el('div', { class: 'answer-body' }), ...body),
  );
}

/** Example line, labelling anything this project added rather than Sefirot (§2.2). */
export function exampleLine(example) {
  return add(
    el('li'),
    el('b', { text: `${example.ref}: ` }),
    document.createTextNode(example.text),
    example.house ? el('span', { class: 'house-flag', text: 'our example' }) : null,
  );
}
