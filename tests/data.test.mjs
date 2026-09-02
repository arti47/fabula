// Harness A: unit + data invariants (CLAUDE.md §9).
// Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ALL_CARDS, PROMPTS, INGREDIENTS, BEATS, BOOSTS, DIVIDERS, DIE_FACES,
  IDEA_CARD, CARD_ERRATA, getCard, STEPS,
} from '../data.js';

test('deck has the right shape: 30 playable cards, 4 dividers, 34 faces', () => {
  assert.equal(PROMPTS.length, 6);
  assert.equal(INGREDIENTS.length, 4);
  assert.equal(BEATS.length, 9);
  assert.equal(BOOSTS.length, 10);
  assert.equal(DIVIDERS.length, 4);
  assert.equal(ALL_CARDS.length, 30);
  assert.equal(ALL_CARDS.length + DIVIDERS.length, 34);
});

test('every card id is unique and resolves through the one lookup', () => {
  const ids = ALL_CARDS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.equal(getCard(id).id, id);
  assert.equal(getCard('nope'), null);
});

test('die has six faces, one per Prompt card, no duplicates', () => {
  assert.deepEqual(DIE_FACES, ['P', 'M', 'Q', 'G', 'N', 'S']); // ruling A4
  assert.equal(new Set(DIE_FACES).size, 6);
});

test('beats are numbered 1-9, unique, in order', () => {
  assert.deepEqual(BEATS.map((b) => b.n), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const b of BEATS) assert.equal(b.id, `beat-${b.n}`);
});

test('beat 4 and beat 5 share a headline but are distinguishable', () => {
  // ruling A1
  assert.equal(BEATS[3].headline, BEATS[4].headline);
  assert.notEqual(BEATS[3].beatName, BEATS[4].beatName);
});

test('only beat 2 pre-fills, and it pre-fills from the inciting event', () => {
  // ruling A5
  const prefilling = BEATS.filter((b) => b.prefillFrom);
  assert.equal(prefilling.length, 1);
  assert.equal(prefilling[0].n, 2);
  assert.equal(prefilling[0].prefillFrom, 'inciting');
});

test('every playable card has a headline, guidance, art and group', () => {
  for (const c of ALL_CARDS) {
    assert.ok(c.headline, `${c.id} headline`);
    assert.ok(c.guidance && c.guidance.length > 60, `${c.id} guidance`);
    assert.ok(c.art, `${c.id} art`);
    assert.ok(c.group, `${c.id} group`);
  }
});

test('every card teaches with at least one example', () => {
  // §0.1: guidance without examples is the layer the booklet actually teaches with.
  for (const c of ALL_CARDS) {
    const has = (c.examples && c.examples.length) || c.example || c.examplesOther;
    assert.ok(has, `${c.id} has no example`);
  }
});

test('character cards ask the six printed questions; every question key is unique', () => {
  for (const ing of INGREDIENTS) {
    const keys = ing.questions.map((q) => q.key);
    assert.equal(new Set(keys).size, keys.length, `${ing.id} duplicate keys`);
    for (const q of ing.questions) assert.ok(q.label.endsWith('?'), `${ing.id}.${q.key} label`);
  }
  const hero = INGREDIENTS.find((i) => i.kind === 'hero');
  const villain = INGREDIENTS.find((i) => i.kind === 'villain');
  assert.equal(hero.questions.length, 6);
  assert.deepEqual(hero.questions.map((q) => q.key), villain.questions.map((q) => q.key));
});

test('worked example answers cover every question on their card', () => {
  for (const ing of INGREDIENTS) {
    if (!ing.example) continue;
    for (const q of ing.questions) {
      assert.ok(ing.example.answers[q.key], `${ing.id} example missing ${q.key}`);
    }
  }
});

test('the three repeatable ingredient kinds are marked; the event is not', () => {
  // permission P3
  const repeatable = INGREDIENTS.filter((i) => i.repeatable).map((i) => i.kind);
  assert.deepEqual(repeatable.sort(), ['hero', 'villain', 'world']);
  assert.equal(INGREDIENTS.find((i) => i.kind === 'event').repeatable, false);
});

test('boost spawn targets and beat suggestions reference things that exist', () => {
  // permissions P6, P7
  const kinds = new Set(INGREDIENTS.map((i) => i.kind));
  const beatNumbers = new Set(BEATS.map((b) => b.n));
  for (const b of BOOSTS) {
    assert.ok(Array.isArray(b.canSpawn), `${b.id} canSpawn`);
    for (const k of b.canSpawn) assert.ok(kinds.has(k), `${b.id} spawns unknown kind ${k}`);
    for (const n of b.suggestsBeats) assert.ok(beatNumbers.has(n), `${b.id} points at missing beat ${n}`);
  }
  // The two the booklet actually demonstrates must be able to spawn.
  assert.ok(BOOSTS.find((b) => b.id === 'boost-help').canSpawn.includes('hero'));
  assert.ok(BOOSTS.find((b) => b.id === 'boost-why-villain').canSpawn.includes('villain'));
});

test('house-added examples are flagged so the UI can label them', () => {
  // §2.2: nothing invented may pass as Sefirot's. Counting them is not enough — one losing its
  // flag leaves the rest, and the count still looks healthy. The set is named.
  const OURS = [
    'Wreck-It Ralph', 'Coraline', 'Encanto', 'Inside Out', 'Turning Red', 'Spider-Verse',
  ];
  const all = ALL_CARDS.flatMap((c) => c.examples || []);
  const flagged = all.filter((e) => e.house).map((e) => e.ref).sort();
  assert.deepEqual(flagged, [...OURS].sort(), 'the flagged examples are not the ones we added');
  for (const e of all) {
    assert.ok(e.ref && e.text, 'example needs ref and text');
    if (OURS.includes(e.ref)) assert.equal(e.house, true, `${e.ref} is ours and must say so`);
    else assert.ok(!e.house, `${e.ref} is the booklet's and must not be flagged as ours`);
  }
});

test('art ids are unique across the whole deck, dividers included', () => {
  const art = [...ALL_CARDS, ...DIVIDERS].map((c) => c.art);
  assert.equal(new Set(art).size, art.length);
  assert.equal(art.length, 34);
});

test('every playable card is reachable in the deck browser', () => {
  // The Idea card sat in the data with art, guidance and examples and appeared on no screen
  // (audit finding 34). A grep-free guard: the sections must between them name every card.
  const src = readFileSync(new URL('../src/screens.js', import.meta.url), 'utf8');
  const sections = src.slice(src.indexOf('const DECK_SECTIONS'), src.indexOf('];', src.indexOf('const DECK_SECTIONS')));
  const listed = ['IDEA_CARD', 'PROMPTS', 'INGREDIENTS', 'BEATS', 'BOOSTS'].filter((name) => sections.includes(name));
  assert.deepEqual(listed.sort(), ['BEATS', 'BOOSTS', 'IDEA_CARD', 'INGREDIENTS', 'PROMPTS'],
    'a group of cards is not in any deck section');
});

test('errata are recorded and point at real cards', () => {
  // ruling A3
  const faces = new Set([...ALL_CARDS, ...DIVIDERS].map((c) => c.id));
  for (const e of CARD_ERRATA) assert.ok(faces.has(e.card), `erratum ${e.id} names unknown card`);
  assert.equal(DIVIDERS.find((d) => d.id === 'divider-structure').erratum, 'E1');
});

test('the idea card offers a starter sentence and the five steps are in order', () => {
  assert.match(IDEA_CARD.starter, /story of/);
  assert.deepEqual(STEPS.map((s) => s.n), [1, 2, 3, 4, 5]);
  assert.deepEqual(STEPS.map((s) => s.id), ['idea', 'ingredients', 'structure', 'boost', 'tell']);
});
