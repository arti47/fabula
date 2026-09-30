# Device check — what only a real phone can prove

About ten minutes, on a phone, ideally one iPhone (Safari) and one Android (Chrome). The harnesses
run in a desktop Chromium. Everything below either depends on hardware (notch, keyboard, vibration,
touch) or on the operating system (install, offline, share, files), so no automated pass can see it.

**App:** https://arti47.github.io/fabula/ (live since v38)

Record each result as **✓**, **✗** or **?** (unsure). For every ✗, fill in a row of the findings
table at the end — the device, the step, what you expected, what happened, and a screenshot if you
can. A kid running it is better than an adult: note where they hesitate, not only where it breaks.

---

## A. Install and frame (2 min)

| # | Do | Expect | iOS | Android |
|---|---|---|---|---|
| A1 | Open the link, then *Share → Add to Home Screen* (iOS) or *⋮ → Install app* (Android). Open it from the home-screen icon | Opens without the browser's address bar; icon and name read "Story Machine" | | |
| A2 | Look at the very top of the screen in the installed app | The bar (☰, place name, ⚙) sits **below** the clock/notch, never under it (D51, safe areas) | | |
| A3 | Turn the phone sideways on any screen | Nothing hides behind the notch on the left or right; no sideways scrolling | | |
| A4 | Pinch with two fingers on any screen | Nothing zooms (zoom lock, §4). One-finger scrolling still works | | |

## B. First run and shelf (2 min)

| # | Do | Expect | iOS | Android |
|---|---|---|---|---|
| B1 | First launch (or after removing the last storyteller) | Fanned card faces; **no empty circle** in the top bar | | |
| B2 | Type a name, tap **Start** | Keyboard does not cover the field or Start; a face (emoji) appears in the bar | | |
| B3 | Tap the face in the bar | Switch / add / remove sheet opens | | |
| B4 | Make a story, go back to Stories, tap anywhere on its row | The story opens | | |
| B5 | On the row, tap **⋯** | Sheet: Rename, Close, Delete — Delete last. Rename works; Delete asks first and names what goes | | |

## C. Writing (3 min)

| # | Do | Expect | iOS | Android |
|---|---|---|---|---|
| C1 | Idea: tap the big die | It tumbles and deals a Prompt card. **Android: one short buzz** | | |
| C2 | Tap the small die in the card's corner | Rolls again; the history grows | | |
| C3 | Tap a text field on any question screen and type two lines | The field stays visible above the keyboard and clear of the bottom bar the whole time | | |
| C4 | On a card with long guidance, tap **Read more**, then **Show less** | The bubble opens to the full text and folds back | | |
| C5 | Tap a card picture (a question or beat screen) | Opens large. **Swipe left/right** turns to the next/previous card of the same kind; "3 of 9" updates; Close returns | | |
| C6 | Look at the numbered dots above a question | Answered = solid ring, blank = dashed, current = filled. Can you tell them apart without reading the numbers? | | |
| C7 | Structure: scroll halfway down the board, open a beat, come back | You land where you were on the board, not at the top | | |
| C8 | Look at the Structure stop (#) in the header strip | Nine small beads around it; the written beats glow blue | | |

## D. Payoff and settings (2 min)

| # | Do | Expect | iOS | Android |
|---|---|---|---|---|
| D1 | Tell → **Print it** (bottom bar) | The system print sheet opens with only the story on the page | | |
| D2 | Tell → **Save it as text** | A `.txt` file lands where the phone keeps downloads, and opens | | |
| D3 | Tell → **Copy it**, paste into Notes/Messages | The whole story pastes | | |
| D4 | Settings → **Save a backup file**, then **Choose a backup file** and pick it | The file picker opens from the styled button; loading it confirms and lists any story it would replace | | |
| D5 | Settings → drag the text-size slider to the big **A** | Text across the app grows and reflows; nothing runs off the side | | |

## E. System settings (1 min)

| # | Do | Expect | iOS | Android |
|---|---|---|---|---|
| E1 | Turn on *Reduce Motion* (iOS: Accessibility → Motion; Android: Accessibility → Remove animations), roll the die again | No tumble, no page sweep, **no buzz** | | |
| E2 | Airplane mode on, open the installed app | It opens and your stories are there | | |
| E3 | After the next deploy, open the already-installed app | A toast says a new version is ready | | |

---

## Findings

| id | Device · OS · browser | Step | Expected | What happened | Screenshot |
|---|---|---|---|---|---|
| | | | | | |

Hand this table back as it is; each ✗ becomes a numbered finding in `docs/AUDIT.md` and a check in
the harness that would catch it next time (§10.5).
