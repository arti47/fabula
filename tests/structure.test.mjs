// Ruling A5: one story fact, two homes. Beat 2 pre-fills from the inciting event, once, and the
// two are independent from then on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { blankStory } from '../src/store.js';
import { prefillBeat2, writeBeat, beatText, incitingAsBeat2 } from '../src/structure.js';
import { beatProgress } from '../src/derived.js';

function storyWithInciting(what) {
  const s = blankStory('t', 'x');
  s.inciting.answers = { what, goodOrBad: 'bad' };
  return s;
}

test('beat 2 pre-fills from the Something happens card', () => {
  const s = storyWithInciting('Grandma falls ill');
  assert.equal(incitingAsBeat2(s), 'Grandma falls ill');
  const filled = prefillBeat2(s);
  assert.equal(beatText(filled, 2), 'Grandma falls ill');
  assert.equal(filled.beats[2].prefilledFrom, 'inciting');
});

test('nothing to carry over means nothing is pre-filled', () => {
  assert.equal(prefillBeat2(blankStory('t', 'x')), null);
  assert.equal(prefillBeat2(storyWithInciting('   ')), null);
});

test('a beat the kid has written is never overwritten', () => {
  const s = writeBeat(storyWithInciting('Grandma falls ill'), 2, 'Something else entirely');
  assert.equal(prefillBeat2(s), null);
  assert.equal(beatText(s, 2), 'Something else entirely');
});

test('pre-filling happens once — clearing the beat does not refill it', () => {
  const filled = prefillBeat2(storyWithInciting('Grandma falls ill'));
  const cleared = writeBeat(filled, 2, '');
  assert.equal(prefillBeat2(cleared), null, 'a beat cleared on purpose stays cleared');
});

test('editing beat 2 does not rewrite the ingredient it came from', () => {
  const filled = prefillBeat2(storyWithInciting('Grandma falls ill'));
  const edited = writeBeat(filled, 2, 'One morning a letter arrives instead');
  assert.equal(beatText(edited, 2), 'One morning a letter arrives instead');
  assert.equal(edited.inciting.answers.what, 'Grandma falls ill', 'the card must stay as it was written');
  assert.equal(edited.inciting.answers.goodOrBad, 'bad');
});

test('writing a beat stamps when, and counts toward progress', () => {
  const s = writeBeat(blankStory('t', 'x'), 7, 'The result is that…');
  assert.match(s.beats[7].updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(beatProgress(s), { done: 1, total: 9 });
  assert.equal(beatText(s, 3), '', 'an unwritten beat reads as empty, never undefined');
});
