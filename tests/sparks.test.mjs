// House-aid tables and the die (CLAUDE.md §2.2, §3.1).
//
// The invariant that matters most here is coverage in BOTH directions: every input the app asks for
// has a table, and every table belongs to a real input. A table nobody rolls is §0 in its purest
// form — content written, never surfaced.
import test from 'node:test';
import assert from 'node:assert/strict';
import { HOUSE_AID, IDEA_SPARKS, INPUT_SPARKS, SPARK_PLACEHOLDERS, sparksFor } from '../data-sparks.js';
import { fillNames, drawSparks, nameBook } from '../src/sparks.js';
import { randomInt } from '../src/core.js';
import { DIE_FACES, INGREDIENTS, BEATS, BOOSTS } from '../data.js';
import { blankStory } from '../src/store.js';

/** Every key the app will ask sparks for, derived from the deck rather than hand-listed. */
function expectedKeys() {
  const keys = [];
  for (const card of INGREDIENTS) for (const q of card.questions) keys.push(`${card.kind}.${q.key}`);
  for (const beat of BEATS) keys.push(`beat.${beat.n}`);
  for (const boost of BOOSTS) keys.push(boost.id);
  return keys;
}

test('spark tables declare themselves a house aid', () => {
  assert.equal(HOUSE_AID, true);
});

test('every input the app asks for has a table', () => {
  const missing = expectedKeys().filter((key) => !sparksFor(key));
  assert.deepEqual(missing, [], `inputs with no sparks: ${missing.join(', ')}`);
  assert.equal(expectedKeys().length, 39);
});

test('every table belongs to a real input', () => {
  const expected = new Set(expectedKeys());
  const orphans = Object.keys(INPUT_SPARKS).filter((key) => !expected.has(key));
  assert.deepEqual(orphans, [], `tables nothing rolls: ${orphans.join(', ')}`);
});

test('hero and villain answer the same questions with different words', () => {
  // The six questions are shared; the sparks must not be, or the villain reads as a second hero.
  for (const q of INGREDIENTS.find((i) => i.kind === 'hero').questions) {
    const hero = new Set(sparksFor(`hero.${q.key}`));
    const villain = sparksFor(`villain.${q.key}`);
    const shared = villain.filter((row) => hero.has(row));
    assert.deepEqual(shared, [], `hero.${q.key} and villain.${q.key} share rows`);
  }
});

test('every row is a fragment, not an answer', () => {
  for (const [key, rows] of Object.entries(INPUT_SPARKS)) {
    assert.ok(rows.length >= 12, `${key} is too short to feel random (${rows.length})`);
    assert.equal(new Set(rows).size, rows.length, `${key} has duplicate rows`);
    for (const row of rows) {
      assert.ok(row.trim().length > 2, `${key}: a blank row`);
      assert.ok(!row.endsWith('.'), `${key}: "${row}" reads as a finished sentence`);
      assert.ok(row.split(' ').length <= 9, `${key}: "${row}" is doing too much of the work`);
    }
  }
});

test('rows only use placeholders the filler knows', () => {
  const known = new Set(Object.keys(SPARK_PLACEHOLDERS));
  for (const [key, rows] of Object.entries(INPUT_SPARKS)) {
    for (const row of rows) {
      for (const [, name] of row.matchAll(/\{(\w+)\}/g)) {
        assert.ok(known.has(name), `${key}: "${row}" uses unknown placeholder {${name}}`);
      }
    }
  }
});

test('a story that has named nobody still gets readable sparks', () => {
  const empty = blankStory('t', 'x');
  for (const rows of Object.values(INPUT_SPARKS)) {
    for (const row of rows) {
      const filled = fillNames(row, empty);
      assert.ok(!/[{}]/.test(filled), `"${row}" left a placeholder behind`);
    }
  }
  assert.equal(fillNames('{villain} wants what {hero} has', empty), 'the villain wants what the hero has');
});

test('names are used once the story has them', () => {
  const story = blankStory('t', 'x');
  story.cast.push({ id: 'h', kind: 'hero', answers: { name: 'Ines' }, origin: 'ingredients' });
  story.cast.push({ id: 'v', kind: 'villain', answers: { name: 'The Inspector' }, origin: 'ingredients' });
  assert.equal(fillNames('{villain} wants what {hero} has', story), 'The Inspector wants what Ines has');

  const names = nameBook(story);
  assert.equal(names.hero, 'Ines');
  assert.equal(names.villain, 'The Inspector');
  assert.equal(names.world, SPARK_PLACEHOLDERS.world, 'the World card has no name to use');
});

test('an unnamed character does not shadow a named one', () => {
  const story = blankStory('t', 'x');
  story.cast.push({ id: 'h1', kind: 'hero', answers: {}, origin: 'ingredients' });
  story.cast.push({ id: 'h2', kind: 'hero', answers: { name: 'Otto' }, origin: 'ingredients' });
  assert.equal(nameBook(story).hero, 'Otto');
});

test('a draw gives three different sparks', () => {
  const story = blankStory('t', 'x');
  for (const key of expectedKeys()) {
    const drawn = drawSparks(key, story);
    assert.equal(drawn.length, 3, `${key} drew ${drawn.length}`);
    assert.equal(new Set(drawn).size, 3, `${key} drew the same row twice`);
  }
  assert.deepEqual(drawSparks('no.such.key', story), [], 'an unknown key draws nothing rather than throwing');
});

test('the idea screen keeps its five open tables', () => {
  assert.equal(IDEA_SPARKS.length, 5);
  for (const table of IDEA_SPARKS) {
    assert.ok(table.label && table.prompt, `${table.id} needs a label and a prompt`);
    assert.ok(table.rows.length >= 12);
    assert.equal(new Set(table.rows).size, table.rows.length);
  }
});

test('the die is uniform enough to defend', () => {
  const counts = Object.fromEntries(DIE_FACES.map((f) => [f, 0]));
  const n = 60000;
  for (let i = 0; i < n; i++) counts[DIE_FACES[randomInt(DIE_FACES.length)]]++;
  const expected = n / DIE_FACES.length;
  for (const face of DIE_FACES) {
    const drift = Math.abs(counts[face] - expected) / expected;
    assert.ok(drift < 0.05, `face ${face} came up ${counts[face]} times (${(drift * 100).toFixed(1)}% off)`);
  }
});

test('randomInt never returns out of range and refuses a bad bound', () => {
  for (let i = 0; i < 2000; i++) {
    const v = randomInt(6);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 6);
  }
  assert.throws(() => randomInt(0), RangeError);
});
