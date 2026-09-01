// The rules library: every card has an entry, nothing is orphaned, search finds things (T8, T9).
import test from 'node:test';
import assert from 'node:assert/strict';
import { learnEntries, matchEntries } from '../src/learn.js';
import { LEARN_CHAPTERS, DRAWING_TIPS } from '../data-learn.js';
import { ALL_CARDS, getCard } from '../data.js';

test('there are seven drawing tips, numbered and distinct', () => {
  assert.equal(DRAWING_TIPS.length, 7);
  assert.deepEqual(DRAWING_TIPS.map((t) => t.n), [1, 2, 3, 4, 5, 6, 7]);
  for (const tip of DRAWING_TIPS) {
    assert.ok(tip.title && tip.text.length > 80, `tip ${tip.n} is thin`);
  }
});

test('every card a chapter names actually exists', () => {
  for (const chapter of LEARN_CHAPTERS) {
    for (const id of chapter.cards || []) {
      assert.ok(getCard(id), `${chapter.id} names a card that is not in the deck: ${id}`);
    }
  }
});

test('every playable card has a rules-library entry', () => {
  // §0.1: guidance in data.js that no screen shows is the defect this project is most prone to.
  const entryIds = new Set(learnEntries().map((e) => e.id));
  const missing = ALL_CARDS.map((c) => c.id).filter((id) => !entryIds.has(id) && id !== 'idea');
  assert.deepEqual(missing, [], `cards with no entry: ${missing.join(', ')}`);
});

test('entries are unique, titled and carry a body', () => {
  const entries = learnEntries();
  const ids = entries.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate entry ids');
  for (const e of entries) {
    assert.ok(e.title, `${e.id} has no title`);
    assert.ok(e.body && e.body.length > 40, `${e.id} has a thin body`);
    assert.ok(e.chapterTitle, `${e.id} is not in a chapter`);
  }
});

test('the drawing chapter is guidance only — it names no control', () => {
  // Permission P10 is deliberately not automated; the entry must not imply otherwise.
  const tips = learnEntries().filter((e) => e.chapter === 'drawing');
  assert.equal(tips.length, 7);
  for (const tip of tips) assert.ok(!/tap|button|screen/i.test(tip.body), `${tip.id} implies the app does the drawing`);
});

test('search finds cards by their guidance and by their examples', () => {
  assert.ok(matchEntries('villain').length > 0);
  assert.ok(matchEntries('marker').some((e) => e.chapter === 'drawing'), 'the drawing tips are searchable');
  assert.ok(matchEntries('Cinderella').some((e) => e.id === 'beat-5'), 'an example should be findable');
  assert.deepEqual(matchEntries('   '), [], 'an empty search matches nothing');
  assert.deepEqual(matchEntries('zzzzz'), []);
});

test('search is case-insensitive', () => {
  assert.equal(matchEntries('DRAGON').length, matchEntries('dragon').length);
});
