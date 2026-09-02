// Step 4 invariants: the snapshot (A8) and the two permissions the booklet demonstrates (P6, P7).
import test from 'node:test';
import assert from 'node:assert/strict';
import { blankStory, takeSnapshot, ensureSnapshot, boostingHasBegun } from '../src/store.js';
import { writeBeat } from '../src/structure.js';
import { addEntry } from '../src/ingredients.js';
import { BOOSTS } from '../data.js';
import { spawnedBy } from '../src/derived.js';

function draft() {
  let s = blankStory('t', 'Hänsel');
  s.idea.text = 'a child gets lost in the forest';
  s.inciting.answers = { what: 'Hänsel gets lost' };
  s = writeBeat(s, 1, 'Hänsel lives with his parents near the forest.');
  s = writeBeat(s, 6, 'He finds a house made of marzipan.');
  s.cast.push({ id: 'hero-1', kind: 'hero', answers: { name: 'Hänsel' }, origin: 'ingredients' });
  return s;
}

test('opening the Boost step is not the same as boosting (A8)', () => {
  // A kid tapping through the tabs on an empty story used to freeze an empty before-version for
  // ever, which left the before/after comparison with nothing in it.
  const s = draft();
  assert.equal(boostingHasBegun(s), false);

  const looked = ensureSnapshot(s);                       // just arrived, nothing answered
  assert.ok(looked.snapshot.takenAt, 'there should still be something to compare against');

  const later = writeBeat(looked, 9, 'And then they went home.');
  const refreshed = ensureSnapshot(later);
  assert.equal(refreshed.snapshot.beats[9].text, 'And then they went home.',
    'until boosting begins, the before-version keeps up with the story');
});

test('the before-version locks the moment a boost is answered or skipped (A8)', () => {
  let s = ensureSnapshot(draft());
  s = { ...s, boosts: { 'boost-help': { answer: 'Give him a sister.', skipped: false, editedBeats: [] } } };
  assert.equal(boostingHasBegun(s), true);
  assert.equal(ensureSnapshot(s), null, 'once boosting has begun it must not re-freeze');

  // Skipping counts as boosting too: the kid has been through the card and made a decision.
  const skipped = { ...ensureSnapshot(draft()), boosts: { 'boost-twist': { answer: '', skipped: true, editedBeats: [] } } };
  assert.equal(boostingHasBegun(skipped), true);
  assert.equal(ensureSnapshot(skipped), null);
});

test('the snapshot keeps the draft even after the story moves on', () => {
  const frozen = ensureSnapshot(draft());
  const after = writeBeat(frozen, 6, 'Gretel throws the witch in the oven.');
  assert.equal(after.beats[6].text, 'Gretel throws the witch in the oven.');
  assert.equal(after.snapshot.beats[6].text, 'He finds a house made of marzipan.', 'the before-version must not follow the edit');
  assert.equal(after.snapshot.beats[1].text, 'Hänsel lives with his parents near the forest.');
});

test('the before-version is a copy, not a view of the story', () => {
  // Every other test changes the story through writeBeat, which builds a new object — so a
  // snapshot that merely referenced the live story would pass them all.
  const frozen = ensureSnapshot(draft());
  frozen.beats[6].text = 'mutated in place';
  frozen.cast[0].answers.name = 'Someone else';
  frozen.worlds.push({ id: 'late', answers: {} });
  frozen.inciting.answers.what = 'changed';
  frozen.idea.text = 'changed';

  assert.equal(frozen.snapshot.beats[6].text, 'He finds a house made of marzipan.');
  assert.equal(frozen.snapshot.cast[0].answers.name, 'Hänsel');
  assert.equal(frozen.snapshot.worlds.length, 0);
  assert.notEqual(frozen.snapshot.inciting.answers.what, 'changed');
  assert.notEqual(frozen.snapshot.idea.text, 'changed');
});

test('re-freezing replaces the before-version on purpose', () => {
  const frozen = ensureSnapshot(draft());
  const after = writeBeat(frozen, 6, 'Gretel saves him.');
  const refrozen = takeSnapshot(after);
  assert.equal(refrozen.snapshot.beats[6].text, 'Gretel saves him.');
  assert.notEqual(refrozen.snapshot.takenAt, undefined);
});

test('P6: a card spawned by a boost remembers which boost made it', () => {
  const { story, id } = addEntry(draft(), 'hero', 'boost:boost-help');
  const spawned = story.cast.find((c) => c.id === id);
  assert.equal(spawned.kind, 'hero');
  assert.equal(spawned.origin, 'boost:boost-help');
  assert.equal(story.cast.length, 2, 'the original hero is still there');
});

test('P6: what a boost made is derived from the card, not recorded twice', () => {
  // Two records of one fact can disagree, and nothing would notice (§10.11).
  const { story, id } = addEntry(draft(), 'villain', 'boost:boost-why-villain');
  assert.deepEqual(spawnedBy(story, 'boost-why-villain').map((c) => c.id), [id]);
  assert.deepEqual(spawnedBy(story, 'boost-help'), []);
  for (const state of Object.values(story.boosts || {})) {
    assert.ok(!('spawned' in state), 'the boost should not keep its own copy of what it made');
  }
});

test('P6: the two boosts the booklet uses to invent characters can do so', () => {
  const help = BOOSTS.find((b) => b.id === 'boost-help');
  const why = BOOSTS.find((b) => b.id === 'boost-why-villain');
  assert.ok(help.canSpawn.includes('hero'), 'Gretel comes from this card');
  assert.ok(why.canSpawn.includes('villain'), 'the stepmother comes from this card');
});

test('P7: every beat a boost points at exists, and the snapshot still holds the old text', () => {
  const numbers = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const b of BOOSTS) for (const n of b.suggestsBeats) assert.ok(numbers.has(n), `${b.id} points at beat ${n}`);

  const frozen = ensureSnapshot(draft());
  const rewritten = writeBeat(frozen, 1, 'Hänsel and Gretel live with their parents near the forest.');
  assert.match(rewritten.beats[1].text, /Gretel/);
  assert.ok(!/Gretel/.test(rewritten.snapshot.beats[1].text), 'the before-version keeps the beat as it was');
});

test('a story with no boosts answered is still a legal story (P8)', () => {
  const frozen = ensureSnapshot(draft());
  assert.deepEqual(frozen.boosts, {});
});
