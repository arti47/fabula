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
| D7 | Stuck help | Book examples + offline spark tables, one per input | No network, no key, no AI. Sparks are house aids (§2.2), labelled as such |
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

### 1.2 Visual decisions (Phases 11–12, recorded)

| # | Decision | Answer | What it binds |
|---|---|---|---|
| D19 | How far the style moves | **Lean into the deck**, and build all three directions rather than picking one | The UI stops competing with the art and starts framing it: paper grain, ribbon headings, a bundled display face, drop caps, decorative rules |
| D20 | Reading a card face | **Lightbox overlay** | Any face opens full-screen over the current screen, focus restored. Never leaves the step. The only way to read a card's printed questions since the zoom lock |
| D21 | Typeface | **One bundled display face** | SIL-OFL, subset to Latin + the booklet's accents, in `assets/`; headings, card headlines and small-caps connectors. Body text stays on the system serif stack |
| D22 | Chrome | **Trim, keep everything sticky** | Story header to one row, no duplicate step heading, shorter nav pills. §6.2's persistent resource header stays persistent |
| D23 | Tablet | **Two columns, tab bar stays** | Shelf, examples, Learn and Deck sections go two-up at 1024; the tab bar's contents centre to a max-width rather than spreading |
| D24 | Motion | **Feedback and page transitions** | Press/hover lift, spark fade-in, a die tumble, and a short transition between steps. All gated behind `prefers-reduced-motion`; none of it carries information (§6) |
| D25 | House-drawn graphics | **Close to the deck, never card-shaped** | Banners, rules and line art may echo the woodcut idiom, but nothing is rendered as a card face, carries a card's lettering, or sits where a real card would. §11 says the chrome is house-drawn |
| D26 | The revamp's weight | **Both, deck first** | Cards behave like cards before the story becomes an object. Every string, route, card, question and rule is unchanged — only form |
| D27 | One look | **Card table**, dark | `skins/` is gone; the other two looks are deleted. Dark is the ground, not a theme: vivid art needs something to sit on. **Supersedes §1's "cream paper" and D15** — there is no light theme and no theme toggle |
| D28 | Card backs | **The four group dividers** | **Amends A2**: a divider may now be rendered as a card *back*. The Idea group has no divider, so its back is the plain group colour |
| D29 | How far the physicality goes | **All the way into the writing screens** | The field lives on the card. The writing surface stays axis-aligned — a tilted field breaks focus rings, carets and iOS scroll-into-view |
| D30 | Phone layout for the fan and the storyboard | **Swipe for the fan; the board keeps its overview** | A fan of ten is one card at a time on a phone with prev/next. The nine-beat board is **not**: its whole job is showing the arc, and one frame at a time is a list with extra taps. Two frames across on a phone, three from 768 |
| D31 | The frame | **Chrome recedes onto the table** | One 44px bar carrying where you are, the story header beneath it, the action pinned. **The tab bar is gone**; Stories, Build, Deck and Learn live behind one menu button |
| D32 | Delivery | **Five batches, screenshots between** | Frame · physics · the five forms · the story object · moments and graphics |

### 1.3 Play decisions (Phase 13 — "still boring", recorded)

Five batches made the app more *refined*. Refinement is not fun. The measured causes: one dark
brown at four lightnesses, one screen skeleton nine times, a type scale of 1.35 / 1.0 / 0.9rem,
progress as a status bar, and nothing that happens when you finish something.

| # | Decision | Answer | What it binds |
|---|---|---|---|
| D33 | Colour | **Each step owns its colour, whole screen** | `data-step` on the root remaps `--accent` and tints `--paper`/`--paper-raised`/`--paper-sunken`/`--rule`. Idea = the Prompts' red, Ingredients = yellow, Structure = blue, Boost = green; Tell belongs to no group and keeps the table's warm accent. **Amends D27's monochrome** — the dark ground stays, the brown does not |
| D34 | Screen shape | **Each step gets its own layout** | The shared skeleton (heading → explain → note → grid → bar) is broken: a die on a table, a workbench, a map, a fan, a book. Five silhouettes, same content, same controls |
| D35 | Progress | **A journey strip, five stops** | The four counts become four milestones on a road plus a destination, each filling as its step fills, each carrying its group's sigil and its count as text. Still progress, never a score (§1, A10) |
| D36 | Moments | **Turn · seal · one burst · page turn** | An answered card turns and settles; a wax seal stamps onto a finished card; the ninth beat gets one spark burst, once; step changes turn a page. All behind `prefers-reduced-motion`; none carries information |
| D37 | Type | **Display headings, spoken guidance, drop cap, a second face** | Headings to `clamp(1.7rem, 6.6vw, 2.1rem)` in the step's colour; the booklet's teaching set as speech rather than app copy; the told story's drop cap revived by moving the connector to its own line; a second bundled face for numerals and labels |
| D38 | Sound | **None** | A kid alone in a room, and D4 says this may reach a classroom. Every moment in D36 lands visually. No audio assets, no mute control |
| D39 | Delivery | **Four batches, screenshots between** | 1 palette + type + the strip · 2 the Idea and Ingredients rooms · 3 the Structure map and the Boost fan · 4 the Tell book, the moments, the graphics |

### 1.4 Clarity decisions (Phase 14 — "boring, cluttered, messy, confusing", recorded)

Measured before deciding, and the complaint turned out to be two diseases on different screens.
The **landing page is empty, not cluttered**: 37 words, 2 controls, ~420px of black, and not one
of the deck's 34 illustrations on the screen that has to sell it. **Learn is the cluttered one**:
4 screens, 77 controls, 3,299 words, 227 blocks, 42 near-identical collapsed rows in one flat
scroll. And the **Deck is the best-looking screen in the app**, because it is almost entirely card
art — which is the whole diagnosis in one comparison.

| # | Decision | Answer | What it binds |
|---|---|---|---|
| D40 | The principle | **Fewer things, bigger, on the deck's art** | Card art becomes the ground or masthead of the screens that have none, and the element count on top of it drops. Answers *empty* and *cluttered* with one move |
| D41 | `explain()` | **Only where a screen is genuinely unclear** | **Amends §6.2** from "every screen" to "where the screen needs it". It was 44px of grey on fourteen screens, two with a single field. The words survive in the rules library, which §6.2 already requires |
| D42 | Learn | **An index of five covers, one group per screen** | The group dividers become the top level; opening one gives that group's chapters on their own screen in its colour. Search stays on the index |
| D43 | First run | **A fanned spread of real card faces** | Four or five actual faces, bled off the edges, with the heading and the field over them, and Start beside the field rather than pinned across the screen |
| D44 | Build chrome | **Fold the nav into the journey; one explanation per screen** | The strip's five stops become the step links, so the section nav band goes and navigation becomes sticky. The step's app-written note and its `explain()` merge into one visible lead, on survey screens only. The cast strip hides when it has nothing |
| D45 | Delivery | **Three batches, screenshots between** | 1 the chrome cut · 2 the empty screens on card art · 3 Learn's index and the tutorial |

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

There is **one table per input the app asks for** — 39 of them, keyed by the input's own id
(`hero.fear`, `villain.want`, `world.typicalDay`, `beat.5`, `boost-twist`…) — plus the five open
tables the Idea screen uses before any question has been asked. Rows may carry `{hero}`,
`{villain}` and `{world}`, filled in from what the story has named and falling back to "the hero",
"the villain", "that place". Every row is a fragment of nine words or fewer with no full stop: it
must leave the kid something to do. Coverage is enforced **in both directions** — an input with no
table and a table with no input are each a test failure.

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
| A2 | Is the deck 34 cards or 30? | Both: 34 printed images, of which 4 are group dividers carrying no prompt. The app has 30 playable cards and does not render dividers as cards. A divider may appear as a **wide band** heading its group in the Deck and the rules library (G5), and — amended by D28 — as a card **back**, which is the one place it is rendered card-shaped. It is never a playable face and never sits in a grid as one |
| A3 | The EN Structure divider is printed "STRUTTURA" | Untranslated in the EN print. Recorded in `CARD_ERRATA`; the app says Structure everywhere |
| A4 | The die art shows letters at angles that could read as other letters | The booklet is authoritative: faces are P, M, Q, G, N, S |
| A5 | "Something Happens" is both an Ingredient card and Structure beat 2 (Call to Action) | One story fact, two homes. Beat 2 is **pre-filled** from the Ingredient answer, editable afterwards, and the app says where it came from. One record, never two (§10.11) |
| A6 | Does the rolled Prompt constrain the story afterwards? | No. The booklet uses Prompts only to find the idea. The app pins the rolled letter to the story as provenance and gates nothing on it |
| A7 | How many heroes / villains / worlds may a story have? | Uncapped. The booklet explicitly permits two and gives no limit (P3) |
| A8 | When is the "before" version frozen? | When **boosting begins** — the first boost answered or deliberately skipped. Opening the step is not boosting: a kid tapping through the tabs on an empty story would otherwise freeze an empty draft for ever, and the comparison the Boost chapter exists for would have nothing in it. Until then the saved version keeps up with the story. A "replace it with the story as it is now" control exists and confirms while naming what it discards (§6.4) |
| A9 | Must the nine beats be filled in order? | No. Order is presentational; any beat is answerable at any time (P5) |
| A11 | The booklet numbers its own steps twice, and differently: the overview lists five activities beginning with the idea, while the chapter headings call Ingredients "STEP 1" and treat the idea as a preliminary phase | The app uses **five numbered steps with the Idea as step 1**. The overview's numbering is the one a kid meets first, the Idea genuinely is work, and a step you can skip is still a step (P5) |
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
- **Zoom lock**, enforced in two halves because one is not enough: the viewport meta
  (`user-scalable=no, maximum-scale=1`), which Android honours and **iOS Safari ignores**, plus
  `zoom.js`, which refuses the pinch gestures themselves — iOS `gesture*`, any two-finger
  `touchmove`, and a ctrl/⌘ wheel. Double-tap is held by `touch-action: manipulation`; the
  browser's own zoom UI is untouched. Inputs stay ≥16px so focusing a field never scrolls-and-
  scales. The lock **is paid back** with a text-size control in Settings that scales the app's own
  type, persisted with the theme — reflow rather than pan, which is what a small reader needs — and by the
  card lightbox (D20): the deck prints its questions on the art, so every face opens full-screen on a tap.
- **Decoration is baked, never computed at paint time.** No SVG filter (`feTurbulence`,
  `feGaussianBlur`, `feDisplacementMap`) inside a CSS background: the browser re-runs it over the
  whole page on every paint, and a three-screen route becomes unpaintable. Texture ships as a small
  tile; a test enforces it.
- **One look: the card table** (D27), **in five rooms** (D33). Dark ground, one 44px bar, the
  story's cover behind its title. There is no light theme and no theme toggle — the ground is the
  table. The step you are standing in sets `--accent` and tints the ground through
  `:root[data-step]`, written as literal hex rather than `color-mix()` so nothing depends on a
  browser feature. `prefers-contrast: more` still applies.
- **One bar, one menu** (D31). The tab bar is gone. Stories, Build, Deck and Learn live behind the
  menu button; the bar names the place you are standing in and marks it `aria-current`. Fixed
  chrome stays under 140px (160 at 320, where the counts wrap) — it was 210px with a tab bar.
- **Responsive**: zero horizontal overflow at 320 / 360 / 390px; tablet layouts at 768 and 1024
  that add density rather than stretching (D12).

---

## 5. File structure

| File | Purpose |
|---|---|
| `index.html` | App shell: header, story header, section nav, screen mount, module entry |
| `styles.css` | Everything: structure, measurements, components and the card-table look (D27) |
| `data.js` | The deck: all 30 playable cards — headline, group, badge, art path, questions, guidance, examples |
| `data-examples.js` | The two booklet stories as complete story records (Little Red Riding Hood; Hänsel & Gretel before *and* after Boosts) |
| `data-sparks.js` | Invented spark tables — five open ones for the Idea screen, and one per input (39) — `HOUSE_AID = true` |
| `data-learn.js` | Rules-library chapters: the five steps, the nine beats, the ten boosts, the seven drawing tips |
| `assets/cards/*.webp` | 34 faces (30 playable + 4 dividers), 760px WebP, ids per `docs/card-inventory.md`; committed |
| `assets/fonts/imfell-english.woff2` | The display face: IM Fell English, subset. SIL-OFL, licence beside it in `assets/fonts/OFL.txt` |
| `assets/fonts/alfa-slab-one.woff2` | The numeral face (D37): Alfa Slab One, subset to digits, capitals and a slash — 2.3KB. SIL-OFL, licence in `assets/fonts/OFL-alfa-slab-one.txt` |
| `tools/extract-cards.py` | Regenerates the card faces from the user's own DIY PDF |
| `.github/workflows/pages.yml` | Runs `npm test`, then publishes the repository to GitHub Pages |
| `manifest.json`, `service-worker.js`, `icon.svg` | PWA |
| `tests/` + `package.json` | Dev-only harnesses (`npm test`); `node_modules` gitignored; not in the SW app shell |
| `tools/parse-gate.mjs` | Syntax-checks every shipped file by filename before the suite runs |
| `tools/dead-data.mjs` | The dead-data scan (§9): exports nothing reads, imports nothing uses |
| `tests/shell.test.mjs` | The shipped-file invariants: every module cached offline and listed in §5.1, no live SVG filter in a background, and every stylesheet structurally sound |
| `tests/icons.test.mjs` | Every tab and header control has an icon, and no icon is drawn that nothing asks for |
| `tests/harness.mjs` | Shared server, browser and fixture loading, and the one route list every harness measures |
| `tests/make-fixtures.mjs` | Regenerates the three seed states (`npm run fixtures`) |
| `README.md` | Setup, offline/privacy statement, and the licensing note (§12 of the template) |
| `CLAUDE.md` | This file |
| `docs/card-inventory.md` | The verified card extraction, with source page/image ids |
| `docs/AUDIT.md` | Numbered findings, pass by pass, plus the verified-clean list |
| `index.html`, `manifest.json`, `service-worker.js`, `icon.svg` | Shell and PWA |

### 5.1 `src/` module map

| Module | Responsibility |
|---|---|
| `core.js` | Constants, DOM/util helpers (incl. null-safe `add`), `roll()` on `crypto`. No imports |
| `ui.js` | Modals, toasts, confirms, `explain()`, the pinned action bar, the card component and its two sides (`cardBack`, `dealtFace`), the card lightbox, the answering stage (`answerStage`), the two-column `answerLayout`, `burst()` (D36) and `cardFan()` (D43) |
| `cards.js` | One lookup per kind of thing: `getCard(id)` resolves any card in any group, including nothing else (§10.16) |
| `store.js` | Storytellers, stories, autosave, `takeSnapshot`/`ensureSnapshot`, JSON export/import, the die-roll log |
| `derived.js` | Progress counts, "what's still blank", the story's cover (one of the cards *that* story uses, D40) and cast strip, `assemble`/`asPlainText` for the Tell page |
| `build.js` | The guided five-step path: the step heading, the one-line lead, and what each step renders (its nav is the journey strip, D44) |
| `idea.js` | Step 1: the die on its table (D34), Prompt cards, the idea sentence, the roll history, sparks |
| `ingredients.js` | Step 2: the workbench of four stations (D34), add-another, skip/unskip, and the one-question-at-a-time view with pips |
| `structure.js` | Step 3: the nine beats as a map — stops on a drawn route (D34) — one-beat view with pips, beat 2 pre-fill (A5) |
| `boost.js` | Step 4: the ten boosts held as a fan (D34), card-spawning (P6), beat rewrites (P7), the snapshot (A8), re-freeze |
| `tell.js` | Step 5: the assembled story as a book page with drop caps (D34, D37), before/after toggle, print, plain-text save and copy |
| `library.js` | Storyteller profiles, the shelf, create/rename/delete/open, the storyteller manager (switch, add, remove); example stories |
| `deck.js` | Browse all 30 cards as reference — **currently inside `screens.js`**; splits out when it grows search or filters |
| `learn.js` | The rules library as an index of chapter covers plus one screen per chapter (D42); search on the index; card entries resolve through `getCard`, and one route resolves either a chapter id or an entry id |
| `sparks.js` | Draws three sparks for an input, fills in the names the story has, inserts at the cursor; always labelled a house aid |
| `settings.js` | Theme, text size, export/import, the storyteller manager, deleting the open story, about — **currently inside `screens.js`** |
| `tutorial.js` | The ten-step first-story walkthrough, linked from the empty shelf and Settings |
| `router.js` | Hash routing, the menu and the place you are standing in, section nav (incl. scrolling the current pill into view), the story header and the journey strip — which is also the step nav (D44) |
| `icons.js` | The app's own SVG icons and drawings, stroked in `currentColor` — house-drawn chrome, never the deck's art (D25) |
| `zoom.js` | The zoom lock: refuses pinch gestures iOS Safari grants despite the viewport meta |
| `main.js` | Entry point / boot |

When adding or moving a `src/` file: update this file's tables **and** the service-worker app-shell
list, then bump `CACHE_VERSION` — in the same change.

---

## 6. Screen anatomy

```
┌──────────────────────────────┐
│ ☰  Build                    ⚙   sticky, 44px
├──────────────────────────────┤
│ the story's cover, its title, and what is still blank   sticky
├──────────────────────────────┤
│ section nav (Idea · Ingredients · Structure · Boost · Tell)
│ screen content ← scrolls
├──────────────────────────────┤
│ action bar (Next card · Roll · Read my story)   fixed
└──────────────────────────────┘
  ☰ opens: Stories · Build · Deck · Learn
```

- The **story header is this app's persistent resource header** (§6.2): the title and the counts
  that tell a kid what is still blank, visible from every in-story screen, drawn since D35 as a
  road with four milestones and a destination on it. It is progress, never a score. Two lines, not three — who is telling the story does not change while it is being written,
  and is named on the shelf and in Settings (D22).
- **Fixed chrome has a budget**: the bar and the story header together stay under 140px (160 at
  320, where the four counts need a second line). Asserted on every route at every width.
- **Nothing is named twice on one screen.** Asserted. On the **build** screens the section nav is
  gone (D44) — the journey strip's five stops are the step links, and they name their stops only
  to a screen reader — so the step's own `<h2>` is **drawn** again on the survey screens, which
  reverses the consequence D37 had to record. On a question screen the card's headline is the
  heading and the step's `<h2>` stays in the outline only. Deck and Learn keep their section nav,
  and there the matching `<h2>` is still undrawn.
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

1. **`explain()`** — a collapsed `<details>`, 2–4 sentences in the app's voice, **on the screens
   that are genuinely unclear** and no others (D41): Settings, where the privacy promise lives,
   and the worked example, which is read-only and does not say so otherwise. Every step screen
   instead carries one visible `.step-lead` line saying what the step is for. The rule the harness
   enforces is **no screen explains itself twice**, which is the rule that was worth having.
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
    boosts:  { <boostId>: { answer, skipped: bool, editedBeats: [n…] } },    // P7
             // what a boost invented is NOT stored here — it is derived from cast[].origin (P6),
             // because one fact in two records can disagree and nothing would notice (§10.11)
    snapshot:{ takenAt, beats, cast, worlds, inciting } | null,              // A8, D10
    skipped: [cardId…] }                                                     // P1
```

Rules: every schema addition ships a normalization path that back-fills defaults on old stories and
**a fixture test that loads a hand-written old-shape record** (§10.17). Every field addition is
documented here in the same change. Nothing in the schema is written that no screen reads.

---

## 8. Roadmap

- [x] **Phase 0 — Foundations.** Scaffold every file above; extract the complete card data per the
      ledger (data before features); storybook theme, light + dark; PWA shell; router, the §6 frame,
      two-level nav; localStorage layer.
- [x] **Phase 1 — Library & storytellers.** Profiles, the shelf, create/open/rename/delete a story,
      JSON export/import, normalization + migration.
- [x] **Phase 2 — Step 1: Idea.** The die (crypto, logged, re-rollable), the six Prompt cards with
      their guidance and examples, the idea sentence, "I already have an idea" path, sparks.
- [x] **Phase 3 — Step 2: Ingredients.** The four cards in any order (P2), add-another (P3),
      per-question fields with the booklet's example answers inline, skip and return (P1, P5).
- [x] **Phase 4 — Step 3: Structure.** The nine beats with guidance and examples; beat 2 pre-fill
      from the inciting event (A5); free order (A9).
- [x] 🏁 **Milestone — First Story Tellable.** Create a storyteller → roll or write an idea →
      ingredients → nine beats → read it back, end to end, on a phone, with zero console errors.
- [x] **Phase 5 — Step 4: Boost.** Ten boost cards; the snapshot on first entry (A8); spawning a new
      Ingredient card from a boost (P6); jumping back to rewrite a beat and returning (P7).
- [x] **Phase 6 — Step 5: Tell.** The assembled story page, before/after toggle, print stylesheet,
      plain-text export.
- [x] **Phase 7 — Deck, Learn, Examples, Tutorial.** Card browser; searchable rules library incl.
      the seven drawing tips (D8); the two worked stories as readable stories (D11); the tutorial.
- [x] **Phase 8 — Tablet.** The second layout that adds density (D12), at 768 and 1024.
- [x] **Phase 9 — Hardening.** Six harnesses (§9), accessibility pass, measured layout and stress
      passes, the mutation pass, and eleven audit cycles producing 48 findings — **stopped by
      decision at three findings in the last cycle, not by the stopping rule.** `docs/AUDIT.md`
      records what that leaves open and which methods have not been tried.
- [ ] **Phase 10 — Cloud sync (gated, D6).** Only if asked for: accounts, sync, and the children's
      privacy work that comes with it.

### 8.1 Data extraction ledger

An unticked box means the data is not extracted. **Never build UI against an unticked table.**

| id | Table | Target | Consumer | Done |
|---|---|---|---|---|
| T1 | 6 Prompt cards: letter, headline, guidance, examples | `data.js` | `idea.js` | [x] |
| T2 | Idea card: headline, guidance, starter sentence, examples | `data.js` | `idea.js`, `deck`, `learn.js` | [x] |
| T3 | 4 Ingredient cards: headline, printed questions, guidance | `data.js` | `ingredients.js` | [x] |
| T4 | 9 Structure cards: number, headline, beat name, guidance | `data.js` | `structure.js` | [x] |
| T5 | 10 Boost cards: headline, guidance, `canSpawn`, `suggestsBeats` | `data.js` | `boost.js` | [x] |
| T6 | Little Red Riding Hood's answers, per card | `data.js` | card example line | [x] |
| T7 | Both booklet stories as complete story records (H&G with its pre-Boost draft) | `data-examples.js` | `library.js` | [x] |
| T8 | The 7 drawing tips | `data-learn.js` | `learn.js` | [x] |
| T9 | Rules-library chapters (how it works, 5 steps, every card, drawing) | `data-learn.js` | `learn.js` | [x] |
| T10 | Spark tables (house aid): 5 open tables + 39 per-input tables, ~16 rows each | `data-sparks.js` | `sparks.js` | [x] |
| T11 | Card art: 34 images → WebP, id-mapped (760px, q80, 3.2MB total, max 195KB) | `assets/cards/`, generated | `ui.js` card | [x] |
| T12 | `CARD_ERRATA` (A3) | `data.js` | `learn.js` | [x] |

### 8.2 Traceability ledger

One row per permission and per procedure. **A row with a gap is the §0 defect, visible before it
ships.** Fill the row when you build the rule, not at audit time.

| Rule | Shape | Data | Engine | Surface | Test |
|---|---|---|---|---|---|
| P1 skip any card | Permission | — | `store.skipCard` | Skip button, every card | skipped card stays reachable |
| P1 skip a card | Permission | `story.skipped` | `ingredients.ingredientsGrid` | "Skip this one for now" + "Bring it back" | `ingredients: a skipped card comes back` |
| P2 any order | Permission | — | `ingredients.ingredientsGrid`, pips | Card grid; numbered pips inside a card | `ingredients: the tile counts answers` |
| P3 two heroes | Permission | — | `ingredients.addEntry` | "Add another main character", uncapped | `ingredients: a second main character is allowed` |
| P4 re-roll freely | Permission | `PROMPTS`, `DIE_FACES` | `idea.roll` | Roll again, always enabled | `idea: every roll is kept, none discarded` |
| P5 leave it blank | Permission | — | `derived.progress` | Counts in the story header, never a block | `progress counts what is answered, and nothing else` |
| House sparks | Permission (ours) | `IDEA_SPARKS`, `INPUT_SPARKS` | `sparks.drawSparks`, `sparks.fieldWithSparks` | "Stuck? Three words" under every field, labelled "ours, not the deck's" | `every input the app asks for has a table` · `every table belongs to a real input` |
| P6 boost spawns a card | Permission | `BOOSTS[].canSpawn`, `cast[].origin` | `boost.boostScreen` → `ingredients.addEntry`, `derived.spawnedBy` | "This gives me a new character", listed back on the boost | `P6: what a boost made is derived from the card, not recorded twice` |
| P7 boost rewrites a beat | Permission | `BOOSTS[].suggestsBeats` | `boost.boostScreen` → `#/build/structure/N/from/<boost>` | "Change beat N", with the way back | `P7: every beat a boost points at exists, and the snapshot still holds the old text` |
| A5 beat 2 pre-fill | Sequence | — | `structure.prefillBeat2` | Beat 2, pre-filled, with a provenance line | `editing beat 2 does not rewrite the ingredient it came from` |
| A9 any beat, any time | Permission | `BEATS` | `structure.beatScreen` pips | Numbered pips 1–9, blanks dotted | `structure: the header counts written beats` |
| A8 snapshot | Procedure | `story.snapshot`, `store.boostingHasBegun` | `store.ensureSnapshot`, `store.takeSnapshot` | Locks on the first boost answered or skipped; re-freeze confirms and names the loss | `opening the Boost step is not the same as boosting` · `the before-version locks the moment a boost is answered or skipped` |
| D10 before/after | Procedure | `story.snapshot` | `derived.assemble(story, version)` | Tell page toggle, `aria-pressed` | `both versions render from one record` |
| P9 tell it again | Permission | — | `tell.tellScreen` | Reachable any time, never withheld | `an empty story reads back as empty rather than crashing` |
| P8 skip a boost | Permission | `story.boosts[].skipped` | `boost.boostScreen` | "Skip this one" / "Bring this one back" | `P8: a skipped boost comes back` |
| P10 draw it | Permission | `DRAWING_TIPS` | **guidance only** | Learn chapter, 7 tips | `the drawing chapter is guidance only — it names no control` |
| D11 worked stories | Procedure | `EXAMPLE_STORIES` | `library.exampleScreen` → `derived.assemble` | Two readable stories on the shelf, copyable | `Hänsel and Gretel is told twice, and the two tellings differ` |

---

## 9. Harnesses and audit

**A. Unit + data (`npm test`, seconds).** Parses every source and data file first (`node --check`,
failing by filename). Then: 30 playable cards exactly; 6 prompts, one per die letter, no duplicates;
beats numbered 1–9, unique, none missing; 10 boosts;
every shipped module present in the service worker's app shell and in the §5.1 module map;
every tab and header control has an icon, and no icon or drawing is dead; no SVG filter in a CSS background; every card has headline + guidance + at least
one example; every art path resolves; the die is uniform over 60k rolls within tolerance; export →
import round-trips a full story byte-identically; an old-shape fixture normalizes.

**B. Browser smoke (`npm run smoke`, ~1 min).** 30 routes × 5 widths (320/360/390/768/1024), seeded mid-story, run with the card art present and absent. Every route renders with zero console errors; zero
horizontal overflow at 320/360/390 and no stretched layout at 768/1024; no stray
`null`/`undefined`/`NaN` text; nothing under the fixed tab bar; every screen's primary action above
the fold; section nav reaches every sibling; no tap target under 40px measured on the wrapping
label; the action bar never grows past one bar; the current section-nav pill stays in view; fixed
chrome inside its budget; the counts still on screen after scrolling (§6.2); an unanswered card lying face-down and the Deck showing every face; the question sitting on the card, not under it; every beat frame wearing its own card and showing the text written on it; the told story opening on a full-width cover; the cast strip showing who the story has and keeping off the question screens; the spine carrying one bone per beat and filling the written ones; every card wearing its group's sigil beside the group's name; the told story closing on its ornament; each step naming itself on the root and owning a distinct accent and ground; the journey carrying five stops, saying its counts in words, marking where you stand and filling as the story fills; the booklet's teaching set as speech rather than app copy; no screen explaining itself twice and every step screen leading with one visible line; the step nav folded into the journey — five stops, all links, one marked current, in a named landmark, none under 40px — with the step heading drawn again on a survey screen and the step's description kept off the question screens; Settings stating where the stories are kept (§4); the first screen opening on at least three real card faces, marked as decoration, with Start beside the field it submits rather than pinned; the shelf's stories not all wearing the same picture, each cover standing beside its words; Learn opening on an index of covers with no entries on it and search still there, a chapter carrying its own nine entries and a way back, and a card's link still landing on its entry inside the right chapter; the Ingredients step standing on four named, tilted stations that each carry their cards; an unrolled die lying on its table at 64px or more, as a button that deals a Prompt card when thrown; the nine beats standing as stops on a drawn route rather than in rows, staggered rather than level; the ten boosts held as a fan — every card turned, overlapping its neighbour, and neither end of the hand clipped outside the scroller; the told story setting its connector on a line of its own and dropping a cap on each passage, on a page with a fore-edge; numerals set in the numeral face; a finished card wearing a pressed wax seal; the ninth beat drawing one burst on the write that fills it and none on merely arriving at a story already whole; nothing named twice; the two-up layouts really give two columns at 1024
and one at 390; the action bar measured continuously from 320 to 1024 in 8px steps, because it is
the one thing sensitive to width rather than to layout and a five-width sample walked straight past
a defect band nine pixels wide; the full walk: storyteller → story → roll → idea → ingredients → beats → boost → tell.

**C. Interaction audit (`npm run audit`, ~2 min).** Visits every route — including the screens
*inside* a step — clicks every visible control in isolation with storage reset between clicks, and
flags: a JS error, an unclickable control, and a control that changes nothing. It **waits for the
screen to stop moving** before measuring: a card turning over projects to almost no width halfway
through, and measured mid-turn it reads as a control that cannot be clicked. The screen is
compared by **a hash of its whole text**, never by length and a prefix: summarised that way, text
swapped for text of the same length further down the page was invisible, and the audit cried wolf
at a control that had just worked. Self-links carrying
`aria-current` are meant to be no-ops; `window.print` is counted rather than excused. Poll for the
change; never a fixed wait (D-15).

**C2. Accessibility sweep (`npm run a11y`).** Labels, accessible names, heading order, one `h1`,
image alt text, landmarks, `aria-current`, `lang`, live regions, the skip link, and proof that the
text-size control actually scales type. Contrast and screen-reader flow still want a human.

**C3. Update path (`npm run update`).** The one PWA behaviour that cannot be checked by looking at
the running app: the worker installs and takes control, the app opens with the network gone, and a
deployed change offers "a new version is ready" to the page that is already open.

**D. Probes and fixtures, committed.** `tests/fixtures/` — **fresh** (nothing created),
**mid-story** (a story at the Boost step with two heroes), **stress** (three storytellers, a dozen
stories, a story with 4 heroes, 2 villains, 3 worlds, every beat long, all 10 boosts answered,
40 die rolls), **messy** (emoji, 600-character unbroken words, quotes, angle brackets, right-to-left
text, whitespace-only answers — what a kid types when nobody is watching). `tests/probe-layout.mjs` prints per route: height in viewports, control count,
primary-action offset, smallest tap target, overflow per width. A probe prints; it does not assert.

**Mutation pass (`npm run mutants`, `-- all` for the browser ones).** Sixty-four mutants, each breaking
one rule the app is supposed to keep — the pre-fill, the snapshot, the die, a permission's control,
the placeholder path, the update toast, the zoom lock. A mutant that survives is a rule that can break silently,
and is a finding against the harness rather than the app.

**Audit passes, in order, repeated until a full cycle finds nothing** (§11.2): dead-data scan ·
guidance-surfacing sweep (every guidance and example string has a consumer) · permission sweep
(every P-row has a control that persists its result) · spark-shape pass (`npm run sparks`: the
fragments read as a body of writing) · interaction audit · measured layout · stress state ·
flow walk. Findings numbered in `docs/AUDIT.md` as Rule / Target / Fix / Why it
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
10. Reversibility is inventoried (the table below is the inventory, and it is kept current):

| Action | What it destroys | How it is protected |
|---|---|---|
| Delete a story | everything in it | confirms, naming the idea, the characters, the beats and the boosts. Reachable from the shelf row **and** from Settings for the story you have open |
| Remove a storyteller | them, and all their stories | confirms, counting the stories that go. Reachable from the shelf's **Storytellers** control and from Settings; the last storyteller is removable, which returns the app to first run |
| Re-freeze the before-version | the draft you started boosting with | confirms, naming what is replaced |
| Load a backup | any story on the shelf sharing an id | confirms, **listing the stories by name** |
| Remove a character or world | every answer on that card | confirms; the snapshot keeps its own copy |
| Skip a card or a boost | nothing — answers are kept | reversible, "bring it back" |
| Switch storyteller | nothing | reversible |
| Clear a field | that answer | **not protected** — it is typing, and autosave is the point. Accepted |
| A spark over selected text | the selection | **not protected** — standard editing behaviour. Accepted |

---

## 11. Content and licensing

Built from a deck the user owns, for personal and small-group use. The card art is Matteo Ufocinque's,
published by Sefirot, and **is committed to this repository at the owner's decision** so the
deployed app shows real cards; `tools/extract-cards.py` regenerates it from the owner's own copy of
the DIY PDF. The booklet's guidance is paraphrased, never reproduced. Card art is referenced by
stable id from one data file, so original faces can be substituted wholesale, and deleting
`assets/cards/` degrades the app to labelled placeholders rather than breaking it.

The app is deployed to GitHub Pages from `main`. **The repository is public as of this writing and
the owner intends to make it private**; note that Pages does not serve a private repository on a
free plan. Permission from Sefirot is the owner's to obtain, and the README says so.

The display face is **IM Fell English** by Igino Marini, under the SIL Open Font License 1.1; the
licence ships beside the file in `assets/fonts/OFL.txt`. The numeral face is **Alfa Slab One** by
José Solé, also SIL-OFL 1.1, with its licence in `assets/fonts/OFL-alfa-slab-one.txt`; it is
subset to digits, capitals and a slash and sets nothing but numerals and short labels. The app's icons, the paper tile and the
drawn rules are **house-made** (D25): they echo the deck's idiom but none of them is a card face,
none carries the deck's lettering, and none sits where a real card would.

**Consequence for the build:** the app must render a labelled placeholder for any missing card face
rather than a broken image, and the harness must pass with `assets/cards/` empty.

---

## Changelog

| Date | Change | Verification | Cache |
|---|---|---|---|
| 2026-09-30 | **Clarity, batch 3 of 3: Learn stopped being a wall.** It was **3,260 words, 76 controls and 224 blocks in one flat scroll** — four screens of 42 near-identical collapsed rows, and the screen the “cluttered” half of the complaint was actually about. It opens on an index of seven covers now, each wearing its group's own divider and saying how much is behind it, and **a chapter is a screen of its own** (D42). Measured: **4 screens → 1, 76 controls → 8, 3,260 words → 42, 224 blocks → 8**, and the interaction audit's control count across the app fell 386 → 262. **The split's real risk was every card's “Read more about this card” link**, which points at `#/learn/<cardId>` — a different id space from the chapter ids. Rather than invent a second route shape, I proved the two spaces never collide (7 chapter ids against 45 entry ids, zero overlap) and let **one route resolve either**: a chapter id opens that chapter, an entry id opens the chapter holding it with the entry open. A check pins the behaviour and a mutant pins the risk. **One defect found by looking**: the chapter band asked the *first* card in the chapter, and the prompts chapter opens with the Idea card — whose group the deck prints no divider for — so that chapter silently had no band at all. It asks for the first card whose group actually has one. **And one thing deliberately not done**: D45 put the tutorial in this batch, but measuring it first said it is one screen, 572 words, with its action above the fold. It is not the problem; changing it would have been work for its own sake. | `npm test` 89/89 and the scan clean; smoke clean over 30 routes × 5 widths with three new checks — the index carries covers and no entries and keeps search, a chapter carries its own nine and a way back, and a card's link lands on its entry; interaction (262 controls) and a11y clean; `npm run mutants -- all` 64 mutants, the two new ones proved to bite by hand before the pass — the index back to a flat scroll, and a card's link landing on a closed page | v37 |
| 2026-09-30 | **Clarity, batch 2 of 3: the empty screens open on the deck.** The first screen anybody sees showed 37 words, one field, 420px of black and **none of the 34 illustrations the product is built on**. It opens on five real card faces now, fanned and bled past the gutter, with the question and the field standing on them and **Start beside the field it submits** rather than pinned across the foot of the screen, as far from the one thing on the screen as the layout allowed (D43). The lower half was the same emptiness moved down, so the two worked stories — already built, readable without a name, and the one thing that answers *what is this for* — sit under it wearing their own covers. **The cover was a worse idea than it looked.** `coverCard` returned the *type* of card, so every story with a hero wore the identical picture: a shelf of three showed **one image three times**, which is worse than no art because it says the app has one picture. It picks from the cards *that story* has actually used now, by a hash of its own id — stable for the life of the story, different between stories, and always a card the story is genuinely built from. **Three defects, all mine, all found by looking at the render.** The fan's outer cards had their corners cut off behind the app bar, so a deliberate bleed read as an accidental crop. The worked stories' covers stretched the full width with the text beneath, because `.card` is a *column* flex container and `display: flex` alone does not change the direction. And the walk broke the moment Start left the action bar — the harness was still clicking it there. One the guard caught for me: deleting the first screen's line drawing left `first-story` **drawn but used nowhere**, which is §0.1, and the icon coverage test went red on the same run. | `npm test` 89/89 and the scan clean; smoke clean over 30 routes × 5 widths with four new checks — the first screen carries at least three faces marked as decoration, Start stands beside its field and above the fold, the shelf's covers are not all one picture, and a cover stands beside its words; interaction (386 controls) and a11y clean; `npm run mutants -- all` 62/62 caught, two new — the spread removed and every story wearing one cover again, both proved to bite by hand before the pass ran | v36 |
| 2026-09-30 | **Clarity, batch 1 of 3: the chrome cut.** Told the app was boring *and* cluttered, I measured the screens I had never once looked at, and the complaint was two diseases. The **landing page is empty**: 37 words, 2 controls, ~420px of black, and not one of the deck's 34 illustrations on the screen that has to sell it. **Learn is the cluttered one**: 3,299 words and 77 controls in one flat scroll. And the **Deck is the best screen in the app** because it is almost entirely card art — the diagnosis in one comparison (D40). This batch cuts, and batches 2 and 3 add. **`explain()` went from fourteen screens to two** (D41, amending §6.2): it was a 44px collapsed row saying nothing until opened, on screens including one with a single field. **The section nav is gone from the build screens** (D44): the journey strip already drew the same five steps in the same order, so its stops became the links — one band fewer, and the navigation is *sticky* now, which the nav never was. That in turn **reverses the consequence D37 had to record**: with nothing else naming the step, the step's own `<h2>` is drawn again. And each step said what it was for **twice** — a collapsed `explain()` and a visible note; they are one visible lead now, and the richer of the two sentences survived because it carries the permission (A9, P5, P8) that §10.8 wants next to its control. **Two findings while cutting.** The step's lead and the cast strip were following the kid *into a single question*, which the new no-explaining-twice check caught on ten routes. And `blankSteps` became dead the moment the nav went — **kept alive by a test**, which is the one way dead app code hides from the dead-data scan; deleted, with its test. Controls on the mid-story fixture: 460 → 386. Fixed chrome 138px → 128px. | `npm test` 89/89 and the scan clean; smoke clean over 30 routes × 5 widths with the §6.2 rule replaced by one that bites — no screen explains itself twice, every step screen leads with one line — plus three new checks on the folded nav and one that Settings states the privacy promise; interaction (386 controls) and a11y clean; `npm run mutants -- all` 57 of 60 caught, two new — the stops no longer links, and the step's description following you into a question. **The three gaps were all STALE, and all mine**: this change moved the code three mutants were anchored to, so the pass had silently stopped testing that a screen keeps its note, that the step is not named twice, and that the story shows what it has made. All three re-pointed and each **proved to bite by hand**. One of them had nothing left to test — §6.2's every-screen rule is gone — so it now guards what D41 deliberately kept: **Settings stating the privacy promise §4 requires, which nothing had ever checked**. And the reason this nearly slipped past is fixed too: the runner printed `3 mutant(s) nothing caught` without naming them or saying whether they SURVIVED or went STALE, and a long run's per-mutant list scrolls out of a captured tail. It names them now | v35 |
| 2026-09-30 | **Play revamp, batch 4 of 4: the book, the moments, and a face for the numbers.** The last batch pays off D36 and D37. **The drop cap is back**, and the reason it failed in v21 is the reason it works now: the card's phrase ran inline at the head of the passage, so dropping the first letter left a giant O in front of “NCE UPON A TIME”. The connector has a line of its own now, in small caps, and the cap lands on the first letter the kid actually wrote. **Tell is a book**: under the cover the reading column stands on a page with a fore-edge down its right side. **A finished card is sealed, not ticked** — wax with a lit upper edge, a bitten rim and the mark pressed into it, and it presses down when it arrives. **The ninth beat draws one burst**, fired on the write that leaves nothing blank and never on merely opening a story that is already whole: a reward for arriving is not a reward for writing, so the code reads “was it whole before?” and only then fires. **A page turns between screens** — a sweep of light passing over the content. And the second face lands: **Alfa Slab One**, SIL-OFL, subset to digits, capitals and a slash at **2.3KB**, setting beat numbers, the journey's counts and the pips; IM Fell's old-style figures are why a badge once read as a letter, and these are lining and unmistakable. **Three defects, all mine, all caught by the harness rather than by looking.** The burst was a zero-size fixed box with sparks flying out of it, and sparks outside a fixed box **still count toward the document's scroll width** — three routes reported horizontal overflow purely because a burst was still in the air. The page-turn overlay **translated its own box** past the screen's right edge, which did the same on five more. And the numeral rule I wrote beside the beat list was beaten by a `.beat-number` rule further down the file — the same way the earlier badge fix had been silently undone once before. One harness defect too: the burst check wrote all nine beats into the seeded story and left them there, so two later checks measured what it had done rather than the fixture; it saves the record and puts it back now. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with six new checks — the connector on its own line with a cap over 1.8× the body size, the page's fore-edge, numerals in the numeral face, the seal's pressed rim, and the burst firing on the ninth beat's write but not on arrival; interaction (460 controls) and a11y clean; `npm run mutants -- all` 58/58 caught, four new — the connector back inline, the seal back to a flat tick, the ninth beat unmarked, and the numerals back on the UI face | v34 |
| 2026-09-30 | **Play revamp, batch 3 of 4: the map and the hand.** **Structure is a map**: the nine beats were a two-column board of square frames — correct, and still a grid. They are stops on a drawn route now, one that runs down the gutter between the columns, with every second stop set further along it and the number badge turned into a ringed milestone the route appears to pass behind. **Boost is a hand, fanned**: the ten have no order and no arc, unlike the nine, so they can overlap the way you would hold them — a sideways-scrolling hand, each card turned by its seat, lifting out of the fan when touched or focused. It keeps the `card-grid` class because it is the same ten tiles; the fan is a layout over them. **Three defects, all mine, all found by measuring rather than by looking.** The route was first drawn behind the frames, which cover the board completely — it was **never once visible**. The fan's first card sat **39px left of the viewport with `scrollLeft` already 0**: a rotated box overhangs its layout box, and at the ends of a scroller that overhang cannot be scrolled to; the padding is the overhang now, not the gutter. And the overlap ate the words rather than the art, because each card laid its headline out across its full width while only the left strip of it was visible. Plus one the harness caught that I would not have: at 1024 the third column ran 6px past the viewport, because a bare `1fr` carries an automatic min-content floor and the square frames' aspect-ratio turns their content height into a width — `minmax(0, 1fr)` everywhere now. Also dropped before it shipped: CSS `abs()` would have given the fan a real arc, but it only reached Chrome in 2025 and this app has no build step to polyfill it (§4). | `npm test` 90/90; smoke clean over 30 routes × 5 widths with four new checks — the board is a route with nine staggered stops, and the hand is ten turned, overlapping cards with neither end clipped; interaction (460 controls) and a11y clean; `npm run mutants -- all` 53 of 54 caught. **The survivor was a harness gap, and a useful one**: the route-hidden mutant passed because `getComputedStyle` still reports a width for a `display: none` pseudo-element, so a check that asked how wide the route was could not see it hidden. It asks whether the route is drawn at all now, and was proved to bite by hand (`the route is in the stylesheet but not drawn`), then restored and the suite re-run clean | v33 |
| 2026-09-30 | **Play revamp, batch 2 of 4: the first two rooms.** D34 says the five steps stop sharing one silhouette. **Idea is a die on a table**: before a roll the screen showed a 96px thumbnail, a field, and a note saying to use the button at the bottom — the die, the most distinctive object in the box, was not on screen at all until after it had been thrown. It is now the biggest thing there, lying on a vignetted surface, and it is a `<button>` rather than a picture beside one: the thing you want to touch is the thing you touch. **Ingredients is a workbench**: the same four blocks are four stations now, each a lit surface with its name on a tag rather than on a rule, its cards lying on it, and half a degree of tilt so the bench reads as things put down. Two corrections while building, both measured: the station was first `--paper-sunken` and **invisible against the page** — a bench is lighter than the room it stands in — and once it was lighter the guidance bubble, which shares that colour, disappeared into it, so on a station the bubble takes the darker ground. One string changed, and only because the code made it false: the hint under the die said “Tap Roll the die below” when the die itself had just become tappable (§10.8 — explain and enforce in the same change). No deck content is touched. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with four new checks — four named, tilted stations each carrying its cards, and an unrolled die on its table at 64px or more that deals a Prompt card when thrown; interaction (460 controls) and a11y clean; `npm run mutants -- all` 51 of 52 caught. **The survivor was my own mutant, not a gap in the app**: it stripped `type: 'button'` from `el('button', …)`, which leaves it a button — it broke no rule, so nothing could catch it. Replaced with one that takes the handler off the die, and proved to bite by hand (`and throwing it deals a Prompt card: nothing was dealt`), then restored and the suite re-run clean | v32 |
| 2026-09-30 | **Play revamp, batch 1 of 4: colour, scale and the road.** Told the interface was still boring, I measured rather than re-decorated, and the causes were four: the whole app was **one dark brown at four lightnesses** — the deck codes its groups red/yellow/blue/green and that code lived on a 0.7rem label; the type scale was 1.35 / 1.0 / 0.9rem, so no screen had a top; progress was a **status bar** (`Idea yes · Ingredients 4/4 · Beats 4/9 · Boosts 2/10`); and the booklet's teaching was a bare `<p>`, indistinguishable from the app's own notes, on six screens. This batch fixes the three that touch every screen at once. **D33**: `data-step` on the root remaps `--accent` and tints the ground, so the four rooms are told apart before a word is read — literal hex, not `color-mix()`, so nothing depends on a browser feature. **D35**: the counts became a road with four milestones and a destination, each stop filling as its step fills and carrying the group sigil wired in v30; the stops are deliberately **not** labelled, because the section nav names all five directly beneath in the same order and §6 forbids naming a thing twice. **D37**: headings to `clamp(1.7rem, 6.6vw, 2.1rem)` in the step's colour, and the guidance set as speech. **Found in the doing, and now a line in §6**: the big heading is invisible on exactly the five screens that most needed a top, because §6 undraws an `<h2>` the nav already names — so the current nav pill and the `<h3>`s inside the step carry the weight there instead. Also tidied four duplicated declarations in `:root` that the stylesheet guard does not catch, and gave the focus ring one warm white that reads on all five grounds. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with seven new checks — each step names itself and owns a distinct accent and ground, the journey has five stops, still says its counts in words, marks where you stand, fills as the story fills and draws every stop, and the guidance is spoken; the chrome budget holds at 138px of 140 with the strip in it; interaction (460 controls) and a11y clean; `npm run mutants -- all` 50/50 caught, three new — every room one colour again, the road never filling, and the teaching back to app copy | v31 |
| 2026-09-29 | **Revamp batch 5 of 5: the moments, and the last of the dead art.** `GROUPS[].badge` has named a sigil for each of the deck's five groups — `die`, `hat`, `flask`, `number`, `magnifier` — since Phase 0, and **nothing had ever drawn one**: §0.1 in the coat the dead-data scan structurally cannot see, because it reads exports and these are fields inside an exported object. All five are drawn now and sit beside the group's name on every card tile, never instead of it (§6). Two moments added where the app had none: a **told story closes on a flourish** rather than stopping mid-page — a tapered rule, a seal, three sparks, house-drawn and nothing about it card-shaped (D25) — and the story **assembles in the order it is told**, each passage arriving after the one before it. The stagger is an index the stylesheet turns into a delay, so the text is in the document whether or not the animation ever runs, and `prefers-reduced-motion` now zeroes the **delay** as well as the duration: a reveal held back 600ms is motion even with no duration, which the old blanket rule let through. Found while wiring it: `illustration` was used in `tell.js` without being imported — a `ReferenceError` on the one screen that is the whole payoff, and nothing but the browser catches a missing import. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with two new checks — every card wears its group's sigil and still names the group in text, and the told story closes on a drawn, silent, `aria-hidden` ornament after its last passage; interaction (460 controls) and a11y clean; `npm run mutants -- all` 47/47 caught, two new — the sigil undrawn and the ornament dropped | v30 |
| 2026-09-29 | **Revamp batch 4 of 5: the story became a thing you can see.** Steps one to four are forms — a kid writes for twenty minutes and nothing visibly accumulates until the Tell page. Two additions, both derived from the record and neither stored (§10.11): a **cast strip** above the work on the screens that survey a step, one chip per character and world with something written on it, wearing the card its answers live on and linking back to it; and a **spine**, the nine beats as an object that thickens rather than a fraction — a second channel for what the counts already say in words, never the only one (§6). Both were measured before they were kept: the spine first took a row of its own and put the chrome 4px over its 160px budget at 320, so it became the story header's own bottom edge and costs no height at all; and the cast strip on a one-question screen pushed the writing field off a 320 phone, so it appears only where a step is being surveyed, never where one is being answered. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with four new checks — the strip shows who the story has, keeps off the question screens, and the spine carries one bone per beat and fills the written ones; interaction (460 controls) and a11y clean; `npm run mutants -- all` 46/46 caught, two new — the strip unwired and the spine stopped thickening | v29 |
| 2026-09-29 | The interaction audit reported a card face on one boost screen as "in the DOM but cannot be clicked". It measured 346×431 the moment it settled: the audit was catching it **mid-turn**, where a card rotated near 90° projects to almost no width. Not a broken control — the audit catching the wrong moment, and timing-dependent, so it named a different screen each run. It waits for the screen's animations to finish before it measures anything now, bounded so an endless animation is a slow audit rather than a hung one. | Three consecutive clean runs; proved not to mask anything by shrinking the face button to 0×0, which is still reported on every route it appears | v28 |
| 2026-09-29 | **Revamp batch 3c of 5: the told story reads like a page.** The payoff screen — the thing a kid actually made — was a bordered box with a heading on it. It opens on a full-bleed cover block now: the card the story wears, the title at 1.9rem (2.6 on a tablet), the idea line under it in italic, and the reading column at a proper measure with each part opening on the same drawn rule the screen headings use. The cover comes from the view model (`assemble().cover`) rather than being looked up again by the renderer — one record, one renderer (§10.9). **The Boost fan was dropped, not forgotten**: the Boost grid already reads as a deck now that unanswered cards lie face-down, and the same effort spent here buys more than re-arranging ten cards that work. Two defects found by looking at the render: `.screen h2` drew its heading rule across the cover art, and the jump-row pills were `--paper-raised` on a `--paper-raised` card — invisible until they had a ground of their own. One found by measuring at 1024: styling `.told-story > *` reached the single wrapper `div` inside it rather than the parts, so the cover block was capped to the reading measure and sat half the width of its own page. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with a new check that the cover runs the full width of the story card; interaction (440 controls) and a11y clean; `npm run mutants -- all` 44/44 caught, one new — the cover capped back to the reading measure | v28 |
| 2026-09-29 | **Revamp batch 3b of 5: the nine beats became a board.** The Structure screen was nine text rows — the plainest list left in the app, and the one whose whole job is showing the arc. Each beat is a frame now, wearing its own card with the text written over it on a plate, two across on a phone and three from 768; a written frame takes the group's blue and fills its badge, so how far the story has got reads at a glance. **D30 amended in the doing**: it had said one frame at a time on a phone, which is a list with extra taps and loses the overview the screen exists for. The swipe stays for the Boost fan, where there is no arc to see. Three measured mistakes on the way, all mine: laying the caption out in flow inside a fixed-ratio frame **clipped the text off every one of the nine**, leaving pictures with numbers on them; a 3:4 frame is *narrower* than the card's own 0.80, so `cover` cropped sideways and left the card's printed banner running under our words; and a frame-wide wash was never going to make small text legible on a bright illustration — the caption needed something solid under it. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with two new checks — every frame wears its card, and every written frame shows the text written on it rather than clipping it; interaction (440 controls) and a11y clean; `npm run mutants -- all` 43/43 caught, one new — the art removed, which turns the board back into a list | v27 |
| 2026-09-29 | **Revamp batch 3a of 5: the answering stage.** The screens a kid spends the most time on — six questions per character, nine beats, ten boosts — were a form with a 96px thumbnail beside it. The card is the screen now (D29): bounded in height so the illustration gets the top of the view, with the question and the field on an opaque panel laid over its lower edge. The writing surface stays axis-aligned and solid; a tilted or translucent field breaks focus rings, carets and iOS scroll-into-view, which is where "physical" stops being worth it. From 768 the stage goes back to two columns, where there is width for the card to stand beside. Two measured defects on the way, both mine, both caught by the harness rather than by looking: the first overlap used a negative `margin-top` in percent, **which resolves against width, not height** — the panel never tracked the card and the field fell below the fold on six routes at three widths; and six 44px pips with an 8px gap need 304px, so on a 320 phone they wrapped to a second row and pushed the field off the screen (40px is the floor the tap-target rule allows). | `npm test` 90/90; smoke clean over 30 routes × 5 widths with a new check that the question overlaps the card at every phone width; interaction (440 controls) and a11y clean; `npm run mutants -- all` 42/42 caught, one new — the panel pushed back below the card | v26 |
| 2026-09-29 | **Revamp batch 2 of 5: the deck behaves like a deck.** `cardFace()` returned an `<img>` and nothing in the app was ever dealt, turned or put down — the single most distinctive thing about the product had no representation at all. Cards now have **two sides** (D28): the deck prints no back, so each group's divider becomes one, filled, washed in its colour and double-framed. A card with nothing written on it **lies face-down** in the Ingredients and Boost grids and turns over when you answer it, so progress is visible without reading a word and the back is somewhere a kid actually sees. Cards gained material — a lit edge, a shadow that says they are lying on something, and half a degree of carelessness each so a grid reads as cards put down rather than table cells. The die stopped being a letter in a box and became an ivory die with pips, and it throws before it lands. Caught in my own work while measuring: I built `cardBack` for a flip that happens at 96px, where it is imperceptible — the back was **dead art on arrival**, §0.1 in a new coat, which is what sent it to the grids. Still open and honest: the turn on an answering screen is invisible until that card grows, which is batch 3's job. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with two new checks — an unanswered card shows its back and an answered one its face, and the Deck shows every face whatever the story has done; interaction (440 controls) and a11y clean; `npm run mutants -- all` 41/41 caught, one new: every card face-up again, which turns the back back into dead art | v25 |
| 2026-09-29 | **Revamp batch 1 of 5: one look, one bar.** The interface still read as boring with three skins on it, which settled the question — it was never the palette. Nine modules share one skeleton (heading → explain → note → list → action bar), the deck never behaves like a deck, and five stacked bands of chrome took 210px off a phone before a word of the story appeared. This batch clears the ground: the other two looks are deleted, the **card table** is the only one (D27, dark, no theme toggle — it supersedes §1's cream paper and D15), the tab bar is gone and Stories/Build/Deck/Learn live behind one menu button (D31). 210px of chrome → 126. **Four defects found doing it, three of them mine and one older.** Rewriting `:root` dropped `--tab-h`, so `bottom: calc(var(--tab-h) + …)` became invalid and **the action bar sat 100px below the fold on every screen**. The folded-in skin rule set `position: relative` on the story header, which beat `position: sticky` — §6.2's persistent resource header had quietly stopped being persistent, and nothing had ever tested that it sticks. Removing the tab bar took the app's only labelled `<nav>` landmark and its only `aria-current` with it. And the smoke walk **aborted before printing a single recorded failure** because `page.fill`, `page.waitForSelector` and `page.textContent` were unguarded — the blast-radius bug cycle 9 fixed for clicks, still open for the other three. | `npm test` 90/90; smoke clean over 30 routes × 5 widths with three new checks — the counts stay on screen after scrolling, the bar still names where you are, and the walk now reports instead of dying; interaction (440 controls), a11y and update path clean; `npm run mutants -- all` 40/40 caught, two new (the header unstuck, the bar unmarked) and the runner no longer dies when a mutant's file has been deleted | v24 |
| 2026-09-29 | Three harness defects, no app defects — the pass turned on itself and was right each time. **Stale mutant**: one still named `--grain`, renamed to `--grain-tile` in this change, so the pass had quietly stopped testing that no SVG filter can return as a page background. **Survivor**: nothing could kill the action bar's two-line clamp, and measuring showed why — the clamp, the non-shrinking buttons and the off-screen rule below 431px are three guards for one behaviour, and with all three gone the bar only breaks its 96px budget between **431 and 440px**, a band narrower than the gap between any two widths in the sweep. A sixth width cost 20% of the sweep and caught nothing; the bar is measured continuously now, 320 to 1024 in 8px steps, and the three-guards-removed mutant dies at 432px. **False alarm**: the interaction audit summarised a screen as its text length plus its first 400 characters, so an Idea spark writing a new line of the same length as the old one read as "changes nothing" — intermittently, depending on the row drawn. It hashes the whole screen now. | `npm run mutants -- all` 39/39 caught, nothing stale; the continuous bar sweep proved to bite by removing all three guards (fails at 432px); the rebuilt audit signature proved to bite in both directions — silencing the spark write reports all five tables, and three consecutive runs with it working are clean; `npm test` 90/90, a11y and update path unchanged | v23 |
| 2026-09-29 | **Three looks, because the answer to "which direction" was all of them.** `styles.css` keeps every measurement and component skeleton; taste moves out into `skins/page.css`, `skins/deck.css` and `skins/sheet.css`, each scoped to `:root[data-look="…"]`, chosen in Settings beside the theme. Book page is the default. Shared by all three, and the real reason the old interface looked the way it did: **the body font was `--font-ui`** — every note, label, count and button in a storybook app was set in Segoe or Roboto with only the headings in a serif. The reading voice is the serif now; only the mechanical bits stay on the UI face. The screen gutter grew from 8px to 20px, and the story's cover is available behind the header for the looks that want art there. Three defects found on the way, all older than this change: a `--grain` declaration had sat **outside every rule** at the end of `styles.css` since batch 2, so both dark themes had silently been using the light theme's paper; the tablet rule set its own `.screen` padding while the section nav hung off `--gutter`, so at 1024 the nav ran 6px past the viewport **in every look**; and the four progress counts wrapped at 360 once the gutter grew. | `npm test` 90/90 with a new stylesheet-structure guard over all four CSS files — braces balanced, nothing outside a rule; smoke now runs the measurement contract in each of the three looks at 390 and 1024 on every deep route (overflow, tap targets, underlined anchors, console) as well as its own 30 × 5 sweep; interaction (443 controls) and a11y clean; `npm run mutants -- all` 39/39 caught, two new — a declaration escaping its rule, and a look never applied at boot | v23 |
| 2026-09-29 | The primary action on every screen was an underlined link. `.button` carried no `display` and no `text-decoration`, and about half the buttons in the app are `<a class="button">` — so "Write beat 4", "Keep boosting", "Back to my stories" and "Next" rendered underlined, inline, and a different height from the `<button>` sitting beside them. It survived every harness because nothing measured how a control *looks*, only that it exists, is big enough and does something. Now asserted on every route at every width. | `npm test` 89/89; smoke gains an underlined-anchor check across all 30 routes × 5 widths; a11y clean; a mutant restores the defect and is caught | v22 |
| 2026-09-29 | UX/UI audit, batch 4 of 4: the graphics. **The four group dividers stopped being dead art** — they shipped in `assets/` and appeared on no screen at all, which is §0.1 in another coat. Each now heads its group in the Deck and the rules library as a wide band: a strip, never an upright face, never inside a card grid, so A2 holds. **A story wears a cover** on the shelf — the main-character card once a hero is answered, the Idea card before that, derived from the story rather than stored. **The nine beats became one arc**: a rail runs behind the numbers and a written beat fills its node, so how far the story has got is visible without reading a word. **A finished card carries a mark**, not just the word "Answered". **The first screen anybody sees** was 500px of empty paper under a one-line form; it has a drawing now — an open book and three sparks, house-drawn, in the deck's idiom but unmistakably not a card (D25). Plus torn-paper spark chips, `prefers-contrast: more` tokens, and `explain()` ornament. Dropped after building it: the told story's drop cap — every passage opens with its card's phrase in small caps, and dropping the first letter of "Once upon a time" leaves a giant O in front of "NCE UPON A TIME"; the connector is already the flourish and got the room instead. Found by the interaction audit while finishing: an Idea spark could hand back the line already on screen, one draw in sixteen, and a button that appears to do nothing reads as broken. | `npm test` 89/89; smoke gains five checks — the divider is a band and not in a grid, answered cards carry their mark, the rail marks what is written, and a spark never repeats itself over twelve taps; interaction (440 controls, twice) and a11y clean; `npm run mutants -- all` 36/36 caught, five new | v21 |
| 2026-09-29 | UX/UI audit, batch 3 of 4: the screen itself. **Chrome** (D22): 248px of header, story header, nav and tab bar stood between a kid and the first word of their story — 29% of a 390×844 phone — and every build screen then printed the step name a second time, 45px under the nav pill that already said it in the accent colour. The story header is two lines now, the duplicate heading stays in the document for the outline and stops being drawn, and the nav pills are shorter: 248px → 210px, and the writing field on a question screen moves up about 95px. Both are budgets with tests behind them now, not one-off fixes. **Tablet** (D23): only the beat list added density; the shelf, the examples and the rules library ran one stretched column with the other half of the screen empty. They go two-up at 1024, and the tab bar's four tabs keep a phone's measure and centre instead of spreading over a metre. **And `explain()` stopped looking like an empty text field** — it carried an input's border, radius, raised background and width on every screen; it is a left rule and a caret now, at a readable measure. | `npm test` 88/88; smoke gains five contract checks over every route × width — chrome budget, nothing named twice, and the two-up columns proved at both 1024 and 390; interaction (440 controls) and a11y clean; `npm run mutants -- all` 31/31 caught, two new — the tablet flattened back to one column, and the step named twice again. At 1024 the rules library drops 4.5 → 2.9 screens and the worked Hänsel and Gretel 6.8 → 3.2 | v20 |
| 2026-09-29 | UX/UI audit, batch 2 of 4: the visual system (D19). The app now looks like it belongs to the deck rather than beside it. **A display face**: IM Fell English, Igino Marini's revival of a 17th-century punchcut, SIL-OFL, subset to what the app sets and bundled at 42KB — headings, card headlines, beat headlines and the told story's connectors. It replaces a stack that resolved to Iowan on iOS and Georgia on Android, so the app looked like two different apps. **Paper**: a noise tile at a few percent under everything, one per theme. **A drawn rule** under every screen heading — house-made, hand-wobbled, never the deck's lettering (D25). **Icons**: the four tabs, the theme toggle and Settings were emoji, which rendered as four different glyphs on four devices and as empty boxes where the glyph was missing; they are inline SVG now, stroked in `currentColor`. **Motion** (D24): press and hover feedback, a 140ms screen arrival, a die that tumbles when thrown and not when merely shown again, sparks that fade in — all behind `prefers-reduced-motion`. Found while building it, and now a rule in §4 with a test behind it: the paper grain was first an `feTurbulence` filter, which the browser re-runs over the whole page on every paint — `#/build/ingredients` became literally unpaintable, a full-page screenshot never returning. Decoration is baked from now on. Also fixed on the way: the drawn rule rendered invisibly because its `#` was double-encoded, and IM Fell's old-style figures made the beat badges read as letters, so badges keep the reading serif. | `npm test` 88/88 with four new guards (icon coverage both ways, no SVG filter in a background); smoke 30 routes × 5 widths, interaction 440 controls, a11y and update path all clean; `npm run mutants -- all` 29/29 caught, two new — a tab losing its icon, and a live filter coming back as a background. Paint time at 390 on the stress fixture: unbounded → 185–304ms per route | v19 |
| 2026-09-29 | UX/UI audit, batch 1 of 4: the three things measurement said were broken. **A card face could not be read.** `cardFace()` returned a bare `<img>` — the Ingredient cards print their six questions on the art, the answering layout shows that art at 96px, and since v16 a kid cannot pinch it open either, so the card's own words were unreadable everywhere they mattered. Every face outside a card tile is now a button opening a lightbox (D20). **The action bar grew to 171px on the Tell page at 390×844** — an unclamped context line wrapped to eight rows and crushed the two buttons it was meant to explain; it now clamps to two rows and the buttons stop shrinking. **The section nav never scrolled the current pill into view**, so from step 5 the one pill that says where you are sat off the right edge. Also recorded: the Phase 11 visual decisions D19–D25. | `npm test` 84/84; smoke gains eight checks — the lightbox opens, is at least 240px wide and closes; the action bar stays ≤96px and the current pill stays inside the nav, both asserted on every route × width; interaction (440 controls) and a11y clean; `npm run mutants -- all` 27/27 caught, three of them new: the lightbox unwired, the context clamp removed, the pill-centring dropped. Measured before/after at 390×844: Tell's action bar 171px → 63px, current pill off-screen → visible | v18 |
| 2026-09-02 | Deleting a storyteller or a story made findable. Both controls have existed since Phase 1 and both worked; neither could be found. The only route to removing a storyteller was a button labelled **Switch**, a word that does not mean remove, and Settings — the first place a person looks to delete themselves or the thing they are working on — offered neither. The shelf control is now **Storytellers**, labelled for all three verbs it performs; Settings gains a storyteller section that opens the same manager, and a "Delete this story" for the story currently open, both at the end of the scroll and out of the thumb's arc (§6.1). Removing the last storyteller was already allowed and is now asserted: it returns the app to first run rather than stranding it. This is §0.2 in a new coat — a control that exists but cannot be reached is a permission the app has removed. | `npm test` 84/84; smoke gains six checks — the shelf control's own label, both Settings controls, the confirmation naming what goes, the story actually going, and the last storyteller removable; interaction (430 controls) and a11y clean; `npm run mutants -- all` 24/24 caught, including three new ones: the label reverted to "Switch", the Settings delete wired to nothing, and the last storyteller made unremovable | v17 |
| 2026-09-02 | The zoom lock made real. The viewport meta has said `user-scalable=no` since Phase 0, and iOS Safari has ignored that since iOS 10 — so on the phone this app is most likely to be held, pinch-zoom still worked and the locked layout was a claim rather than a fact. `src/zoom.js` refuses the gestures themselves: iOS `gesturestart`/`change`/`end`, any two-finger `touchmove`, and a ctrl/⌘ wheel (a trackpad pinch). One-finger scrolling and a plain wheel are explicitly left alone, and double-tap stays with `touch-action: manipulation` rather than a touchend guard that would eat the second tap on a button. The accessibility debt is unchanged and still paid in Settings. Added with it: `tests/shell.test.mjs`, because §5 has always required a new module to reach the app-shell list and the module map, and nothing enforced it — a module missing from the shell is invisible until the app is opened with no signal. | `npm test` 84/84 (the shell guard proved to bite: it went red on `zoom.js` before the module map had a row for it); smoke gains five zoom checks over 30 routes × 5 widths; interaction, a11y, update path clean; `npm run mutants -- all` 21/21 caught | v16 |
| 2026-09-01 | Machine audit stopped, by decision rather than by the stopping rule: eleven cycles, 48 findings, the last cycle producing three. `docs/AUDIT.md` gains a closing section — the cycle-by-cycle count, the lesson that changing the method found something every time while repeating one found almost nothing, the five things most likely still wrong (wording for a 12-year-old first among them), and the methods left untried. The next finding should come from a kid, or from you, holding a phone. | Final state: `npm test` 81/81 · smoke 30 routes × 5 widths + adversarial, sub-path and no-art sweeps · interaction audit on two fixtures · a11y · update path · 17/17 mutants caught | v15 |
| 2026-09-01 | Audit cycle 11, back to the app: every screen with nothing in it, and state that has rotted. Three findings. **Ruling A8 was wrong in practice** — the before-version froze on merely *opening* the Boost step, so a kid tapping through the tabs on an empty story locked an empty draft for ever and lost the comparison the whole Boost chapter exists for. It now locks when boosting begins: the first boost answered or skipped. The Tell page also offered two identical readings until the story moved on, and a record from another version could put unknown boosts and out-of-range beats on a screen. | `npm test` 81/81; smoke, interaction, a11y, update-path and the mutation pass all clean | v15 |
| 2026-09-01 | Audit cycle 10, mutation: sixteen mutants, each breaking one rule, to find out which guards actually bite. Three survived, all gaps in the harness rather than the app. The snapshot's deep copy was correct by luck — every test changed stories through `writeBeat`, which builds a new object, so a shared reference passed them all. The house-example guard counted flags instead of naming them, so un-flagging one left five and passed. And the placeholder path, required by §11 since Phase 0 and verified once by hand, had never run in an automated pass because the art is always present — smoke now blocks the art on one route. | `npm run mutants -- all`: 16/16 caught after the fixes; `npm test` 79/79; smoke, interaction, a11y, update-path clean | v14 |
| 2026-09-01 | Audit cycle 9, reading every guard for what it lets through. Five findings, and the first is the worst of the nine cycles: a broken control aborted the smoke walk at that line, so every check after it silently never ran — proved by breaking the boost Skip button, which produced a stack trace and no findings at all. Stalls and unclickable controls are now findings, and the walk finishes. Also: an `assert.ok(true)` that could never fail, two `explain()` exemptions granted because the routes failed rather than because the rule did not apply, an a11y sweep that never opened a `<details>`, and fifteen routes skipping the above-the-fold check in silence. | `npm test` 78/78; smoke 30 routes × 5 widths; interaction, a11y, update-path clean. The rebuilt P8 check proved to bite: breaking the skip write now yields three precise findings and a completed walk | v14 |
| 2026-09-01 | Audit cycle 8, the reversibility inventory: every action that destroys state, checked for an undo or a confirmation that names the loss. Two findings. Loading a backup silently replaced any story sharing an id — it now lists them by name and asks. And a character or world could be added but never removed, so a mis-tap was permanent; there is a remove control now, at the end of the scroll, and the before-version keeps its own copy either way. The inventory itself is now a table in §10.10, including the two losses deliberately left unprotected. | `npm test` 78/78; smoke over 30 routes × 5 widths, twice; interaction, a11y and update-path clean | v14 |
| 2026-09-01 | Audit cycle 7, reading the booklet against the app sentence by sentence — the pass that finds what was never extracted, because no scan can see an absence. Two findings. The Idea card, which the booklet opens with, existed in `data.js` with art, guidance and three examples and appeared on no screen at all; the Learn coverage guard that would have caught it carried an exemption written by hand. It is now beside the idea sentence, in the Deck and in the rules library, and a mechanical guard asserts every group of cards is reachable in the browser. | `npm test` 75/75; smoke clean over 30 routes × 5 widths. Reachability guard proved to bite by removing the Idea section (data test 15 went red) | v13 |
| 2026-09-01 | Audit cycle 6, run by changing the method rather than repeating it: an adversarial seed state (`messy`), widths nobody had measured (280), the module seams, the app's own copy read for promises, and the update path. Five findings. The seam walk found one fact kept in two records — `boosts[].spawned` and `cast[].origin` both said which boost invented a card — now derived from the card alone. | `npm test` 74/74; smoke (with a messy sweep), interaction, a11y and the new `npm run update` all clean. The update-path pass was proved to bite by silencing the toast | v12 |
| 2026-09-01 | Audit cycle 5, with a new spark-shape pass (`npm run sparks`) that reads all 704 fragments as writing rather than as rows. Four findings, all fixed: `prefillFrom` in `data.js` was a field the engine never read (it hardcoded beat 2 instead); three spark tables where a draw of three read as one suggestion stuttering; the not-found screen was the app's only dead end; and card grids ran one-column at 320, which put the Boost step at 7.4 screens. | `npm test` 73/73; smoke, interaction (mid-story and stress), a11y all clean. New checks: every route leads somewhere, and a draw avoids three rows opening the same way. Stress at 320: Ingredients 6.5 → 3.6 screens, Boost 7.4 → 4.0, Deck 6.0 → 2.3 | v11 |
| 2026-09-01 | Sparks under every field: 39 tables, one per input the app asks for, keyed by the input's own id, plus the five open tables the Idea screen already had — about 640 fragments. "Stuck? Three words" draws three, tapping one drops it in at the cursor, and rows carrying `{hero}` / `{villain}` are filled in from what the story has named. `sparks.js` splits out of `idea.js` as the module map always said it would. | `npm test` 71/71; smoke, interaction audit (416 controls) and a11y sweep all clean. Coverage proved to bite in both directions (deleted a beat's table and misspelled a key: both caught). Found and fixed while measuring: the three chips landed under the fixed action bar on a phone, so a kid tapped the button and saw nothing — rolling now scrolls them into view, and a check pins it | v11 |
| 2026-09-01 | Deployed: a Pages workflow that runs `npm test` and then publishes the repository as it stands (there is no build step), and the 34 card faces committed at the owner's decision so the live app shows real cards rather than placeholders. README and §11 updated to say what now ships and where the licensing responsibility sits. | Workflow green (test job then deploy job, both success). Smoke gained a sub-path pass: the app is served under `/fabula/` the way Pages serves it, and the boot, the card art and the service worker's scope are all checked there — the sandbox's proxy blocks `github.io`, so this is the closest verification available from here and the live URL is unverified by me | v10 |
| 2026-09-01 | Phase 8, the tablet: one `answerLayout` puts the card beside the question it asks, at every width — 96px on a phone, 132px from 430, a sticky 200–320px column from 768 — with the reading measure capped and the beat list going two-up at 1024. Measuring it showed the writing field falling below the fold on a phone, so the field now comes before the guidance on every answering screen: what you touch every time sits above what you read once. | `npm test` 62/62; smoke clean over 28 routes × 5 widths with two new contract checks — the field above the fold at every width, and the tablet proved to add density rather than stretch (flattened the grid to one column: 9 failures, restored). Stress probe: the beat screens drop from 2.0 to 1.4 screens at 1024, the nine-beat list from 2.1 to 1.4 | v10 |
| 2026-09-01 | Phase 9 hardening, first cycle: committed seed fixtures (fresh / mid-story / stress), a shared harness, the layout probe, the interaction audit and the accessibility sweep — and `docs/AUDIT.md`, which records 17 findings across the build. The interaction audit was clean until it was proved not to bite: its route list never entered a step, so it had never clicked the controls that do the work. With the deep routes added it caught a deliberately broken Skip button three times. | `npm test` 62/62; smoke clean over 28 routes × 5 widths, seeded mid-story; interaction audit clean on mid-story and stress, 400 controls each; a11y sweep clean over 24 routes. Fixed on the way: an 11.5-screen Tell page with no jump row, an in-page anchor the hash router would have read as a route, smooth scrolling that ignored reduced motion, an unlabelled file input, two routes where nothing carried `aria-current`, and a smoke sweep that had been measuring an empty app | v9 |
| 2026-09-01 | Phase 7: the rules library (how it works, the five steps, every card, the seven drawing tips) with search and a link from every card to its entry; both booklet stories as complete story records, read through the same assembly as a kid's own, with Hänsel & Gretel carrying its pre-Boost draft so it is genuinely told twice; and the ten-step first-story walkthrough, linked from the empty shelf and from Settings. | `npm test` 62/62, scan clean; `npm run smoke` clean over 29 routes × 5 widths, three consecutive runs. Findings fixed on the way: a dead `stubScreen` export and its unreachable branch in `build.js` (with `contextLine` and two imports that died with it), and 29 rules-library links at 17px | v9 |
| 2026-09-01 | Phase 6, Tell: the nine beats assembled into one told story, each passage introduced by its own card phrase; the before/after toggle reading both versions out of the same record; print, save-as-text and copy. Unanswered cards and blank beats are simply left out, with a quiet line saying how many beats are still blank — never a scold (A10). **Milestone reached: a story can be built and read back end to end.** | `npm test` 47/47, scan clean; `npm run smoke` clean over 25 routes × 5 widths, including a browser check that the before-version lacks the beat the boost rewrote | v6 |
| 2026-09-01 | Phase 5, Boost: the ten cards as a grid, each answerable and skippable (P8). A boost can invent an Ingredient card that carries `origin: boost:<id>` and is listed back on the boost that made it (P6), and can send you to a beat and back again with the route remembering where you came from (P7). The before-version freezes automatically on first arrival (A8), with a re-freeze control that names what it discards. | `npm test` 40/40, scan clean; `npm run smoke` clean over 25 routes × 5 widths, three consecutive runs, including a browser check that the snapshot keeps the old beat text after a boost rewrites it | v5 |
| 2026-09-01 | Phase 4, Structure: the nine beats as a list with previews and blank dots, a one-beat view with pips, the booklet's guidance and its Little Red Riding Hood line per beat, and ruling A5 — beat 2 arrives pre-filled from the "Something happens" card, once, carrying a line that says where it came from and that the card will not change. | `npm test` 33/33, scan clean; `npm run smoke` clean over 23 routes × 5 widths, including a browser check that editing beat 2 leaves the ingredient untouched. A5 guard proved to bite by letting the pre-fill overwrite a written beat (test 30 went red, restored). Also replaced the smoke walk's fixed waits with polling after a 1-in-4 flake (template defect D-15) | v4 |
| 2026-09-01 | Phase 3, Ingredients: a grid of the four cards in any order, with add-another on hero/villain/world and a reversible skip; inside a card, one question at a time with numbered pips that jump anywhere, the booklet's example answer collapsed under each, and autosave. Hardened the dead-data scan to strip string literals before asking whether a name is used. | `npm test` 27/27, scan clean; `npm run smoke` clean over 20 routes × 5 widths, with new walk steps covering P1, P2 and P3. The hardened scan immediately found a dead `explain` import that the old one had masked | v3 |
| 2026-09-01 | Phase 2, the Idea step: the sentence field with debounced autosave, the crypto-backed die showing one Prompt card large with its guidance and examples, unlimited re-rolls with every roll kept in a visible history, and five house-aid spark tables. Adds the dead-data scan to `npm test`. | `npm test` 27/27 incl. die uniformity over 60k rolls and an old-shape normalization fixture; `npm run smoke` clean; scan clean. Findings fixed on the way: 2 dead exports, 5 dead imports, a `.modal-actions` class collision, a storyteller-removal path with no control (now wired, with a confirmation naming the lost stories), and stacked modals | v2 |
| 2026-09-01 | Phases 0 and 1: app shell (frame, tabs, section nav, sticky story header carrying the progress counts), storybook theme light+dark with a text-size control, hash router, localStorage layer with normalization and JSON export/import, storytellers and the story shelf, the Deck browser, PWA manifest + service worker with the update toast. Browser smoke harness added. | `npm test` 16/16; `npm run smoke` clean over 18 routes × 5 widths, with card art present **and** absent; smoke found 4 real defects on its first run (no `explain()` on the build and Learn screens, a 16px back link, a 16px range and 22px file input) — all fixed | v1 |
| 2026-09-01 | `data.js` written: all 30 playable cards with headline, questions, paraphrased guidance and examples; house-added examples flagged; `CARD_ERRATA`. Parse gate + 16 data invariants added (T1–T6, T12 ticked). | `npm test` 16/16; guard proved to bite by unflagging a house example (test 13 went red, restored) | — |
| 2026-09-01 | Card art pipeline: `tools/extract-cards.py` generates 34 WebP faces under stable ids; `assets/cards/` gitignored so no publisher art is distributed. App must degrade to placeholders when absent. | 34 files, 3.22MB, max 195KB, ids reconciled against the inventory | — |
| 2026-09-01 | Instantiated this spec from the v3 template. Card inventory extracted and verified from the DIY PDF (34 images); Stage B product decisions D1–D18 recorded; ambiguity rulings A1–A10 proposed; roadmap and ledgers seeded, all boxes unticked except T11 (art extracted, not converted). No application code yet. | Card count reconciled against the booklet's "34 illustrated cards" | — |
