// Themed primitives: modals, toasts, the explain() note, the action bar, the card face.
// No native alert/confirm/prompt anywhere in this app (CLAUDE.md §4).

import { el, add, clear, qs } from './core.js';
import { GROUPS } from '../data.js';

// ---------------------------------------------------------------------------
// explain(): the "what this does" note. Collapsed by default, on every screen (§6.2).
// ---------------------------------------------------------------------------

export function explain(...paragraphs) {
  return el(
    'details',
    { class: 'explain' },
    el('summary', { text: 'What is this screen for?' }),
    add(el('div'), ...paragraphs.map((p) => el('p', { text: p }))),
  );
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

export function cardFace(card) {
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

/** One card in a grid. `blank` shows the gentle dot for an untouched card. */
export function cardTile(card, { href, sub, blank = false } = {}) {
  const group = GROUPS[card.group];
  const tile = el(href ? 'a' : 'div', {
    class: 'card',
    href,
    style: `--card-color: var(${group?.colorVar || '--rule'})`,
  });
  return add(
    tile,
    cardFace(card),
    add(
      el('div', { class: 'card-body' }),
      el('div', { class: 'card-group', text: group?.name || '' }),
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
 * The answering layout: a card face and the question about it. One column on a phone, two on a
 * tablet — the card stays visible beside the field instead of scrolling away above it (D12).
 */
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
