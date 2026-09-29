// The app's own icons, drawn here rather than borrowed from the font.
//
// Emoji were platform roulette: ❐ ✎ 🂠 ? rendered as four different things on four devices, and as
// empty boxes where the glyph was missing. These are inline SVG, stroked in `currentColor`, so they
// take the theme and the accent colour for free.
//
// House-drawn chrome, never the deck's art (§10.7, D25): an open book, a nib, a fanned pair of
// cards, a lamp. Nothing here is a card face and nothing carries the deck's lettering.

import { el } from './core.js';

const SVG = 'http://www.w3.org/2000/svg';

const PATHS = {
  // A book lying open — the shelf of stories.
  stories: ['M3 6.2c3.1-1.5 6-1.5 9 0v13c-3-1.5-5.9-1.5-9 0z', 'M21 6.2c-3.1-1.5-6-1.5-9 0v13c3-1.5 5.9-1.5 9 0z'],
  // A nib, mid-stroke — building a story.
  build: ['M4.5 19.5 6 15l9-9 3 3-9 9z', 'M14 7l3 3', 'M4.5 19.5 6.6 18.6'],
  // Two cards, fanned — the deck.
  deck: ['M9 4.2h7.5a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 19V5.7A1.5 1.5 0 0 1 9 4.2z', 'M5.4 7.2 4 7.7a1.5 1.5 0 0 0-.95 1.9l3.2 9.6'],
  // A lamp, lit — the rules library.
  learn: ['M12 3.5a5 5 0 0 1 3.2 8.8c-.7.6-1.1 1.3-1.2 2.2h-4c-.1-.9-.5-1.6-1.2-2.2A5 5 0 0 1 12 3.5z', 'M10 17.5h4', 'M10.6 20.2h2.8'],
  // Sun and moon, for the theme toggle.
  light: ['M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2z', 'M12 2.6v1.8M12 19.6v1.8M2.6 12h1.8M19.6 12h1.8M5.3 5.3l1.3 1.3M17.4 17.4l1.3 1.3M18.7 5.3l-1.3 1.3M6.6 17.4l-1.3 1.3'],
  dark: ['M20 14.6A8.6 8.6 0 0 1 9.4 4a8.6 8.6 0 1 0 10.6 10.6z'],
  // A cog — settings.
  settings: ['M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z', 'M12 2.8l1.2 2.3 2.6-.5.5 2.6 2.3 1.2-1.3 2.3 1.3 2.3-2.3 1.2-.5 2.6-2.6-.5L12 21.2l-1.2-2.3-2.6.5-.5-2.6-2.3-1.2L6.7 12 5.4 9.7l2.3-1.2.5-2.6 2.6.5z'],
};

/** One icon, 24×24, stroked in the colour of whatever it sits in. */
export function icon(name, { size = 24 } = {}) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of PATHS[name] || []) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** The same icon in a span, for places that want a block to align. */
export function iconSlot(name, className) {
  const slot = el('span', { class: className, 'aria-hidden': 'true' });
  slot.append(icon(name));
  return slot;
}

export const ICON_NAMES = Object.keys(PATHS);
