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

### Card art (one-time step)

The card illustrations are not in this repository (see **Licensing** below). Generate them from your
own copy of the deck's Do-It-Yourself PDF:

```sh
pip install pypdf pillow
python3 tools/extract-cards.py path/to/EN_FabulaforKids_DigitalCards.pdf
```

That writes 34 faces into `assets/cards/`. Without it the app still works — every card shows a
labelled placeholder instead of its picture.

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
limited to the headlines and the printed questions; everything else is paraphrased. The
illustrations are Sefirot's and are deliberately **not distributed here** — they are generated
locally from your own copy.

If you share this app beyond your own household, licensing is your responsibility, and permission
from Sefirot is the right way to get it. Card faces are referenced by stable id from a single data
file, so original artwork can be substituted wholesale if you need a version that stands on its own.
