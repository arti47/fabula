// The Dealer (D53, D55): the order cards are handed out in is the booklet's order, it is an order
// and never a gate, and it keeps every permission the deck grants.
import test from 'node:test';
import assert from 'node:assert/strict';
import { blankStory } from '../src/store.js';
import { dealOrder, dealNeighbours } from '../src/derived.js';
import { firstSentence } from '../src/ui.js';
import { INGREDIENTS, BEATS, BOOSTS } from '../data.js';

const hero = (id) => ({ id, kind: 'hero', answers: {}, origin: 'ingredients' });

test('the deal follows the booklet: idea, ingredients, nine beats, ten boosts, tell', () => {
  const routes = dealOrder(blankStory('t')).map((o) => o.route);
  assert.equal(routes[0], '#/build/idea');
  assert.equal(routes.at(-1), '#/build/tell');
  const beats = routes.filter((r) => r.startsWith('#/build/structure/'));
  assert.deepEqual(beats, BEATS.map((b) => `#/build/structure/${b.n}`));
  const boosts = routes.filter((r) => r.startsWith('#/build/boost/'));
  assert.deepEqual(boosts, BOOSTS.map((b) => `#/build/boost/${b.id}`));
  // Ingredients before beats, beats before boosts.
  const at = (prefix) => routes.findIndex((r) => r.startsWith(prefix));
  assert.ok(at('#/build/ingredients') < at('#/build/structure') && at('#/build/structure') < at('#/build/boost'));
});

test('every question of every ingredient card the story has is dealt, once', () => {
  const s = blankStory('t');
  s.cast = [hero('h1')];
  const routes = dealOrder(s).map((o) => o.route);
  const heroCard = INGREDIENTS.find((i) => i.kind === 'hero');
  for (let i = 0; i < heroCard.questions.length; i++) assert.equal(routes.filter((r) => r === `#/build/ingredients/h1/${i}`).length, 1);
  assert.equal(new Set(routes).size, routes.length, 'a card is dealt twice');
});

test('P3: a second main character is dealt too', () => {
  const s = blankStory('t');
  s.cast = [hero('h1'), hero('h2')];
  const routes = dealOrder(s).map((o) => o.route);
  assert.ok(routes.includes('#/build/ingredients/h2/0'));
  assert.ok(routes.indexOf('#/build/ingredients/h1/0') < routes.indexOf('#/build/ingredients/h2/0'));
});

test('P1: a skipped card is not dealt, and comes back when it is brought back', () => {
  const s = blankStory('t');
  const world = INGREDIENTS.find((i) => i.kind === 'world');
  s.skipped = [world.id];
  assert.ok(!dealOrder(s).some((o) => o.route.includes('world')));
  s.skipped = [];
  assert.ok(dealOrder(s).some((o) => o.route === '#/build/ingredients/new-world'));
});

test('neighbours: an ingredient opened without a question is its first question', () => {
  const s = blankStory('t');
  s.cast = [hero('h1')];
  const a = dealNeighbours(s, '#/build/ingredients/h1');
  const b = dealNeighbours(s, '#/build/ingredients/h1/0');
  assert.equal(a.index, b.index);
  assert.equal(a.prev.route, '#/build/idea');
  assert.equal(dealNeighbours(s, '#/build/idea').prev, null);
  assert.equal(dealNeighbours(s, '#/build/tell').next, null);
});

test('a route the deal does not know has no neighbours, so nothing is dealt by mistake', () => {
  const n = dealNeighbours(blankStory('t'), '#/build/structure/4/from/boost-x');
  assert.equal(n.prev, null);
  assert.equal(n.next, null);
});

test('the teaching line is the first sentence of the guidance (D57)', () => {
  assert.equal(firstSentence('One. Two. Three.'), 'One.');
  assert.equal(firstSentence('Is it? Yes.'), 'Is it?');
  assert.equal(firstSentence('No full stop'), 'No full stop');
  // Every card's teaching line is a real sentence, not empty and not the whole paragraph twice.
  for (const card of [...INGREDIENTS, ...BEATS, ...BOOSTS]) {
    const line = firstSentence(card.guidance);
    assert.ok(line.length > 10, `${card.id}: "${line}"`);
    assert.ok(card.guidance.startsWith(line), card.id);
  }
});

test('D58: the storyteller is named at the end, and renaming keeps everything else', async () => {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
  const { addStoryteller, renameStoryteller, getStorytellers, getCurrentStoryteller } = await import('../src/store.js');
  const t = addStoryteller('Storyteller', '🦊');
  renameStoryteller(t.id, 'Ada');
  const [after] = getStorytellers();
  assert.equal(after.name, 'Ada');
  assert.equal(after.emoji, '🦊');
  assert.equal(after.id, t.id);
  assert.equal(getCurrentStoryteller().id, t.id);
  delete globalThis.localStorage;
});
