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
