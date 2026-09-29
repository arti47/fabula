// The three looks (§4). One structure, three skins: `skins/<id>.css` each scoped to
// `:root[data-look="<id>"]`, chosen in Settings and stored with the theme.
//
// They exist so the look can be judged on a real phone with a real story in it rather than in a
// mockup. Two of them will be deleted once one has won; until then each has to pass the same
// contract the app does — no overflow, no tap target under 40px, an action above the fold.

export const LOOKS = [
  {
    id: 'page',
    name: 'Book page',
    blurb: 'Like the booklet: serif all the way down, no boxes, wide margins.',
  },
  {
    id: 'deck',
    name: 'Card table',
    blurb: 'Dark, with the card art across the top of every screen.',
  },
  {
    id: 'sheet',
    name: 'Paper sheet',
    blurb: 'The story on a raised sheet, with the deck’s colours as the accent.',
  },
];

export const DEFAULT_LOOK = 'page';
