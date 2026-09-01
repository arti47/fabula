# Story Machine

A story-building app that runs the **Fabula Deck for Kids** (Sefirot, Torino, 2021) — the idea, the
ingredients, the nine beats, the boosts, and then the story read back to you.

Built for one person, aged about 10–14, working on their own. No accounts, no network, no adult
required.

## Running it

There is no build step. Serve the folder and open it:

```sh
python3 -m http.server 8000     # or any static server
# then open http://localhost:8000
```

Opening `index.html` from the file system works too, except that the offline install is disabled.

It is also deployed: **https://arti47.github.io/fabula/** — installable from the browser menu on a
phone or tablet ("Add to Home Screen"), and it works offline once opened.

### Card art

The 34 card faces are committed under `assets/cards/`. To regenerate them from your own copy of the
deck's Do-It-Yourself PDF — after a redraw, or at a different size:

```sh
pip install pypdf pillow
python3 tools/extract-cards.py path/to/EN_FabulaforKids_DigitalCards.pdf
```

If a face is ever missing the app carries on and shows a labelled placeholder in its place.

## Your stories

Everything is saved in this browser, on this device. Nothing is uploaded, and there is nothing to
sign into. Settings has **Save a backup file**, which writes a plain JSON file you can read, keep, or
load onto another device.

Because the data lives in the browser, clearing site data clears your stories. Take a backup before
you do anything drastic.

## Development

```sh
npm test      # parse gate + data invariants
npm run smoke # browser smoke: every route, five widths, the end-to-end walk
npm run check # both
```

`CLAUDE.md` is the canonical spec — the system profile, the product decisions, the rulings, the
roadmap and the ledgers. Keep it updated in the same change as the code.

## Credits and licensing

*Fabula Deck for Kids* is by **Andrea Binasco** and **Matteo di Pascale**, illustrated by
**Matteo Ufocinque**, published by **Sefirot Srl**, Torino, 2021 (ISBN 979-12-80241-08-5).
<https://www.fabuladeck.com/for-kids>

This app is a **personal play aid** built from a copy of the deck. The card text it reproduces is
limited to the headlines and the printed questions; everything else is paraphrased in the app's own
voice. The illustrations are Matteo Ufocinque's and are included here so the app shows real cards.

**If you share this app beyond your own household, licensing is your responsibility**, and
permission from Sefirot is the right way to get it. Card faces are referenced by stable id from a
single data file (`data.js`), so original artwork can be substituted wholesale if you need a version
that stands on its own — and deleting `assets/cards/` degrades the app to labelled placeholders
rather than breaking it.
