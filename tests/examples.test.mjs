// The two booklet stories as story records (T7). They must survive normalization and read back
// through the same assembly as a kid's own story.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_STORIES, getExample } from '../data-examples.js';
import { normalizeStory } from '../src/store.js';
import { assemble, asPlainText, hasBothVersions, spawnedBy } from '../src/derived.js';
import { BEATS, INGREDIENTS, getCard } from '../data.js';

test('there are two of them, and they resolve by id', () => {
  assert.equal(EXAMPLE_STORIES.length, 2);
  assert.ok(getExample('example-red-riding-hood'));
  assert.ok(getExample('example-hansel-gretel'));
  assert.equal(getExample('nope'), null);
});

test('each one is a real story record that normalizes cleanly', () => {
  for (const example of EXAMPLE_STORIES) {
    const s = normalizeStory(example);
    assert.equal(s.title, example.title);
    assert.ok(s.idea.text.length > 10, `${s.title} has no idea`);
    assert.ok(s.cast.length >= 2, `${s.title} has almost no cast`);
    assert.equal(s.worlds.length, 1);
    assert.ok(s.inciting.answers.what, `${s.title} has no inciting event`);
    assert.deepEqual(Object.keys(s.beats).map(Number).sort((a, b) => a - b), BEATS.map((b) => b.n));
  }
});

test('every answer key an example uses is a key its card actually asks', () => {
  const keysFor = (kind) => new Set(INGREDIENTS.find((i) => i.kind === kind).questions.map((q) => q.key));
  for (const example of EXAMPLE_STORIES) {
    for (const c of example.cast) {
      for (const key of Object.keys(c.answers)) {
        assert.ok(keysFor(c.kind).has(key), `${example.title}: ${c.answers.name} answers "${key}", which is not on the ${c.kind} card`);
      }
    }
    for (const w of example.worlds) {
      for (const key of Object.keys(w.answers)) assert.ok(keysFor('world').has(key), `${example.title}: world answers "${key}"`);
    }
    for (const key of Object.keys(example.inciting.answers)) {
      assert.ok(keysFor('event').has(key), `${example.title}: inciting answers "${key}"`);
    }
  }
});

test('every boost an example answers is a real boost card', () => {
  for (const example of EXAMPLE_STORIES) {
    for (const [id, state] of Object.entries(example.boosts)) {
      const card = getCard(id);
      assert.ok(card && card.group === 'boost', `${example.title} answers "${id}", which is not a boost`);
      for (const n of state.editedBeats) assert.ok(n >= 1 && n <= 9, `${example.title}: ${id} points at beat ${n}`);
    }
  }
});

test('a card an example says came from a boost really did', () => {
  // One record: the card carries its own origin, and the boost screen derives the rest.
  const hg = getExample('example-hansel-gretel');
  const gretel = hg.cast.find((c) => c.answers.name === 'Gretel');
  assert.equal(gretel.origin, 'boost:boost-help');
  assert.deepEqual(spawnedBy(hg, 'boost-help').map((c) => c.id), [gretel.id]);

  const stepmother = hg.cast.find((c) => c.answers.name === 'The Stepmother');
  assert.equal(stepmother.origin, 'boost:boost-why-villain');
  assert.deepEqual(spawnedBy(hg, 'boost-why-villain').map((c) => c.id), [stepmother.id]);

  assert.deepEqual(spawnedBy(hg, 'boost-narrator'), [], 'a boost that made nothing claims nothing');
});

test('Hänsel and Gretel is told twice, and the two tellings differ', () => {
  const hg = getExample('example-hansel-gretel');
  assert.equal(hasBothVersions(hg), true);
  const before = assemble(hg, 'before');
  const after = assemble(hg, 'now');

  assert.equal(before.passages.length, 9);
  assert.equal(after.passages.length, 9);
  assert.ok(!before.cast.some((c) => c.name === 'Gretel'), 'the first draft has no sister');
  assert.ok(after.cast.some((c) => c.name === 'Gretel'), 'the boosted version does');
  assert.ok(!before.cast.some((c) => c.name === 'The Stepmother'));
  assert.ok(after.cast.some((c) => c.name === 'The Stepmother'));
  assert.notEqual(before.passages[6].text, after.passages[6].text, 'the outcome beat is rewritten');
  assert.match(after.passages[6].text, /Gretel/);
  assert.deepEqual(before.boosts, [], 'the draft predates the boosts');
  assert.ok(after.boosts.length >= 8);
});

test('Little Red Riding Hood has no before-version, and says so by having none', () => {
  const lrrh = getExample('example-red-riding-hood');
  assert.equal(hasBothVersions(lrrh), false);
  const a = assemble(lrrh);
  assert.equal(a.passages.length, 9);
  assert.equal(a.blanks, 0);
  assert.equal(a.cast.length, 2);
});

test('both read out as plain text with their beats in order', () => {
  for (const example of EXAMPLE_STORIES) {
    const text = asPlainText(assemble(normalizeStory(example)));
    assert.ok(text.startsWith(example.title), `${example.title} does not lead with its title`);
    assert.ok(text.indexOf('Once upon a time') < text.indexOf('In the end'), `${example.title} is out of order`);
    assert.match(text, /WHO IS IN IT/);
  }
});
