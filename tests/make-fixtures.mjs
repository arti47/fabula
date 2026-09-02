// Regenerates tests/fixtures/*.json — the three seed states every probe and harness loads, so
// that no two passes measure a different app (CLAUDE.md §9 D).
//
//   fresh      nothing created at all
//   mid-story  one story at the Boost step, two heroes, a snapshot taken
//   stress     what a shelf looks like after a term: three storytellers, a dozen stories, and one
//              story with four heroes, two villains, three worlds, nine long beats, ten boosts
//              answered and forty die rolls
//
// Run: npm run fixtures

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { blankStory, ensureSnapshot } from '../src/store.js';
import { writeBeat } from '../src/structure.js';
import { BOOSTS, BEATS } from '../data.js';

const OUT = new URL('./fixtures/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const iso = (n) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString();

function bundle(storytellers, stories) {
  return { app: 'story-machine', schemaVersion: 1, exportedAt: iso(0), storytellers, stories };
}

function teller(id, name, emoji) {
  return { id, name, emoji, createdAt: iso(0) };
}

function story(ownerId, id, title, fill) {
  const s = blankStory(ownerId, title);
  s.id = id;
  s.createdAt = iso(1);
  s.updatedAt = iso(2);
  return fill ? fill(s) : s;
}

// ---------------------------------------------------------------------------

const fresh = bundle([], []);

const midStory = (() => {
  const owner = teller('teller-mid', 'Sam', '🦊');
  let s = story(owner.id, 'story-mid', 'The dragon next door', (draft) => {
    draft.idea = { text: 'a dragon moves in next door and nobody else can see it', fromPrompt: 'N', rolls: [{ letter: 'G', ts: iso(1) }, { letter: 'N', ts: iso(1) }] };
    draft.cast = [
      { id: 'mid-hero-1', kind: 'hero', origin: 'ingredients', answers: { name: 'Ines', age: 'eleven', looks: 'small, always in a yellow coat', special: 'she notices everything', fear: 'being laughed at', want: 'somebody to believe her' } },
      { id: 'mid-hero-2', kind: 'hero', origin: 'boost:boost-help', answers: { name: 'Otto', age: 'her brother, seven', special: 'he believes everything' } },
      { id: 'mid-villain', kind: 'villain', origin: 'ingredients', answers: { name: 'The Inspector', looks: 'a very tidy man with a clipboard', want: 'to prove nothing unusual ever happens' } },
    ];
    draft.worlds = [{ id: 'mid-world', answers: { special: 'an ordinary street where one house is far too warm', whereWhen: 'now, in a town with a canal' } }];
    draft.inciting = { answers: { what: 'the empty house next door starts smoking', goodOrBad: 'strange rather than bad', antagonistsFault: 'no', howItChanges: 'Ines cannot leave it alone' } };
    return draft;
  });
  s = writeBeat(s, 1, 'Ines lived in the middle house of three, and nothing had ever happened there.');
  s = writeBeat(s, 2, 'The empty house began to smoke, in December, with nobody living in it.');
  s = writeBeat(s, 3, 'She climbed the wall to look.');
  s = writeBeat(s, 6, 'The Inspector came, and she had to decide whether to tell him.');
  s = ensureSnapshot(s);
  s.boosts = {
    'boost-help': { answer: 'Otto believes her. That is the whole reason she keeps going.', skipped: false, editedBeats: [3] },
    'boost-narrator': { answer: 'Otto tells it, years later, and gets bits wrong.', skipped: false, editedBeats: [] },
    'boost-twist': { answer: '', skipped: true, editedBeats: [] },
  };
  return bundle([owner], [s]);
})();

const stress = (() => {
  const tellers = [teller('teller-a', 'Ada', '🐉'), teller('teller-b', 'Bo', '🚀'), teller('teller-c', 'Cleo', '🌙')];
  const stories = [];

  // A dozen ordinary stories spread across three shelves.
  for (let i = 0; i < 12; i++) {
    const owner = tellers[i % tellers.length];
    let s = story(owner.id, `story-${i}`, `Story number ${i + 1}`, (draft) => {
      draft.idea.text = 'something happens to somebody, somewhere unlikely';
      draft.cast = [{ id: `s${i}-hero`, kind: 'hero', origin: 'ingredients', answers: { name: `Hero ${i + 1}` } }];
      return draft;
    });
    s = writeBeat(s, 1, 'Once, in a place a lot like this one.');
    stories.push(s);
  }

  // And one that has had everything done to it.
  const long = 'They went on, and the road went on with them, past the mill and the flooded field and the '
    + 'place where the fence gives out, and none of it looked the way it had looked that morning, which was '
    + 'the first sign that something had already changed and nobody had told them. ';
  let big = story(tellers[0].id, 'story-stress', 'Everything, all at once', (draft) => {
    draft.idea = {
      text: 'four children, two enemies and three worlds, and one very long road',
      fromPrompt: 'Q',
      rolls: Array.from({ length: 40 }, (_, n) => ({ letter: 'PMQGNS'[n % 6], ts: iso(1) })),
    };
    draft.cast = [
      ...Array.from({ length: 4 }, (_, n) => ({
        id: `big-hero-${n}`, kind: 'hero', origin: n === 3 ? 'boost:boost-help' : 'ingredients',
        answers: { name: `The ${['first', 'second', 'third', 'fourth'][n]} one`, age: 'somewhere between nine and fifteen', looks: 'not much alike, considering', special: 'each of them is good at exactly one thing', fear: 'the same thing, which none of them will say', want: 'to get to the end of the road' },
      })),
      ...Array.from({ length: 2 }, (_, n) => ({
        id: `big-villain-${n}`, kind: 'villain', origin: n === 1 ? 'boost:boost-why-villain' : 'ingredients',
        answers: { name: `The ${n === 0 ? 'Collector' : 'Quiet Man'}`, looks: 'far too pleased to see them', want: 'what the children are carrying' },
      })),
    ];
    draft.worlds = Array.from({ length: 3 }, (_, n) => ({
      id: `big-world-${n}`,
      answers: { special: `the ${['first', 'second', 'third'][n]} country, where the rules are slightly different`, whereWhen: 'later than you would think', typicalDay: 'people work, and watch the road', peopleDo: 'they eat standing up and never say goodbye' },
    }));
    draft.inciting = { answers: { what: 'the road appears where the garden used to be', goodOrBad: 'nobody can agree', antagonistsFault: 'yes, though it takes a long time to find out', howItChanges: 'nothing can be walked back' } };
    return draft;
  });
  for (const beat of BEATS) big = writeBeat(big, beat.n, long.repeat(3).trim());
  big = ensureSnapshot(big);
  big.boosts = Object.fromEntries(BOOSTS.map((b, n) => [b.id, {
    answer: `${long.slice(0, 180)}(${b.headline})`,
    skipped: false,
    editedBeats: b.suggestsBeats.slice(0, 2),
  }]));
  big.skipped = ['ing-world'];
  stories.push(big);

  return bundle(tellers, stories);
})();

// A story written by a kid doing everything the app did not expect: emoji, a word with no spaces,
// quotes and angle brackets, right-to-left text, newlines, and one very short answer.
const messy = (() => {
  const owner = teller('teller-messy', '🙂 Zo <script>', '🙂');
  let s = story(owner.id, 'story-messy', 'a "story" with <angle> brackets & things', (draft) => {
    draft.idea = { text: '🐉'.repeat(40), fromPrompt: 'S', rolls: [{ letter: 'S', ts: iso(1) }] };
    draft.cast = [
      { id: 'messy-hero', kind: 'hero', origin: 'ingredients', answers: { name: '<b>Bo</b>', age: 'x', looks: 'Supercalifragilistic'.repeat(6), fear: 'ما الذي يخيفهم', want: '"everything"', special: 'line one\nline two\nline three' } },
      { id: 'messy-villain', kind: 'villain', origin: 'boost:boost-why-villain', answers: { name: '   ', want: '&amp; more' } },
    ];
    draft.worlds = [{ id: 'messy-world', answers: { special: '', whereWhen: '2026-09-01T00:00:00.000Z', typicalDay: '😀😀😀😀😀😀😀😀😀😀', peopleDo: 'a'.repeat(400) } }];
    draft.inciting = { answers: { what: 'x', goodOrBad: '', antagonistsFault: 'null', howItChanges: 'undefined' } };
    return draft;
  });
  s = writeBeat(s, 1, 'NaN');
  s = writeBeat(s, 3, 'z'.repeat(600));
  s = writeBeat(s, 5, '   ');
  s = ensureSnapshot(s);
  s.boosts = {
    'boost-twist': { answer: '[object Object]', skipped: false, editedBeats: [3] },
    'boost-why-villain': { answer: '🙃', skipped: false, editedBeats: [] },
  };
  return bundle([owner], [s]);
})();

for (const [name, data] of [['fresh', fresh], ['mid-story', midStory], ['stress', stress], ['messy', messy]]) {
  writeFileSync(join(OUT, `${name}.json`), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${name}: ${data.storytellers.length} storyteller(s), ${data.stories.length} stor${data.stories.length === 1 ? 'y' : 'ies'}`);
}
