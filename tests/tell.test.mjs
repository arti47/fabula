// Step 5: one record, two readings (D10), and the plain-text export.
import test from 'node:test';
import assert from 'node:assert/strict';
import { blankStory, ensureSnapshot } from '../src/store.js';
import { writeBeat } from '../src/structure.js';
import { assemble, asPlainText, hasBothVersions } from '../src/derived.js';

function story() {
  let s = blankStory('t', 'Hänsel and Gretel');
  s.idea.text = 'a child gets lost in the forest and meets an evil witch';
  s.cast.push({ id: 'h1', kind: 'hero', answers: { name: 'Hänsel', age: 'seven or eight.', special: 'He is smart and brave.' }, origin: 'ingredients' });
  s.cast.push({ id: 'v1', kind: 'villain', answers: { name: 'The Witch', looks: 'Gaunt and wrinkled.' }, origin: 'ingredients' });
  s.cast.push({ id: 'empty', kind: 'hero', answers: {}, origin: 'ingredients' });
  s.worlds.push({ id: 'w1', answers: { special: 'A large forest, with a gingerbread house in it.' } });
  s = writeBeat(s, 1, 'Hänsel lives with his parents near the forest.');
  s = writeBeat(s, 6, 'He finds a house made of marzipan.');
  return s;
}

test('the beats read as one story, each introduced by its own card phrase', () => {
  const a = assemble(story());
  assert.equal(a.passages.length, 2);
  assert.equal(a.passages[0].connector, 'Once upon a time');
  assert.equal(a.passages[1].connector, 'Face-off with the antagonist');
  assert.equal(a.blanks, 7);
});

test('unanswered cards are left out, and unnamed ones still get a name', () => {
  const a = assemble(story());
  assert.equal(a.cast.length, 2, 'the empty character is not in the read-back');
  assert.equal(a.cast[0].name, 'Hänsel');
  assert.match(a.cast[0].description, /smart and brave/);
  assert.ok(!/Hänsel/.test(a.cast[0].description), 'the name is not repeated inside the description');
  assert.equal(a.worlds.length, 1);
});

test('both versions render from one record', () => {
  const before = ensureSnapshot(story());
  // Freshly frozen, the two readings are the same story: there is nothing to compare yet.
  assert.equal(hasBothVersions(before), false);
  const after = writeBeat(before, 6, 'Gretel throws the witch into the oven.');
  assert.equal(hasBothVersions(after), true, 'once the story moves on, both are worth reading');

  const now = assemble(after, 'now');
  const then = assemble(after, 'before');
  assert.match(now.passages[1].text, /Gretel/);
  assert.match(then.passages[1].text, /marzipan/);
  assert.equal(then.version, 'before');
  assert.ok(then.takenAt, 'the before-version says when it was frozen');
});

test('boost answers belong to the story as it stands, not to the frozen draft', () => {
  const s = ensureSnapshot(story());
  s.boosts = { 'boost-help': { answer: 'Give him a sister, Gretel.' }, 'boost-twist': { answer: '   ' } };
  assert.deepEqual(assemble(s, 'before').boosts, []);
  const now = assemble(s, 'now');
  assert.equal(now.boosts.length, 1, 'a blank boost answer is not a note');
  assert.match(now.boosts[0].answer, /Gretel/);
});

test('a card a boost invented is marked as such in the read-back', () => {
  const s = story();
  s.cast.push({ id: 'g1', kind: 'hero', answers: { name: 'Gretel' }, origin: 'boost:boost-help' });
  const gretel = assemble(s).cast.find((c) => c.name === 'Gretel');
  assert.equal(gretel.fromBoost, 'boost-help');
  assert.equal(assemble(s).cast[0].fromBoost, null);
});

test('an empty story reads back as empty rather than crashing', () => {
  const a = assemble(blankStory('t', 'Nothing yet'));
  assert.deepEqual(a.passages, []);
  assert.equal(a.blanks, 9);
  assert.equal(a.idea, '');
  assert.match(asPlainText(a), /Nothing yet/);
});

test('the plain text carries the story, the cast and the boosts', () => {
  const s = ensureSnapshot(story());
  s.boosts = { 'boost-help': { answer: 'Give him a sister.' } };
  const text = asPlainText(assemble(s, 'now'));
  assert.match(text, /^Hänsel and Gretel/);
  assert.match(text, /The story of a child gets lost/);
  assert.match(text, /Once upon a time Hänsel lives with his parents/);
  assert.match(text, /WHO IS IN IT/);
  assert.match(text, /The Witch/);
  assert.match(text, /WHERE IT HAPPENS/);
  assert.match(text, /NOTES FROM THE BOOSTS/);
  assert.ok(!/\n\n\n/.test(text), 'no runs of blank lines');
  assert.ok(text.endsWith('\n'));
});
