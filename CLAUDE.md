# Story Machine — canonical project spec

An installable, offline-first web app that runs **Fabula Deck for Kids** (Sefirot, 2021) as a
guided story-building tool. This file is the project's living spec: **every code change updates
it in the same change** — features, data model, file tables, roadmap checkboxes, ledger ticks,
changelog.

Instantiated from *RPG Player-Character App — Autonomous Build Instructions (v3)*, adapted for a
storytelling deck rather than an RPG. Where that template's section numbers are cited (§6.2,
§11.1…), they refer to the template, which remains the authority on process.

---

## 0. The one thing that goes wrong — this project's version

The template's dominant defect is *"data extracted faithfully, unit-tested, documented in the UI —
and never called."* This deck has no arithmetic to leave inert, so the defect wears two other coats
here, and both are the same bug:

> **1. Guidance extracted, never surfaced.** The booklet's explanations and examples — why a
> Relapse exists, what Cinderella's ball gown demonstrates, the six answers for the Wolf — get
> written into `data.js` and the card shows only its headline. The kid then faces a bare question
> with none of the teaching the book wrote for exactly that moment.
>
> **2. A permission granted, with no control.** Nearly every rule in this book is a Permission
> (§3.0). "You can skip one", "you can use the same one twice", "roll again", "you may invent a new
> card" — each reads as flavour and each needs a *button*. A permission with no control is a rule
> the app has silently removed.

Both are found mechanically, not by reading (§11.2.1): every guidance string and every example in
the data files must have a consumer, and every permission in the ledger must name its control.

---

## 1. What you are building

| | |
|---|---|
| **Source** | *Fabula Deck for Kids*, Sefirot Srl, Torino, 2021 (ISBN 979-12-80241-08-5) — the 68-page booklet, plus the EN Do-It-Yourself digital card PDF (34 card faces + a die net) |
| **Audience** | One kid, aged 10–14, playing alone |
| **Platforms** | Phone and tablet, both laid out properly; one installable PWA |
| **Core job** | Build a story through the deck's five steps, keep it, and read it back — before and after the Boosts |
| **Storage** | Local-only (`localStorage`) + JSON export/import. Schema shaped so cloud sync is a later phase, not a rewrite |
| **Theme** | Storybook: cream paper, ink text, ribbon-shaped headings, the deck's own four group colours. Light + dark, default follows the device |
| **Name** | Story Machine (after the Idea card's *Petasvs Excogitatoris*) |

**Mandatory scope:** the five-step guided build (Idea → Ingredients → Structure → Boost → Tell) ·
a library of stories scoped per storyteller · the ideas die with a visible roll log · the full
30-card deck browsable as reference · every card carrying the booklet's guidance and its worked
example · the before/after story page with print and plain-text export · JSON export/import ·
a searchable rules library · a per-screen "what this does" note · a first-story tutorial ·
offline install.

**Explicitly out of scope** (the deck has no such thing — never invent mechanics): scores, points,
timers, win/lose states, levels, streaks, combat, resources, character stats, advancement.
**Dropped by product decision:** in-app drawing and photo capture (D3), the adult- and
classroom-play rule chapters (D14), read-aloud, voice input, AI assistance of any kind,
non-English content.

---

## 1.1 Product decisions (Stage B, recorded)

| # | Decision | Answer | What it binds |
|---|---|---|---|
| D1 | Seat | A child, playing alone | No adult assumed present; the app must be self-sufficient |
| D2 | Age band | 10–14 | Denser screens, more craft, a tool not a toy. No read-aloud |
| D3 | Deck mode | Fully digital | The app shows card faces and rolls the die; art is load-bearing |
| D4 | Distribution | Shared with friends / a school | Private repo; art swappable behind one data file; licensing note in README |
| D5 | Stories | A library, plus storytellers | Local profiles; every module takes a story id, never assumes one story |
| D6 | Storage | Device now, cloud later | localStorage + export/import; sync-shaped schema; Firebase is Phase 10, gated |
| D7 | Stuck help | Book examples + offline spark tables | No network, no key, no AI. Sparks are house aids (§2.2), labelled as such |
| D8 | Drawing step | Guide only, no images | The seven tips ship as a rules-library chapter; no canvas, no camera, no image storage |
| D9 | Flow | Guided path, escapable | Wizard order by default; skip / come back / add-another visible on every screen |
| D10 | Payoff | Story page, before and after | Pre-Boost draft snapshotted; both versions readable; print + plain-text export |
| D11 | Examples | Both worked stories readable, plus inline hints | Little Red Riding Hood and Hänsel & Gretel as openable read-only stories |
| D12 | Device | Phone and tablet, both properly | Tablet adds density (two columns, card + questions side by side), never stretches |
| D13 | Input | Typing, short answers encouraged | Phrase-sized fields, visible "a sentence is enough", autosave |
| D14 | Table rules | Left out | The adult and classroom chapters do not ship |
| D15 | Theme | Storybook, follows system | Light + dark, in-app override, group colours as semantics |
| D16 | Language | English only | Strings written inline; no i18n scaffolding |
| D17 | Boost depth | Create cards **and** rewrite beats | A Boost can spawn an Ingredient card and send you back to edit a beat |
| D18 | Name | Story Machine | Home screen, install icon, tab title |

---

## 2. Sources and precedence

> **card PDF (art + printed card text) > booklet text > my summary of either**

- **Card faces** come from `EN_FabulaforKids_DigitalCards.pdf` (9 pages, 34 images at 955×1190).
  Verified inventory in `docs/card-inventory.md`.
- **Guidance and examples** come from the booklet, which is the only source for them — the printed
  cards carry a headline and, on Ingredient cards, their questions. Nothing else.
- **Paraphrase, never copy.** The booklet's explanations are rewritten concisely in the app's own
  voice. Card headlines and the printed Ingredient questions are reproduced verbatim because they
  *are* the card. No setting content, no reproduction of booklet prose.
- **Where the card and the booklet differ**, the card wins and the difference is recorded as an
  erratum constant with its ruling id.

### 2.1 House aids
`data-sparks.js` exports `HOUSE_AID = true`. Its tables are invented by this project, not by
Sefirot, and **every screen that shows a spark labels it as a house aid**. Sparks are single words
or short phrases that feed interpretation — never finished story content.

---

## 3. System profile (completed)

### 3.0 Rule-shape census

| Shape | Count | Where it lives |
|---|---|---|
| **Permission** | 10 | A control each — see the permission inventory below. The dominant shape |
| **Procedure** | 5 | The five steps, in order, escapable |
| **Lookup** | 2 | d6 face → Prompt card; beat number → Structure card |
| **Sequence** | 1 | The nine beats are ordered and numbered |
| Cost · Threshold · Future-cost · Gate · Compulsion · Cascade · Conversion · Opposed | **0** | The deck has no economy, no failure state, and nothing to enforce against the player |

**Permission inventory** — each row is a feature, not flavour:

| id | The book says | Control |
|---|---|---|
| P1 | Skip a card you don't like | "Skip for now" on every card, reversible |
| P2 | Use the Ingredient cards in any order | Ingredient step is a grid, not a queue |
| P3 | Use the same card twice — two heroes, two villains, two worlds | "Add another" on each Ingredient type, uncapped |
| P4 | Roll again until you get a good prompt | Re-roll, always available, log keeps every roll |
| P5 | Answer later if nothing comes to mind | Blank is legal everywhere; progress counts, never blocks |
| P6 | Invent a new Ingredient card during the Boost step | "This gives me a new character" on Boost answers (D17) |
| P7 | Change an earlier beat during the Boost step | "Go back and change beat N" from a Boost (D17) |
| P8 | Skip Boost cards; you don't have to use them all | Boosts are a 10-card grid, none required |
| P9 | Tell it all over again | The Tell step, with before/after |
| P10 | Draw it | **Guidance only** — the seven tips as a chapter (D8) |

### 3.1 The idea die
One d6. Faces `P M Q G N S`, one per Prompt card. Roll, read the card, take the idea or **roll
again — freely, no cost, no limit**. The booklet: *"you just didn't get a good Prompt card. Roll the
die again."* A kid who already has an idea skips the die entirely.

Implementation: `crypto.getRandomValues`, never `Math.random()` (§5.1). Every roll is logged to the
story with its timestamp and shown as a small history — the fairness record, and here also a record
of how the idea was found.

### 3.2 The five steps

| Step | Cards | What the app captures |
|---|---|---|
| 1 Idea | Idea card + 6 Prompts + die | One sentence: "I want to tell the story of…" |
| 2 Ingredients | 4 cards, any order, repeatable | Main character(s), antagonist(s), world(s), the inciting event |
| 3 Structure | 9 cards, numbered 1–9 | One passage per beat |
| 4 Boost | 10 cards, any order, all optional | An answer each; may spawn cards (P6) and rewrite beats (P7) |
| 5 Tell | — | The assembled story, before and after the Boosts |

### 3.3 The cards
Full verified inventory: `docs/card-inventory.md`. Summary: 6 Prompts (P/M/Q/G/N/S) · 1 Idea ·
4 Ingredients (Main Character and Antagonist share the same six questions; World has four;
Something Happens has four) · 9 Structure beats · 10 Boosts · 4 non-playable group dividers.
**30 playable cards, 34 images.**

### 3.4 Guidance and examples
Every playable card carries three layers of text (§6.6):
1. **Headline** — verbatim from the card face.
2. **What this is for** — 2–4 sentences, paraphrased from the booklet's chapter for that card.
3. **Examples** — the booklet's own, per card: Little Red Riding Hood's six answers on the Main
   Character card, the Wolf's on the Antagonist card, Cinderella's ripped gown on the Second Trial,
   Hänsel's pebbles on the Threshold, and so on.

A card whose guidance or examples exist in `data.js` but appear on no screen is defect class §0.1.

### 3.5 Ambiguity rulings

| id | Question | Ruling |
|---|---|---|
| A1 | Structure cards 4 and 5 share the headline "But all of a sudden" | Distinguish by number badge and beat name (First Trial / Second Trial); headline is the subtitle |
| A2 | Is the deck 34 cards or 30? | Both: 34 printed images, of which 4 are group dividers carrying no prompt. The app has 30 playable cards and does not render dividers as cards |
| A3 | The EN Structure divider is printed "STRUTTURA" | Untranslated in the EN print. Recorded in `CARD_ERRATA`; the app says Structure everywhere |
| A4 | The die art shows letters at angles that could read as other letters | The booklet is authoritative: faces are P, M, Q, G, N, S |
| A5 | "Something Happens" is both an Ingredient card and Structure beat 2 (Call to Action) | One story fact, two homes. Beat 2 is **pre-filled** from the Ingredient answer, editable afterwards, and the app says where it came from. One record, never two (§10.11) |
| A6 | Does the rolled Prompt constrain the story afterwards? | No. The booklet uses Prompts only to find the idea. The app pins the rolled letter to the story as provenance and gates nothing on it |
| A7 | How many heroes / villains / worlds may a story have? | Uncapped. The booklet explicitly permits two and gives no limit (P3) |
| A8 | When is the "before" version frozen? | Automatically when the Boost step is first opened. A later "update the before-version to now" control exists and confirms while naming what it discards (§6.4) |
| A9 | Must the nine beats be filled in order? | No. Order is presentational; any beat is answerable at any time (P5) |
| A10 | What marks a story "finished"? | Nothing does. The Tell step is reachable whenever the kid wants it; the app never withholds it or scores completeness. Progress is shown, never enforced |

---

## 4. Architecture — LOCKED

- **No build step.** Vanilla JS, native ES modules loaded directly by the browser.
  Clone-and-run must always work.
- **Installable PWA**: `manifest.json`, `service-worker.js`, an SVG icon, and an
  "Update available — reload" toast. App shell and data cached and versioned
  (`CACHE_VERSION` bumped on any shipped-file change); navigation requests network-first with a
  cache fallback. The update path is tested explicitly.
- **Storage**: `localStorage`, one key per storyteller index plus one per story. Plain JSON,
  exportable and re-importable in one tap, in a shape a human can read.
- **No accounts, no network, no telemetry.** Nothing a child types leaves the device. This is a
  product requirement, not an implementation detail, and it is stated in the README.
- **Randomness**: `crypto.getRandomValues` for the die. Roll once, store it, render from the stored
  value — never re-roll on a re-render.
- **Themed UI primitives**: no native `alert/confirm/prompt`; a shared `modal()` +
  `showToast/confirmModal/promptModal`, focus-trapped, Escape-closable, `aria-modal`, focus
  restored, sized to the visual viewport. Modal actions ordered primary-first, everywhere.
- **Null-safe DOM helpers**: the element factory skips nullish children; `add(parent, …children)`
  is used for every append of a value that can be null (§13 D-1).
- **Accessibility**: keyboard and screen-reader usable, `aria-live` on the die result and on
  autosave confirmations, labelled icon-only buttons, `aria-current` nav, visible focus.
  WCAG 2.2 AA target sizes (24×24 floor with spacing, 44 as the design target).
- **Zoom lock** (`user-scalable=no`, inputs ≥16px) **is paid back** with a text-size control in
  Settings that scales the app's own type, persisted with the theme.
- **Responsive**: zero horizontal overflow at 320 / 360 / 390px; tablet layouts at 768 and 1024
  that add density rather than stretching (D12).

---

## 5. File structure

| File | Purpose |
|---|---|
| `index.html` | App shell: header, story header, section nav, screen mount, module entry |
| `styles.css` | Storybook theme (light + dark) + all component styles |
| `data.js` | The deck: all 30 playable cards — headline, group, badge, art path, questions, guidance, examples |
| `data-examples.js` | The two booklet stories as complete story records (Little Red Riding Hood; Hänsel & Gretel before *and* after Boosts) |
| `data-sparks.js` | Invented spark tables, `HOUSE_AID = true` |
| `data-learn.js` | Rules-library chapters: the five steps, the nine beats, the ten boosts, the seven drawing tips |
| `assets/cards/*.webp` | 34 faces (30 playable + 4 dividers), 760px WebP, ids per `docs/card-inventory.md`. **Gitignored** — generated locally by `tools/extract-cards.py` |
| `tools/extract-cards.py` | Regenerates the card faces from the user's own DIY PDF |
| `manifest.json`, `service-worker.js`, `icon.svg` | PWA |
| `tests/` + `package.json` | Dev-only harnesses; `node_modules` gitignored; not in the SW app shell |
| `README.md` | Setup, offline/privacy statement, and the licensing note (§12 of the template) |
| `CLAUDE.md` | This file |
| `docs/card-inventory.md` | The verified card extraction, with source page/image ids |
| `docs/AUDIT.md` | Numbered findings, pass by pass, plus the verified-clean list |

### 5.1 `src/` module map

| Module | Responsibility |
|---|---|
| `core.js` | Constants, DOM/util helpers (incl. null-safe `add`), `roll()` on `crypto`. No imports |
| `ui.js` | Modals, toasts, confirms, the collapsible `explain()` note, the pinned action bar, the card component |
| `cards.js` | One lookup per kind of thing: `getCard(id)` resolves any card in any group, including nothing else (§10.16) |
| `store.js` | Storytellers, stories, autosave, snapshot/restore, JSON export/import, the die-roll log |
| `derived.js` | Progress counts, "what's still blank", story assembly for the Tell page, data normalization/migration |
| `build.js` | The guided five-step path and its section nav |
| `idea.js` | Step 1: die, Prompt cards, the idea sentence |
| `ingredients.js` | Step 2: cast, worlds, inciting event; add-another; the six/four questions |
| `structure.js` | Step 3: the nine beats, beat 2 pre-fill (A5) |
| `boost.js` | Step 4: the ten boosts, card-spawning (P6), beat rewrites (P7), the snapshot (A8) |
| `tell.js` | Step 5: assembled story, before/after toggle, print view, plain-text export |
| `library.js` | Storyteller profiles, the shelf of stories, example stories |
| `deck.js` | Browse all 30 cards as reference |
| `learn.js` | Searchable rules library, accordion by subject in play order |
| `sparks.js` | Spark tables, always labelled as house aids |
| `settings.js` | Theme, text size, export/import, data check, about |
| `tutorial.js` | First-story walkthrough |
| `router.js` | Tab routing, section nav, live-state badges |
| `main.js` | Entry point / boot |

When adding or moving a `src/` file: update this file's tables **and** the service-worker app-shell
list, then bump `CACHE_VERSION` — in the same change.

---

## 6. Screen anatomy

```
┌──────────────────────────────┐
│ app header (Story Machine · theme · settings)   sticky
├──────────────────────────────┤
│ story header: title · Ingredients 3/4 · Beats 5/9 · Boosts 2/10   sticky
├──────────────────────────────┤
│ section nav (Idea · Ingredients · Structure · Boost · Tell)
│ screen content ← scrolls
├──────────────────────────────┤
│ action bar (Next card · Roll · Read my story)   fixed
├──────────────────────────────┤
│ tab bar: Stories · Build · Deck · Learn         fixed
└──────────────────────────────┘
```

- The **story header is this app's persistent resource header** (§6.2): the counts that tell a kid
  what is still blank, visible from every in-story screen. It is progress, never a score.
- **Group colour is semantic**: red Prompts, yellow Ingredients, blue Structure, green Boosts —
  the deck's own code, and never the only channel (every card names its group in text too).
- **The primary action is above the fold on every screen**, pinned in the action bar where content
  is long, carrying its context ("Next: Antagonist", "Roll again", "3 beats still blank").
- Controls are ordered by the sequence of play; blocks are ordered by how often they are touched.
- **Destructive controls sit at the end of a scroll**, never in the thumb's resting arc.
- Reduced motion honoured; no animation carries information.

## 6.1 Feedback

- **Toast** for a result needing no decision ("Saved"). **Modal** for something that must be read.
  **Inline** for state that persists.
- **Destructive actions confirm and name the loss**: "Re-freezing the 'before' version replaces the
  draft you had when you started boosting. You can't get it back."
- **Empty states point forward** and are written for a kid: an empty shelf says what to do next.
- **Nothing scolds.** Blank answers are legal (P5); the app never says a story is incomplete.

## 6.2 Teaching layers (§6.6)

1. **`explain()`** — a collapsed `<details>` under every screen heading, 2–4 sentences in the app's
   voice: what this screen is for, what it does for you, what the book asks of you here.
2. **The rules library** — one entry per card and per step, in the app's own words, in play order,
   searchable, collapsed until opened. **Every card links to its entry.**
3. **The tutorial** — a first-story walkthrough on its own route, linked from the home screen while
   the shelf is empty and permanently from Settings.
4. **In-context teaching** — the booklet's example appears on the card being answered, not in a
   separate chapter. This is the layer that actually lands, and it is where the booklet's teaching
   lives (§0.1).

**Voice**: the app uses the book's own names — Ordinary World, Call to Action, the Threshold,
Relapse, Boosts, Ingredients — and speaks to a 10–14 year old as a collaborator, never a teacher.

---

## 7. Data model

```
storyMachine.storytellers        [ { id, name, emoji, createdAt } ]
storyMachine.currentStoryteller  id
storyMachine.story.<id>
  { id, ownerId, title, createdAt, updatedAt, schemaVersion,
    idea:    { text, fromPrompt: "P"|"M"|"Q"|"G"|"N"|"S"|null,
               rolls: [ { letter, ts } ] },                       // A6, P4
    cast:    [ { id, kind: "hero"|"villain",
                 answers: { age, looks, special, fear, want, name },
                 origin: "ingredients" | "boost:<boostId>" } ],   // P3, P6
    worlds:  [ { id, answers: { special, whereWhen, typicalDay, peopleDo } } ],
    inciting:{ answers: { what, goodOrBad, antagonistsFault, howItChanges } },
    beats:   { "1".."9": { text, updatedAt, prefilledFrom?: "inciting" } },  // A5
    boosts:  { <boostId>: { answer, skipped: bool,
                            spawned: [castId…], editedBeats: [n…] } },       // P6, P7
    snapshot:{ takenAt, beats, cast, worlds, inciting } | null,              // A8, D10
    skipped: [cardId…] }                                                     // P1
```

Rules: every schema addition ships a normalization path that back-fills defaults on old stories and
**a fixture test that loads a hand-written old-shape record** (§10.17). Every field addition is
documented here in the same change. Nothing in the schema is written that no screen reads.

---

## 8. Roadmap

- [ ] **Phase 0 — Foundations.** Scaffold every file above; extract the complete card data per the
      ledger (data before features); storybook theme, light + dark; PWA shell; router, the §6 frame,
      two-level nav; localStorage layer.
- [ ] **Phase 1 — Library & storytellers.** Profiles, the shelf, create/open/rename/delete a story,
      JSON export/import, normalization + migration.
- [ ] **Phase 2 — Step 1: Idea.** The die (crypto, logged, re-rollable), the six Prompt cards with
      their guidance and examples, the idea sentence, "I already have an idea" path, sparks.
- [ ] **Phase 3 — Step 2: Ingredients.** The four cards in any order (P2), add-another (P3),
      per-question fields with the booklet's example answers inline, skip and return (P1, P5).
- [ ] **Phase 4 — Step 3: Structure.** The nine beats with guidance and examples; beat 2 pre-fill
      from the inciting event (A5); free order (A9).
- [ ] 🏁 **Milestone — First Story Tellable.** Create a storyteller → roll or write an idea →
      ingredients → nine beats → read it back, end to end, on a phone, with zero console errors.
- [ ] **Phase 5 — Step 4: Boost.** Ten boost cards; the snapshot on first entry (A8); spawning a new
      Ingredient card from a boost (P6); jumping back to rewrite a beat and returning (P7).
- [ ] **Phase 6 — Step 5: Tell.** The assembled story page, before/after toggle, print stylesheet,
      plain-text export.
- [ ] **Phase 7 — Deck, Learn, Examples, Tutorial.** Card browser; searchable rules library incl.
      the seven drawing tips (D8); the two worked stories as readable stories (D11); the tutorial.
- [ ] **Phase 8 — Tablet.** The second layout that adds density (D12), at 768 and 1024.
- [ ] **Phase 9 — Hardening.** The three harnesses (§9), accessibility pass, measured layout and
      stress passes, flow walk, audit cycles to a clean cycle.
- [ ] **Phase 10 — Cloud sync (gated, D6).** Only if asked for: accounts, sync, and the children's
      privacy work that comes with it.

### 8.1 Data extraction ledger

An unticked box means the data is not extracted. **Never build UI against an unticked table.**

| id | Table | Target | Consumer | Done |
|---|---|---|---|---|
| T1 | 6 Prompt cards: letter, headline, guidance, examples | `data.js` | `idea.js` | [ ] |
| T2 | Idea card: headline, the "what if you have no idea" path | `data.js` | `idea.js` | [ ] |
| T3 | 4 Ingredient cards: headline, printed questions, guidance | `data.js` | `ingredients.js` | [ ] |
| T4 | 9 Structure cards: number, headline, beat name, guidance | `data.js` | `structure.js` | [ ] |
| T5 | 10 Boost cards: headline, guidance | `data.js` | `boost.js` | [ ] |
| T6 | Little Red Riding Hood's answers, per card | `data.js` | card example line | [ ] |
| T7 | Hänsel & Gretel, both versions, as story records | `data-examples.js` | `library.js` | [ ] |
| T8 | The 7 drawing tips | `data-learn.js` | `learn.js` | [ ] |
| T9 | Rules-library chapters (5 steps, 9 beats, 10 boosts) | `data-learn.js` | `learn.js` | [ ] |
| T10 | Spark tables (house aid) | `data-sparks.js` | `sparks.js` | [ ] |
| T11 | Card art: 34 images → WebP, id-mapped (760px, q80, 3.2MB total, max 195KB) | `assets/cards/`, generated | `ui.js` card | [x] |
| T12 | `CARD_ERRATA` (A3) | `data.js` | `learn.js` | [ ] |

### 8.2 Traceability ledger

One row per permission and per procedure. **A row with a gap is the §0 defect, visible before it
ships.** Fill the row when you build the rule, not at audit time.

| Rule | Shape | Data | Engine | Surface | Test |
|---|---|---|---|---|---|
| P1 skip any card | Permission | — | `store.skipCard` | Skip button, every card | skipped card stays reachable |
| P3 two heroes | Permission | — | `store.addCastMember` | "Add another" | second hero persists and appears in the story |
| P4 re-roll freely | Permission | `PROMPTS` | `idea.roll` | Roll again | every roll logged, none discarded |
| P6 boost spawns a card | Permission | `BOOSTS[].canSpawn` | `boost.spawnCard` | "This gives me a new character" | spawned card carries `origin` and appears in Tell |
| P7 boost rewrites a beat | Permission | — | `boost.editBeat` | "Change beat N" | beat edit lands, snapshot still holds the old text |
| A5 beat 2 pre-fill | Sequence | — | `structure.prefillBeat2` | Beat 2, with provenance line | editing beat 2 does not rewrite the ingredient |
| A8 snapshot | Procedure | — | `store.snapshot` | Automatic on Boost entry | before/after differ after a boost edit |
| D10 before/after | Procedure | — | `derived.assemble` | Tell page toggle | both versions render from one record |
| P10 draw it | Permission | `DRAWING_TIPS` | **guidance only** | Learn chapter | tips render; nothing else claims to |

---

## 9. Harnesses and audit

**A. Unit + data (`npm test`, seconds).** Parses every source and data file first (`node --check`,
failing by filename). Then: 30 playable cards exactly; 6 prompts, one per die letter, no duplicates;
beats numbered 1–9, unique, none missing; 10 boosts; every card has headline + guidance + at least
one example; every art path resolves; the die is uniform over 60k rolls within tolerance; export →
import round-trips a full story byte-identically; an old-shape fixture normalizes.

**B. Browser smoke (Playwright, ~1 min).** Every route renders with zero console errors; zero
horizontal overflow at 320/360/390 and no stretched layout at 768/1024; no stray
`null`/`undefined`/`NaN` text; nothing under the fixed tab bar; every screen's primary action above
the fold; section nav reaches every sibling; no tap target under 40px measured on the wrapping
label; the full walk: storyteller → story → roll → idea → ingredients → beats → boost → tell.

**C. Interaction audit (Playwright, ~1 min).** Visits every route, clicks every visible control in
isolation with storage reset between clicks, and flags: a JS error, an unclickable control, and a
control that changes nothing. Poll for the change; never a fixed wait (D-15).

**D. Probes and fixtures, committed.** `tests/fixtures/` — **fresh** (nothing created),
**mid-story** (a story at the Boost step with two heroes), **stress** (three storytellers, a dozen
stories, a story with 4 heroes, 2 villains, 3 worlds, every beat long, all 10 boosts answered,
40 die rolls). `tests/probe-layout.mjs` prints per route: height in viewports, control count,
primary-action offset, smallest tap target, overflow per width. A probe prints; it does not assert.

**Audit passes, in order, repeated until a full cycle finds nothing** (§11.2): dead-data scan ·
guidance-surfacing sweep (every guidance and example string has a consumer) · permission sweep
(every P-row has a control that persists its result) · interaction audit · measured layout ·
stress state · flow walk. Findings numbered in `docs/AUDIT.md` as Rule / Target / Fix / Why it
mattered, with a verified-clean list.

### 9.1 Definition of done, per feature
- [ ] **Source** cited (booklet chapter or card id).
- [ ] **Data** in a `data*.js` file, never inline in a module.
- [ ] **Engine** — a named function.
- [ ] **Surface** — reachable in two taps, primary action above the fold.
- [ ] **Guidance** — the booklet's teaching for that card is on screen, not just in the data.
- [ ] **Permissions** — every permission the card grants has a control.
- [ ] **Flags** — every state field has a setter, a reader and a clearer.
- [ ] **Test** — a unit invariant plus a browser check, and you have **watched it fail**.
- [ ] **Traceability row** filled.
- [ ] **CLAUDE.md** updated in the same change; `CACHE_VERSION` bumped.

---

## 10. Process rules

1. This file is canonical; every code change updates it in the same change.
2. All card text, guidance, examples and spark tables live in `data*.js`. Never hardcode card text
   in a `src/` module.
3. Every change appends a changelog row: what, why, root cause for fixes, verification, cache
   version.
4. Verify in a real browser before marking anything complete. "Syntax is valid" is not verification.
5. Every bug fix adds a check that would catch its return, and the check is proved to bite.
6. Root-cause fixes only; no symptom patching.
7. Scope guard: this deck, its booklet, and clearly-labelled house aids. Nothing invented is
   presented as Sefirot's.
8. **Explain and enforce in the same change.** Any UI sentence stating what the book permits owes
   either a control or an explicit "guidance only" mark. Never a third option.
9. One record, one renderer: the story shape is written once and read by build, tell and export.
10. Reversibility is inventoried: deleting a story, deleting a storyteller, re-freezing the snapshot,
    clearing a card — each either undoes or confirms while naming the loss.

---

## 11. Content and licensing

Built from a deck the user owns, for personal and small-group use. The card art is Matteo Ufocinque's,
published by Sefirot, and **is not committed to this repository**: `assets/cards/` is gitignored and
regenerated locally by `tools/extract-cards.py` from the user's own copy of the DIY PDF. The
booklet's guidance is paraphrased, never reproduced. The repository stays **private**. Card art is
referenced by stable id from one data file, so original faces can be substituted wholesale if this
is ever shared more widely; if it is published, permission from Sefirot is the user's to obtain.
The README states this plainly, along with the one-time art-generation step.

**Consequence for the build:** the app must render a labelled placeholder for any missing card face
rather than a broken image, and the harness must pass with `assets/cards/` empty.

---

## Changelog

| Date | Change | Verification | Cache |
|---|---|---|---|
| 2026-09-01 | Card art pipeline: `tools/extract-cards.py` generates 34 WebP faces under stable ids; `assets/cards/` gitignored so no publisher art is distributed. App must degrade to placeholders when absent. | 34 files, 3.22MB, max 195KB, ids reconciled against the inventory | — |
| 2026-09-01 | Instantiated this spec from the v3 template. Card inventory extracted and verified from the DIY PDF (34 images); Stage B product decisions D1–D18 recorded; ambiguity rulings A1–A10 proposed; roadmap and ledgers seeded, all boxes unticked except T11 (art extracted, not converted). No application code yet. | Card count reconciled against the booklet's "34 illustrated cards" | — |
