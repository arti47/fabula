# Audit log

Numbered findings, pass by pass, as **Rule / Target / Fix / Why it mattered**, plus the
verified-clean list so later cycles do not re-litigate settled ground (CLAUDE.md §9).

The stopping rule: the build is done when one complete cycle of every pass produces no finding.
A cycle that produces only cosmetic findings is still a cycle that produced findings.

## Passes, and how to run them

| Pass | Command | Cost |
|---|---|---|
| Parse gate + unit and data invariants | `npm test` | seconds |
| Dead-data scan | `npm run scan` (inside `npm test`) | seconds |
| Browser smoke — 28 routes × 5 widths + the walk | `npm run smoke` | ~1 min |
| Interaction audit — every control, in isolation | `npm run audit` / `npm run audit -- stress` | ~2 min |
| Accessibility sweep | `npm run a11y` | ~20 s |
| PWA update path | `npm run update` | ~15 s |
| Spark-shape pass | `npm run sparks` | seconds |
| Measured layout / stress | `npm run probe -- stress` | ~30 s |
| Flow walk | by hand | ~30 min |

Seed states live in `tests/fixtures/` and are regenerated with `npm run fixtures`:
**fresh** (nothing created), **mid-story** (a story at the Boost step, two heroes, a snapshot
taken), **stress** (three storytellers, thirteen stories, and one story with four heroes, two
villains, three worlds, nine long beats, ten boosts answered and forty die rolls), **messy**
(emoji, 600-character unbroken words, quotes, angle brackets, right-to-left text, whitespace-only
answers — what a kid types when nobody is watching).

---

## Cycle 1 — during the build

Findings that the harnesses caught as each phase landed. All fixed in the same change.

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 1 | Every screen carries a collapsed `explain()` note | Build screens, Learn | Added notes to the no-story empty state and the Learn stub | Two of the app's own screens taught nothing; the empty state is the first thing a new kid reads |
| 2 | Tap targets ≥ 40px measured on the wrapping label | Card back-link, text-size range, file input | `.back-link` at 44px; inputs given explicit height and ≥16px type | 16px and 22px targets on a phone, in the thumb's arc |
| 3 | Data has a consumer | `store.removeStoryteller` | Wired into the storyteller switcher with a confirmation naming the stories it takes | A whole function nothing could reach — and the destructive one |
| 4 | One class, one meaning | `.modal-actions` on story rows | Story rows use `.row-actions` | Two meanings for one class; the harness selector hit the wrong button, and so would a stylesheet change |
| 5 | Modals do not stack | Storyteller switcher → remove confirm | The switcher closes before the confirm opens | Two dialogs, and a focus trap fighting another focus trap |
| 6 | Poll for change, never a fixed wait (D-15) | Smoke walk | `settled()` polls for the expected text | A 1-in-4 flake: hash clicks re-render on `hashchange`, which fires after the hash is set |
| 7 | An export nothing reads is a finding | `stubScreen` and its branch in `build.js` | Removed, along with `contextLine` and two imports that died with it | Dead code that still had to be read and maintained; the scan found it the moment the last step landed |
| 8 | Every card links to its rules entry | Learn entries | Card links restyled as 44px targets | 29 links at 17px on the one screen a kid reads sitting still |
| 9 | Scan must see through string literals | `tools/dead-data.mjs` | Comments and quoted strings stripped before the usage test | A class name in quotes masked a dead import — the scan was reporting clean while missing them |

## Cycle 2 — the hardening pass

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 10 | An audit that finds nothing is suspect | `tests/harness.mjs` route list | Added every in-step route: a character's questions, a beat, three boost screens, a card, a rules entry | The interaction audit was clean because it never visited the screens that do the work. Proved by breaking a boost's Skip button: the old route list reported nothing, the new one caught it three times |
| 11 | A no-op is a finding, unless the control means it | `tests/interaction.mjs` | Self-links carrying `aria-current` are skipped; `window.print` is counted; scrolling counts as change | Nine false findings that would have trained us to ignore the pass |
| 12 | A long screen gets a jump row, not less content (§6.5) | Tell page under stress | Jump row to the story, the cast, the world and the boost notes | 11.5 screens of scrolling to reach the cast list on a full story |
| 13 | An in-page anchor is not a route | Tell jump row | Buttons that `scrollIntoView`, not `href="#id"` | Introduced during #12: an anchor would have been read as an unknown route and shown "Nothing here" |
| 14 | Reduced motion is honoured | Tell jump row | `behavior` follows `prefers-reduced-motion` | Smooth scrolling ignores the media query unless you ask it not to |
| 15 | Every field has a label | Settings import control | `<label for="import-file">` | The file input announced itself as "file" |
| 16 | Navigation says where you are | Header settings link, tutorial | `aria-current` on the header link; the tutorial belongs to the Learn tab | Two routes where nothing on screen said which section you were in |
| 17 | A harness must measure the real app | Smoke route sweep | Seeds the `mid-story` fixture, and asserts it loaded | Every route was being measured empty, which is the state no kid is ever in |

## Cycle 3 — the tablet pass

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 18 | A tablet adds density, never stretches (§16.2) | Answering screens | One `answerLayout`: the card sits beside its question at every width, sticky from 768; the reading measure is capped; the beat list goes two-up at 1024 | A scaled-up phone layout looks like a decision. Stress probe: beat screens 2.0 → 1.4 screens at 1024, the nine-beat list 2.1 → 1.4 |
| 19 | The primary action is above the fold (§6.3.2) | Beat, ingredient and boost screens on a phone | The writing field now comes before the guidance — what you touch every time above what you read once | On a 390px screen the field started below the fold: a kid landed on the answering screen and had to scroll to answer |
| 20 | Frequency decides height (§6.3.4) | Same screens | Guidance and examples moved under the field | The teaching is still on screen, which is what §0.1 requires; it is simply no longer in the way |

Both new contract checks were proved to bite: flattening the tablet grid to one column produced
nine failures, and the field-above-the-fold check is what found #19 in the first place.

---

## Verified clean

Checked, found sound, and not to be re-litigated without a reason:

- **Card data** — 30 playable cards, ids and art ids unique, die faces one per prompt card, beats
  numbered 1–9, every card carrying headline, guidance and at least one example. Reconciled against
  the printed deck in `docs/card-inventory.md`.
- **The die** — `crypto.getRandomValues` with the modulo tail rejected; uniform within 5% over
  60,000 rolls; every roll stored and rendered from the stored value, never re-rolled on a render.
- **Ruling A5** — beat 2 pre-fills once from the inciting event and never overwrites a written or
  deliberately cleared beat; editing the beat leaves the ingredient alone. Unit tested and checked
  in the browser.
- **Ruling A8** — the snapshot is taken on first entry to Boost and never re-taken on its own; the
  before-version keeps its text after the story moves on.
- **Permissions P1–P10** — every row of the traceability ledger names a control and a test.
- **Export / import** — round-trips a full story; an old-shape record normalizes with defaults
  back-filled; junk in the array fields does not reach a screen.
- **Missing card art** — every face either loads or shows a labelled placeholder; the whole harness
  passes with `assets/cards/` empty.
- **Layout** — zero horizontal overflow at 320/360/390/768/1024 in the stress state; no control
  under the fixed tab bar; the primary action above the fold on every screen that has one; the
  writing field above the fold on every answering screen; the tablet measurably denser, not wider.

## Cycle 4 — the per-input sparks

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 21 | Content must reach a screen, and a screen must have content (§0.1) | 39 spark tables | Two tests, opposite directions: every input has a table, every table has an input | 39 tables and 39 inputs drift apart the moment either list changes. Proved by deleting `beat.7`'s table and misspelling `hero.age`: caught as two separate failures |
| 22 | A control must visibly do something | Spark chips on a phone | Rolling scrolls the three into view, clear of the fixed action bar | The chips rendered below the fold behind the action bar: tap the button, nothing appears to happen. The button worked perfectly and read as broken |
| 23 | Poll for change, never measure once (D-15) | The check written for #22 | `waitForFunction` on the settled position | The check raced its own smooth scroll and failed against correct code — the same defect it was written to catch |
| 24 | House aids identify themselves (§2.2) | Every field on 39 screens | "ours, not the deck's" beside every spark control | 640 invented fragments sitting inside an app about somebody else's deck |

## Cycle 5 — all seven passes, plus a spark-shape pass

Run against the per-input sparks. The new pass (`npm run sparks`) reads all 704 fragments as a body
of writing rather than row by row: repetition across tables, tables that say one thing sixteen ways,
long words, and the fragments closest to being finished answers.

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 25 | Data extracted must be data consumed (§0.1) | `BEATS[1].prefillFrom` | `structure.js` now finds the beat that declares `prefillFrom` and reads which ingredient it names, instead of hardcoding beat 2 and "inciting" | The field sat in `data.js` describing a rule the engine implemented separately. The behaviour was right and the data was decoration — exactly the defect this project is most prone to, found by asking of each field "where is this read?" |
| 26 | Three suggestions should read as three | `boost-why-villain` (13/16 opened "they"), `boost-faults` (9/16), `villain.fear` (6/16) | Openings varied in the content, **and** the draw now prefers rows with different opening words where the table allows it | Tapping for three and getting "they were left behind / they were told to / they cannot stop" reads as one suggestion stuttering. Only visible in aggregate — no per-row test could see it |
| 27 | Every screen leads somewhere (§6.3.6) | The not-found screen | A link back to the shelf, and a smoke check on every route | The one screen in the app with no onward route was the one a kid reaches by accident |
| 28 | A phone is 320px wide too | Card grids under stress | Grid minimum 150px → 132px, so the smallest phone gets two columns | Ingredients ran to 6.5 screens, Boost to 7.4, the Structure deck to 6.0. Now 3.6, ~4.0 and 2.3 |

Passes run clean: dead-data · guidance surfacing (after #25) · permission sweep (all nine controls
present) · interaction audit on mid-story and stress · accessibility · measured layout at 320 and
1024 under stress · onward-route walk.

**Not a clean cycle** — four findings, so another is owed before the build is done.

## Cycle 6 — the method changed, not repeated

Three passes had come back clean twice, which the template says is when to suspect the pass. So:
a seed state the passes had never seen, a width nobody had measured, the seams between modules, the
app's own copy read as promises, and the one behaviour never tested at all.

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 29 | One fact, one record (§10.11, D-5) | `boosts[].spawned` vs `cast[].origin` | What a boost invented is derived from the card's own `origin`; the boost keeps no copy | Both recorded "this boost made this card", each feeding a different screen. Nothing reconciled them, so a divergence would have been invisible — the seam walk is the only pass that could see it |
| 30 | Text must wrap, not widen the page | Every text surface, at 280px with the messy fixture | `overflow-wrap` on the body and on every story surface | A 600-character unbroken word gave the Tell page **4214px** of horizontal overflow. A kid holding a key down does this |
| 31 | Copy is enforced or marked guidance-only (§10.13) | Tutorial step 7 | Rewritten to say the version is frozen when the Boost step is opened | It told a kid that visiting Tell saved the version to compare against. The engine snapshots on entering Boost. The outcome usually matched by luck; the sentence was false |
| 32 | Do not promise privacy the app does not enforce | Tutorial step 1, first-run copy | "keeps their own stories apart", and says plainly it is not a lock | It said another kid on the same tablet would "never see yours". Anyone can switch storyteller. Overstating separation is worse than not claiming it |
| 33 | Test the update path (§4) | Nothing tested it | `npm run update`: the worker installs and controls, the app opens offline, and a deploy offers "a new version is ready" | The one PWA behaviour that cannot be checked by looking at the running app. Proved to bite by silencing the toast |

Also run clean: dead-data · guidance surfacing · permission sweep · spark-shape · interaction on
mid-story and stress · a11y · measured layout at 280/320/1024 · onward-route walk.

**Not a clean cycle** — five findings. Another is owed.

## Cycle 7 — the booklet, read against the app

The pass no scan can do: read the source sentence by sentence and ask where each one happens in the
app. It is how the template says to find rules that were never extracted — an absence leaves no
trace to grep for.

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 34 | Guidance extracted must be guidance surfaced (§0.1) | The Idea card | Shown beside the idea sentence with its headline, guidance and examples; added to the Deck browser and the rules library | *"Let's take the top card of the deck: imagine putting the Magic Hat of Ideas on your head."* The card the booklet opens with had art, three sentences of guidance and three examples in `data.js`, and appeared on **no screen**. Only its one-line `starter` was used |
| 34a | A guard with an exemption is not a guard | `tests/learn.test.mjs` | The `id !== 'idea'` exemption removed; a new data test asserts every group of cards is reachable in the Deck | The coverage test that should have caught #34 had been taught to skip the one card that failed it. Written by hand, at the time the test was written |
| 35 | Where the source contradicts itself, rule and record it (§3.5) | Step numbering | Ruling **A11**: five steps with the Idea as step 1 | The booklet numbers its steps twice and differently — five activities in the overview, four "STEP" chapters where the idea is preliminary. The app had quietly picked one without saying so |

Read and found present: the four card groups and their colour coding · every Prompt card's guidance
and examples · the any-order, skip-one, use-one-twice permissions · the "leave it blank and carry
on" note · the nine beats with the cottage-and-dragon examples · the boost order permission ·
telling it again · the seven drawing tips · both worked stories.

**Not a clean cycle** — three findings. Another is owed.

## Cycle 8 — the reversibility inventory

Every action that destroys state, listed, and checked for an undo or a confirmation that names the
loss (§10.18). The inventory now lives in CLAUDE.md §10.10 rather than in this pass's head.

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 36 | Destructive actions confirm and name the loss (§6.4) | Loading a backup | Confirms first, listing by name the stories it would replace, and says the rest of the shelf is untouched | It overwrote any story sharing an id and said only "Loaded 3 stories". A kid loading last month's backup lost this month's work with no warning and no undo — the worst combination in the app |
| 37 | A permission you can exercise, you can un-exercise (§10.18) | Adding a character or world | A remove control at the end of the scroll, confirming, with the snapshot keeping its own copy | "Add another" was uncapped and one-way. A mis-tap left a blank character in the story and in the read-back for ever. The permission had a control; its inverse had none |

Deliberately left unprotected, and now recorded as decisions rather than gaps: clearing a field
(it is typing, and autosave is the point) and a spark inserted over selected text (standard editing
behaviour).

**Not a clean cycle** — two findings. Another is owed.

## Cycle 9 — every guard read for what it lets through

Cycle 7 found a test taught to skip the one case that failed it, so this pass read all 78
assertions and both browser harnesses asking: what does this let through, and was it shaped to fit
the code rather than the rule?

| # | Rule | Target | Fix | Why it mattered |
|---|---|---|---|---|
| 38 | A breakage is a finding, not the end of the pass | `settled()` and every click in the smoke walk | Both record a finding and carry on | **The worst of the nine cycles.** A control that stopped working aborted the walk at that line, so every check after it silently never ran. Breaking the boost Skip button proved it: the run died with a stack trace and reported nothing. It now reports three precise findings and finishes |
| 39 | An assertion that cannot fail is not a guard (D-14) | `assert.ok(true)` on the P8 check | Reads the stored `skipped` flag before, during and after | It asserted the literal value true. The steps around it did real work, but the check itself could never fail |
| 40 | An exemption must be earned | The `explain()` skip list | `#/learn/<id>` never needed exempting; `#/deck/card/*` was hiding a real gap, and now carries a note | Two of the four exempted routes were exempted because they failed, not because the rule did not apply |
| 41 | A sweep must see what the app actually shows | `a11y.mjs` | Opens every `<details>` before measuring | Most of this app's content is inside collapsed panels — the explain notes, every rules entry, every worked example. None of it had ever been checked. It came back clean, but the sweep had been claiming more than it did |
| 42 | A silent skip becomes a hole | The above-the-fold check | Screens with no pinned action are listed in the output | Fifteen routes were being skipped without saying so. They are all reference screens and the exemption is right — but it is a decision now, not an absence |

**Not a clean cycle** — five findings, and the first of them means every earlier smoke run proved
less than it appeared to.

## Deployment

The app is published to GitHub Pages from `main` by `.github/workflows/pages.yml`, which runs
`npm test` before it deploys. Pages serves under a sub-path (`/fabula/`), so the smoke harness
serves the app that way too and checks that the boot, the card art and the service-worker scope all
survive it — every URL in the app is relative for this reason.

**Not verified from here:** the live site itself. The build sandbox's proxy refuses `github.io`, so
the deployed URL has never been opened by the harness. Worth one human look on a real phone.

## Still to do

- **Flow walk** — playing a whole story through by hand on a real device, asking at each step what
  to tap next.
- **Contrast and screen-reader flow** — the sweep checks structure; neither of these is machine
  checkable and both want a human.
