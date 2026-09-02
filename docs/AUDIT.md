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
| Accessibility sweep | `node tests/a11y.mjs` | ~20 s |
| Measured layout / stress | `npm run probe -- stress` | ~30 s |
| Flow walk | by hand | ~30 min |

Seed states live in `tests/fixtures/` and are regenerated with `npm run fixtures`:
**fresh** (nothing created), **mid-story** (a story at the Boost step, two heroes, a snapshot
taken), **stress** (three storytellers, thirteen stories, and one story with four heroes, two
villains, three worlds, nine long beats, ten boosts answered and forty die rolls).

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
