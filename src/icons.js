// The app's own icons, drawn here rather than borrowed from the font.
//
// Emoji were platform roulette: ❐ ✎ 🂠 ? rendered as four different things on four devices, and as
// empty boxes where the glyph was missing. These are inline SVG, stroked in `currentColor`, so they
// take the theme and the accent colour for free.
//
// House-drawn chrome, never the deck's art (§10.7, D25): an open book, a nib, a fanned pair of
// cards, a lamp. Nothing here is a card face and nothing carries the deck's lettering.


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
  // An empty shelf, and a page with nothing on it — the two empty states a kid actually meets.
  'empty-shelf': ['M3.5 17.5h17', 'M6 17.5V9.2a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1v8.3', 'M13.6 17.5v-5.3a1 1 0 0 1 1-1H17a1 1 0 0 1 1 1v5.3', 'M8.6 5.6 12 3l3.4 2.6'],
  'empty-page': ['M6.5 3.5h7.6L18 7.4v13.1H6.5z', 'M14 3.5v4h4', 'M9.3 12.2h5.4M9.3 15.4h5.4'],
  // Three rules — the way to everywhere else.
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  // The deck's five group sigils. `GROUPS[].badge` has named these since Phase 0 — die, hat,
  // flask, number, magnifier — and nothing has ever drawn one: dead data the scan could not see,
  // because it reads exports, not fields inside an exported object (§0.1).
  die: ['M5.2 5.2h13.6v13.6H5.2z', 'M9 9h0', 'M15 9h0', 'M9 15h0', 'M15 15h0', 'M12 12h0'],
  hat: ['M4 17.6c4.6-1.6 11.4-1.6 16 0', 'M7.4 17V8.4a4.6 4.6 0 0 1 9.2 0V17', 'M7.4 12.4c3-1.1 6.2-1.1 9.2 0'],
  flask: ['M10 3.4v6.2L5.1 18a1.6 1.6 0 0 0 1.4 2.4h11a1.6 1.6 0 0 0 1.4-2.4L14 9.6V3.4', 'M8.8 3.4h6.4', 'M7.6 14.6h8.8'],
  number: ['M9.4 4.2 7.6 19.8', 'M16.4 4.2 14.6 19.8', 'M4.6 9h15', 'M4.4 15h15'],
  magnifier: ['M10.8 3.6a7.2 7.2 0 1 0 0 14.4 7.2 7.2 0 0 0 0-14.4z', 'M16.1 16.1 20.6 20.6'],
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

/**
 * A larger drawing, for a screen that would otherwise be empty paper.
 *
 * A 24px icon scaled up reads as an abstract shape; these are drawn at their own size. Inked
 * outlines in the deck's idiom, but a book and some sparks — never a card, never its lettering
 * (D25). Stars are filled in the accent; everything else strokes in the current colour.
 */
const DRAWINGS = {
  // A closing flourish for a story that has been read to the end (G12). A rule that tapers, a
  // seal, and two sparks — house-drawn, and nothing about it is a card.
  'story-end': {
    box: '0 0 200 40',
    stroke: [
      'M8 22 C 40 16, 66 24, 86 20',
      'M114 20 c 20 4, 46 -4, 78 2',
      'M100 10.5 a 9.5 9.5 0 1 0 0 19 a 9.5 9.5 0 0 0 0 -19z',
    ],
    spark: [
      'M100 14.2 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8 z',
      'M28 12 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z',
      'M172 12 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z',
    ],
  },
};

/** One drawing, sized by its container rather than by a pixel count. */
export function illustration(name) {
  const spec = DRAWINGS[name];
  if (!spec) return null;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', spec.box);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.4');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of spec.stroke) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  for (const d of spec.spark) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'var(--accent)');
    path.setAttribute('stroke', 'none');
    svg.append(path);
  }
  return svg;
}

export const ICON_NAMES = Object.keys(PATHS);
export const DRAWING_NAMES = Object.keys(DRAWINGS);
