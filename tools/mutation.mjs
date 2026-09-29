// Mutation pass (docs/AUDIT.md cycle 10). Every harness in this project has been proved to bite
// once, by hand, at the moment it was written. This runs that proof for all of them, repeatably.
//
// Each mutant breaks one rule the app is supposed to keep. A mutant that SURVIVES is a gap: the
// behaviour can be broken and every check still passes.
//
// Run: npm run mutants            (the fast ones — unit and data guards)
//      npm run mutants -- all     (also the browser ones; several minutes)

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const runAll = process.argv[2] === 'all';

const MUTANTS = [
  // --- rules, caught by the unit and data guards ---------------------------
  {
    name: 'beat 2 pre-fill overwrites what the kid wrote (A5)',
    file: 'src/structure.js',
    from: '  if (existing && !isBlank(existing.text)) return null;',
    to: '  if (false) return null;',
    harness: 'test',
  },
  {
    name: 'the pre-fill writes back to the ingredient it came from (A5)',
    file: 'src/structure.js',
    from: '  return writeBeat(story, PREFILLED_BEAT.n, text, { prefilledFrom: PREFILLED_BEAT.prefillFrom });',
    to: '  return { ...writeBeat(story, PREFILLED_BEAT.n, text, { prefilledFrom: PREFILLED_BEAT.prefillFrom }), inciting: { answers: {} } };',
    harness: 'test',
  },
  {
    name: 'the before-version keeps re-freezing after boosting has begun (A8)',
    file: 'src/store.js',
    from: '  if (boostingHasBegun(story)) return story.snapshot ? null : takeSnapshot(story);',
    to: '  if (boostingHasBegun(story)) return takeSnapshot(story);',
    harness: 'test',
  },
  {
    name: 'the before-version freezes on arrival, before boosting begins (A8)',
    file: 'src/store.js',
    from: '  return takeSnapshot(story);\n}',
    to: '  return story.snapshot ? null : takeSnapshot(story);\n}',
    harness: 'test',
  },
  {
    name: 'the before-version follows the story instead of holding still (A8)',
    file: 'src/store.js',
    from: '      beats: JSON.parse(JSON.stringify(story.beats || {})),',
    to: '      beats: story.beats || {},',
    harness: 'test',
  },
  {
    name: 'a boost that invented a card forgets which one (P6)',
    file: 'src/ingredients.js',
    from: '  return { story: { ...story, cast: [...story.cast, { id, kind, answers: {}, origin }] }, id };',
    to: '  return { story: { ...story, cast: [...story.cast, { id, kind, answers: {} }] }, id };',
    harness: 'test',
  },
  {
    name: 'the die stops being uniform',
    file: 'src/core.js',
    from: '  return n % maxExclusive;',
    to: '  return n % 2 === 0 ? 0 : n % maxExclusive;',
    harness: 'test',
  },
  {
    name: 'a spark table loses its input',
    file: 'data-sparks.js',
    from: "  'beat.7': [",
    to: "  'beat.seven': [",
    harness: 'test',
  },
  {
    name: 'a house-added example stops being flagged as ours',
    file: 'data.js',
    from: ", house: true }",
    to: " }",
    harness: 'test',
  },
  {
    name: 'the assembled story drops the boost notes (D10)',
    file: 'src/derived.js',
    from: '  const boosts = version === \'before\' ? [] : BOOSTS',
    to: '  const boosts = true ? [] : BOOSTS',
    harness: 'test',
  },
  {
    name: 'removing a character also removes the others',
    file: 'src/store.js',
    from: '    cast: story.cast.filter((c) => c.id !== entryId),',
    to: '    cast: [],',
    harness: 'test',
  },

  // --- surfaces, caught only in a browser ----------------------------------
  {
    name: 'skipping a boost never reaches the story (P8)',
    file: 'src/boost.js',
    from: '      saveStory(writeBoost(current, boost.id, { skipped: !state.skipped }));',
    to: '      showToast(\'\');',
    harness: 'smoke',
  },
  {
    name: 'a skipped ingredient card cannot be brought back (P1)',
    file: 'src/ingredients.js',
    from: "            saveStory({ ...current, skipped: current.skipped.filter((s) => s !== card.id) });",
    to: '            void 0;',
    harness: 'smoke',
  },
  {
    name: 'the sparks draw one word instead of three',
    file: 'src/sparks.js',
    from: 'const HOW_MANY = 3;',
    to: 'const HOW_MANY = 1;',
    harness: 'smoke',
  },
  {
    name: 'a missing card face renders as a broken image',
    file: 'src/ui.js',
    from: "  img.addEventListener('error', () => {",
    to: "  img.addEventListener('never', () => {",
    harness: 'smoke',
  },
  {
    name: 'a screen loses its explain() note',
    file: 'src/build.js',
    from: '  add(screen, explain(',
    to: '  if (false) add(screen, explain(',
    harness: 'smoke',
  },
  {
    name: 'iOS pinch-zoom is allowed through again (§4)',
    file: 'src/zoom.js',
    from: '    target.addEventListener(name, (event) => event.preventDefault(), { passive: false });',
    to: '    target.addEventListener(name, () => {}, { passive: false });',
    harness: 'smoke',
  },
  {
    name: 'a two-finger pinch is treated as a scroll (§4)',
    file: 'src/zoom.js',
    from: '    if (event.touches.length > 1) event.preventDefault();',
    to: '    if (event.touches.length > 99) event.preventDefault();',
    harness: 'smoke',
  },
  {
    name: 'the zoom lock is never wired up at boot (§4)',
    file: 'src/main.js',
    from: 'lockZoom();',
    to: 'void lockZoom;',
    harness: 'smoke',
  },
  {
    name: 'a module ships without reaching the app shell (§5)',
    file: 'service-worker.js',
    from: "  './src/zoom.js',\n",
    to: '',
    harness: 'test',
  },
  {
    name: 'the storyteller control stops naming what it removes',
    file: 'src/library.js',
    from: "    'aria-label': 'Switch, add or remove a storyteller',",
    to: "    'aria-label': 'Storytellers',",
    harness: 'smoke',
  },
  {
    name: 'deleting the open story from Settings does nothing',
    file: 'src/screens.js',
    from: '          deleteStory(open.id);',
    to: '          void open;',
    harness: 'smoke',
  },
  {
    name: 'the last storyteller cannot be removed',
    file: 'src/store.js',
    from: '  write(KEY.storytellers, getStorytellers().filter((t) => t.id !== id));',
    to: '  if (getStorytellers().length > 1) write(KEY.storytellers, getStorytellers().filter((t) => t.id !== id));',
    harness: 'smoke',
  },
  {
    name: 'a card face stops opening big (§4)',
    file: 'src/ui.js',
    from: "    onclick: () => cardLightbox(card),",
    to: '    onclick: () => {},',
    harness: 'smoke',
  },
  {
    // Both guards are load-bearing and each alone is enough, so breaking one leaves the other
    // holding: an earlier mutant that removed only the clamp survived, and one that removed only
    // the off-screen rule survived too. The behaviour is what has to be broken, so this takes the
    // bar back to the unconstrained `flex: 1` the defect was found in.
    name: 'the action bar context is free to crush the buttons again',
    file: 'styles.css',
    from: '  flex: 1 1 auto; min-width: 0;\n  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;\n}\n.action-bar .button { flex: 0 0 auto; }',
    to: '  flex: 1;\n}\n.action-bar .button { }',
    harness: 'smoke',
  },
  {
    name: 'the section nav forgets to show the current step',
    file: 'src/router.js',
    from: '  centreCurrentPill();',
    to: '  void centreCurrentPill;',
    harness: 'smoke',
  },
  {
    name: 'a tab loses its icon',
    file: 'src/icons.js',
    from: "  stories: [",
    to: "  storiesx: [",
    harness: 'test',
  },
  {
    name: 'a live SVG filter comes back as a page background',
    file: 'styles.css',
    from: '  --grain-tile: url("data:image/png;base64,',
    to: '  --grain-tile: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3CfeTurbulence%2F%3E%3C%2Fsvg%3E");\n  --unused: url("data:image/png;base64,',
    harness: 'test',
  },
  {
    name: 'the tablet goes back to one stretched column (D23)',
    file: 'styles.css',
    from: '  .two-up { display: grid; grid-template-columns: 1fr 1fr;',
    to: '  .two-up { display: grid; grid-template-columns: 1fr;',
    harness: 'smoke',
  },
  {
    name: 'the step gets named twice again',
    file: 'src/build.js',
    from: "  add(screen, el('h2', { class: 'visually-hidden', text: `${current.n}. ${current.name}` }));",
    to: "  add(screen, el('h2', { text: `${current.n}. ${current.name}` }));",
    harness: 'smoke',
  },
  {
    name: 'the group dividers go back to being dead art (G5)',
    file: 'src/screens.js',
    from: '  add(screen, groupBanner(section.group));',
    to: '  void groupBanner;',
    harness: 'smoke',
  },
  {
    name: 'a finished card stops carrying its mark (G9)',
    file: 'src/ui.js',
    from: "      done ? el('span', { class: 'done-badge', 'aria-hidden': 'true', text: '\u2713' }) : null,",
    to: '      null,',
    harness: 'smoke',
  },
  {
    name: 'the beat rail forgets which beats are written (G7)',
    file: 'src/structure.js',
    from: "    const row = el('a', { class: `beat-row${isBlank(text) ? '' : ' is-written'}`, href: `#/build/structure/${beat.n}` });",
    to: "    const row = el('a', { class: 'beat-row', href: `#/build/structure/${beat.n}` });",
    harness: 'smoke',
  },
  {
    name: 'a spark can hand back the line already showing',
    file: 'src/sparks.js',
    from: '        for (let tries = 0; tries < 8 && next === out.textContent; tries++) next = pick();',
    to: '        next = out.textContent || next;',
    harness: 'smoke',
  },
  {
    name: 'anchor buttons go back to underlined links',
    file: 'styles.css',
    from: '  font: inherit; font-weight: 600; text-align: center; text-decoration: none;',
    to: '  font: inherit; font-weight: 600; text-align: center;',
    harness: 'smoke',
  },
  {
    name: 'a declaration escapes its rule again',
    file: 'skins/page.css',
    from: ':root[data-look="page"] .brand-mark { display: none; }',
    to: ':root[data-look="page"] .brand-mark { display: none; }\n--stray: 1px;',
    harness: 'test',
  },
  {
    name: 'a look stops being applied at boot',
    file: 'src/main.js',
    from: "  root.setAttribute('data-look', LOOKS.some((l) => l.id === prefs.look) ? prefs.look : 'page');",
    to: "  root.setAttribute('data-look', 'page');",
    harness: 'smoke',
  },
  {
    name: 'the update toast never offers a new version',
    file: 'src/main.js',
    from: "          showToast('A new version is ready — reload to get it', 6000);",
    to: '          void 0;',
    harness: 'update',
  },
];

const COMMANDS = {
  test: ['npm', ['test', '--silent']],
  smoke: ['node', ['tests/smoke.mjs']],
  update: ['node', ['tests/update-path.mjs']],
};

const results = [];
for (const mutant of MUTANTS) {
  if (!runAll && mutant.harness !== 'test') { results.push({ ...mutant, status: 'skipped' }); continue; }

  const path = join(ROOT, mutant.file);
  const original = readFileSync(path, 'utf8');
  if (!original.includes(mutant.from)) {
    results.push({ ...mutant, status: 'STALE' }); // the code moved; the mutant no longer applies
    continue;
  }

  writeFileSync(path, original.replace(mutant.from, mutant.to));
  let caught = false;
  try {
    const [cmd, args] = COMMANDS[mutant.harness];
    execFileSync(cmd, args, { cwd: ROOT, stdio: 'pipe' });
  } catch {
    caught = true;
  } finally {
    writeFileSync(path, original);
  }
  results.push({ ...mutant, status: caught ? 'caught' : 'SURVIVED' });
}

console.log(`\nmutation pass — ${results.filter((r) => r.status !== 'skipped').length} mutants run\n`);
for (const r of results) {
  const mark = { caught: '  ✓', SURVIVED: '  ✗', STALE: '  ?', skipped: '  ·' }[r.status];
  console.log(`${mark} ${r.status.padEnd(9)} ${r.harness.padEnd(7)} ${r.name}`);
}

const gaps = results.filter((r) => r.status === 'SURVIVED' || r.status === 'STALE');
console.log(gaps.length
  ? `\n${gaps.length} mutant(s) nothing caught — each one is a rule that can break silently\n`
  : '\nevery mutant was caught\n');
process.exit(gaps.length ? 1 : 0);
