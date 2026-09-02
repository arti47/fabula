// Storage shape, normalization and the derived counts (CLAUDE.md §7, §10.17).
// A shape change ships a migration AND a fixture: the old-shape record below is that fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import { blankStory, normalizeStory, SCHEMA_VERSION, removeEntry, describeImport } from '../src/store.js';
import { progress, blankSteps, storyBlurb, hasAnyAnswer, ingredientProgress, beatProgress, boostProgress, ideaDone } from '../src/derived.js';

test('a blank story has every field a screen reads', () => {
  const s = blankStory('teller-1', 'Test');
  for (const key of ['id', 'ownerId', 'title', 'createdAt', 'updatedAt', 'schemaVersion', 'idea', 'cast', 'worlds', 'inciting', 'beats', 'boosts', 'skipped']) {
    assert.ok(key in s, `missing ${key}`);
  }
  assert.equal(s.snapshot, null);
  assert.deepEqual(s.idea, { text: '', fromPrompt: null, rolls: [] });
  assert.equal(s.schemaVersion, SCHEMA_VERSION);
});

test('an old-shape record normalizes without losing what it had', () => {
  // Hand-written, deliberately missing everything added after the first version.
  const old = {
    id: 'story-old', ownerId: 'teller-1', title: 'The old one',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z',
    idea: { text: 'a cottage that walks' },
    beats: { 1: { text: 'Once upon a time…' } },
  };
  const s = normalizeStory(old);
  assert.equal(s.title, 'The old one');
  assert.equal(s.idea.text, 'a cottage that walks');
  assert.deepEqual(s.idea.rolls, []);          // back-filled, not undefined
  assert.equal(s.idea.fromPrompt, null);
  assert.deepEqual(s.cast, []);
  assert.deepEqual(s.worlds, []);
  assert.deepEqual(s.skipped, []);
  assert.equal(s.snapshot, null);
  assert.equal(s.beats[1].text, 'Once upon a time…');
  assert.equal(s.schemaVersion, SCHEMA_VERSION);
});

test('a record with junk in the array fields does not crash a screen', () => {
  const s = normalizeStory({ ownerId: 'x', title: 'Junk', cast: 'nope', worlds: null, skipped: 7, idea: { text: 'hi', rolls: 'no' } });
  assert.deepEqual(s.cast, []);
  assert.deepEqual(s.worlds, []);
  assert.deepEqual(s.skipped, []);
  assert.deepEqual(s.idea.rolls, []);
});

test('a record from another version cannot put unknown cards on a screen', () => {
  // A backup written by a later version, or a file edited by hand, names things this build does
  // not have. They are dropped on the way in rather than rendered.
  const s = normalizeStory({
    ownerId: 't', title: 'From elsewhere',
    boosts: {
      'boost-help': { answer: 'kept', editedBeats: [4, 12, 0, 'x'] },
      'boost-from-the-future': { answer: 'dropped' },
    },
    beats: { 1: { text: 'kept' }, 12: { text: 'dropped' } },
    skipped: ['ing-hero', 'ing-nonexistent'],
  });
  assert.deepEqual(Object.keys(s.boosts), ['boost-help']);
  assert.deepEqual(s.boosts['boost-help'].editedBeats, [4], 'a boost cannot point at a beat that is not there');
  assert.equal(s.boosts['boost-help'].answer, 'kept');
  assert.deepEqual(Object.keys(s.beats), ['1']);
  assert.deepEqual(s.skipped, ['ing-hero']);
});

test('progress counts what is answered, and nothing else', () => {
  const s = blankStory('t', 'x');
  assert.deepEqual(progress(s).ingredients, { done: 0, total: 4 });
  assert.deepEqual(progress(s).beats, { done: 0, total: 9 });
  assert.deepEqual(progress(s).boosts, { done: 0, total: 10 });
  assert.equal(ideaDone(s), false);

  s.idea.text = 'a lighthouse that walks';
  s.cast.push({ id: 'c1', kind: 'hero', answers: { name: 'Bo' } });
  s.cast.push({ id: 'c2', kind: 'villain', answers: {} });          // present but unanswered
  s.worlds.push({ id: 'w1', answers: { special: 'it rains upwards' } });
  s.beats[1] = { text: 'Once…' };
  s.beats[4] = { text: '   ' };                                      // whitespace is still blank
  s.boosts['boost-help'] = { answer: 'a goose' };
  s.boosts['boost-twist'] = { answer: '', skipped: true };           // skipped is not answered

  assert.equal(ideaDone(s), true);
  assert.deepEqual(ingredientProgress(s), { done: 2, total: 4 });    // hero + world only
  assert.deepEqual(beatProgress(s), { done: 1, total: 9 });
  assert.deepEqual(boostProgress(s), { done: 1, total: 10 });
});

test('hasAnyAnswer ignores blanks and whitespace', () => {
  assert.equal(hasAnyAnswer({ answers: {} }), false);
  assert.equal(hasAnyAnswer({ answers: { a: '  ' } }), false);
  assert.equal(hasAnyAnswer({ answers: { a: '', b: 'yes' } }), true);
  assert.equal(hasAnyAnswer(undefined), false);
});

test('the gentle blank marks follow the counts', () => {
  const s = blankStory('t', 'x');
  assert.deepEqual(blankSteps(s), { idea: true, ingredients: true, structure: true, boost: true, tell: false });
  s.idea.text = 'something';
  assert.equal(blankSteps(s).idea, false);
});

test('removing a character takes its answers and nothing else', () => {
  const s = blankStory('t', 'x');
  s.cast.push({ id: 'h1', kind: 'hero', answers: { name: 'Ines' }, origin: 'ingredients' });
  s.cast.push({ id: 'h2', kind: 'hero', answers: { name: 'Otto' }, origin: 'boost:boost-help' });
  s.worlds.push({ id: 'w1', answers: { special: 'a canal' } });
  s.beats = { 1: { text: 'Once…' } };

  const after = removeEntry(s, 'h2');
  assert.deepEqual(after.cast.map((c) => c.answers.name), ['Ines']);
  assert.equal(after.worlds.length, 1, 'the world is not a character');
  assert.equal(after.beats[1].text, 'Once…', 'the story is untouched');

  const noWorld = removeEntry(s, 'w1');
  assert.equal(noWorld.worlds.length, 0);
  assert.equal(noWorld.cast.length, 2);

  assert.deepEqual(removeEntry(s, 'nobody').cast.length, 2, 'removing nothing removes nothing');
});

test('a removed character stays in the version already read back', () => {
  // The snapshot is its own copy (A8), so reading "before the boosts" still shows who was there.
  const s = blankStory('t', 'x');
  s.cast.push({ id: 'h1', kind: 'hero', answers: { name: 'Ines' }, origin: 'ingredients' });
  s.snapshot = { takenAt: '2026-01-01T00:00:00.000Z', beats: {}, cast: [...s.cast], worlds: [], inciting: { answers: {} }, idea: {} };
  const after = removeEntry(s, 'h1');
  assert.equal(after.cast.length, 0);
  assert.equal(after.snapshot.cast[0].answers.name, 'Ines');
});

test('an import says what it would replace before replacing it', () => {
  const backup = {
    app: 'story-machine',
    storytellers: [{ id: 't1', name: 'Ada' }],
    stories: [
      { id: 'story-a', title: 'The dragon next door', ownerId: 't1' },
      { id: 'story-b', title: 'Something new', ownerId: 't1' },
    ],
  };
  const plan = describeImport(backup);
  assert.equal(plan.stories, 2);
  assert.equal(plan.storytellers, 1);
  // Nothing is stored in this test environment, so nothing is at risk.
  assert.equal(plan.replaced, 0);
  assert.deepEqual(plan.replacedTitles, []);
  assert.throws(() => describeImport({ app: 'something-else' }), /not a Story Machine backup/);
  assert.throws(() => describeImport(null), /not a Story Machine backup/);
});

test('the shelf blurb prefers the idea, then the first beat written', () => {
  const s = blankStory('t', 'x');
  assert.equal(storyBlurb(s), '');
  s.beats[3] = { text: 'The adventure begins' };
  assert.equal(storyBlurb(s), 'The adventure begins');
  s.idea.text = 'a cottage that walks';
  assert.equal(storyBlurb(s), 'a cottage that walks');
});
