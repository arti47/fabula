// Everything computed from a story: progress, what is still blank, assembly for the Tell page.
// Pure functions over a normalized story record.

import { BEATS, BOOSTS, INGREDIENTS, IDEA_CARD } from '../data.js';
import { isBlank } from './core.js';

/** Has this character/world/event card been answered at all? */
export function hasAnyAnswer(entry) {
  return Object.values(entry?.answers || {}).some((v) => !isBlank(v));
}

export function ingredientProgress(story) {
  const heroes = story.cast.filter((c) => c.kind === 'hero');
  const villains = story.cast.filter((c) => c.kind === 'villain');
  const done =
    (heroes.some(hasAnyAnswer) ? 1 : 0) +
    (villains.some(hasAnyAnswer) ? 1 : 0) +
    (story.worlds.some(hasAnyAnswer) ? 1 : 0) +
    (hasAnyAnswer(story.inciting) ? 1 : 0);
  return { done, total: INGREDIENTS.length };
}

export function beatProgress(story) {
  const done = BEATS.filter((b) => !isBlank(story.beats?.[b.n]?.text)).length;
  return { done, total: BEATS.length };
}

export function boostProgress(story) {
  const done = BOOSTS.filter((b) => !isBlank(story.boosts?.[b.id]?.answer)).length;
  return { done, total: BOOSTS.length };
}

export function ideaDone(story) {
  return !isBlank(story.idea?.text);
}

/** The counts shown in the persistent story header. Progress, never a score (ruling A10). */
export function progress(story) {
  return {
    idea: ideaDone(story),
    ingredients: ingredientProgress(story),
    beats: beatProgress(story),
    boosts: boostProgress(story),
  };
}

/** A short line for the story shelf: the idea if there is one, else the first beat written. */
export function storyBlurb(story) {
  if (!isBlank(story.idea?.text)) return story.idea.text;
  const firstBeat = BEATS.map((b) => story.beats?.[b.n]?.text).find((t) => !isBlank(t));
  return firstBeat || '';
}

// ---------------------------------------------------------------------------
// Assembly for the Tell page (D10). One record, two readings: the story as it stands, and the
// draft frozen when the Boost step was first opened (A8). Both come out of the same function.
// ---------------------------------------------------------------------------

/** The half of the record a version reads from: the story itself, or its snapshot. */
function versionOf(story, version) {
  if (version === 'before' && story.snapshot) return story.snapshot;
  return story;
}

/**
 * The cards a boost invented (P6). Derived from each card's own `origin`, never stored twice — a
 * second copy on the boost would be a fact that could disagree with itself.
 */
export function spawnedBy(story, boostId) {
  const tag = `boost:${boostId}`;
  return [
    ...(story.cast || []).filter((c) => c.origin === tag),
    ...(story.worlds || []).filter((w) => w.origin === tag),
  ];
}

/**
 * Two versions are worth offering only once they differ. Until boosting has changed something, the
 * before-version is the same story, and two buttons showing the same words is noise.
 */
export function hasBothVersions(story) {
  if (!story.snapshot) return false;
  const now = JSON.stringify({ beats: story.beats, cast: story.cast, worlds: story.worlds, inciting: story.inciting });
  const before = JSON.stringify({
    beats: story.snapshot.beats, cast: story.snapshot.cast,
    worlds: story.snapshot.worlds, inciting: story.snapshot.inciting,
  });
  return now !== before;
}

/** A character or world, described in one line from whatever was answered. */
function describe(entry, card) {
  const parts = card.questions
    .filter((q) => q.key !== 'name')
    .map((q) => entry.answers?.[q.key])
    .filter((v) => !isBlank(v));
  return parts.join(' ');
}

export function assemble(story, version = 'now') {
  const source = versionOf(story, version);
  const heroCard = INGREDIENTS.find((i) => i.kind === 'hero');
  const villainCard = INGREDIENTS.find((i) => i.kind === 'villain');
  const worldCard = INGREDIENTS.find((i) => i.kind === 'world');

  const cast = (source.cast || [])
    .filter((c) => hasAnyAnswer(c))
    .map((c) => ({
      id: c.id,
      kind: c.kind,
      name: isBlank(c.answers?.name) ? (c.kind === 'villain' ? 'The antagonist' : 'The main character') : c.answers.name,
      description: describe(c, c.kind === 'villain' ? villainCard : heroCard),
      fromBoost: typeof c.origin === 'string' && c.origin.startsWith('boost:') ? c.origin.slice(6) : null,
    }));

  const worlds = (source.worlds || [])
    .filter((w) => hasAnyAnswer(w))
    .map((w) => ({ id: w.id, description: describe(w, worldCard) }));

  // The beat's own phrase introduces its passage, so the nine read as one told story.
  const passages = BEATS
    .map((beat) => ({ n: beat.n, connector: beat.headline, beatName: beat.beatName, text: (source.beats?.[beat.n]?.text || '').trim() }))
    .filter((p) => p.text);

  const blanks = BEATS.length - passages.length;

  // Boost answers belong to the story as it stands; a frozen draft predates them.
  const boosts = version === 'before' ? [] : BOOSTS
    .map((b) => ({ id: b.id, headline: b.headline, answer: (story.boosts?.[b.id]?.answer || '').trim() }))
    .filter((b) => b.answer);

  return {
    title: story.title,
    // The card the story wears, carried on the view model rather than looked up again by the
    // renderer: one record, one renderer (§10.9).
    cover: coverCard(story).art,
    idea: (source.idea?.text || '').trim(),
    version,
    takenAt: version === 'before' ? story.snapshot?.takenAt || null : null,
    cast,
    worlds,
    passages,
    blanks,
    boosts,
  };
}

/** The whole thing as plain text, for handing to somebody who does not have the app. */
export function asPlainText(assembled) {
  const lines = [assembled.title, ''];
  if (assembled.idea) lines.push(`The story of ${assembled.idea}`, '');
  for (const p of assembled.passages) lines.push(`${p.connector} ${p.text}`, '');
  if (assembled.cast.length) {
    lines.push('WHO IS IN IT', '');
    for (const c of assembled.cast) lines.push(`${c.name}${c.description ? ` — ${c.description}` : ''}`);
    lines.push('');
  }
  if (assembled.worlds.length) {
    lines.push('WHERE IT HAPPENS', '');
    for (const w of assembled.worlds) lines.push(w.description);
    lines.push('');
  }
  if (assembled.boosts.length) {
    lines.push('NOTES FROM THE BOOSTS', '');
    for (const b of assembled.boosts) lines.push(`${b.headline} ${b.answer}`);
    lines.push('');
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/**
 * The card a story wears (G6). Derived, never stored — a cover kept on the record could disagree
 * with the story it belongs to (§10.11). Read by the shelf and by the story header.
 *
 * It used to return the *type* of card: the Main Character card for any story with a hero. Every
 * story with a hero therefore wore the identical picture, and a shelf of three showed one image
 * three times — worse than no art, because it says the app has one picture. It now picks from the
 * cards this story has actually used, by a hash of its own id: different stories differ, the same
 * story never changes, and the cover is always a card that story is genuinely built from.
 */
export function coverCard(story) {
  const used = [];
  if ((story.cast || []).some((c) => c.kind === 'hero' && hasAnyAnswer(c))) {
    used.push(INGREDIENTS.find((i) => i.kind === 'hero'));
  }
  if ((story.cast || []).some((c) => c.kind === 'villain' && hasAnyAnswer(c))) {
    used.push(INGREDIENTS.find((i) => i.kind === 'villain'));
  }
  if ((story.worlds || []).some((w) => hasAnyAnswer(w))) {
    used.push(INGREDIENTS.find((i) => i.kind === 'world'));
  }
  for (const beat of BEATS) {
    if (!isBlank(story.beats?.[beat.n]?.text)) used.push(beat);
  }
  const cards = used.filter(Boolean);
  if (!cards.length) return IDEA_CARD;
  // Deterministic, and stable for the life of the story: the same id always picks the same card.
  let h = 0;
  for (const ch of String(story.id || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return cards[h % cards.length];
}

// ---------------------------------------------------------------------------
// The deal (D55): the order the Dealer hands the cards out in.
//
// The booklet's own order — the Idea, then the four Ingredients (every character, antagonist and
// world the story has, each question in turn), then the nine beats, then the ten Boosts, then
// Tell. It is an order, never a gate: every card stays reachable from its spread in any order
// (P2, A9, P8), and a skipped Ingredient is simply not dealt (P1). Derived, never stored.
// ---------------------------------------------------------------------------

const KIND_NAME = { hero: 'Main character', villain: 'Antagonist', world: 'World', event: 'Something happens' };

export function dealOrder(story) {
  const order = [{ route: '#/build/idea', label: 'The idea' }];
  for (const card of INGREDIENTS) {
    if ((story.skipped || []).includes(card.id)) continue;
    let entries;
    if (card.kind === 'event') entries = [{ id: 'inciting' }];
    else if (card.kind === 'world') entries = story.worlds || [];
    else entries = (story.cast || []).filter((c) => c.kind === card.kind);
    // A kind with nothing yet is dealt as a fresh card, made on arrival.
    if (!entries.length) {
      order.push({ route: `#/build/ingredients/new-${card.kind}`, label: KIND_NAME[card.kind] });
      continue;
    }
    for (const entry of entries) {
      card.questions.forEach((q, i) => {
        order.push({ route: `#/build/ingredients/${entry.id}/${i}`, label: `${KIND_NAME[card.kind]}: ${q.label}` });
      });
    }
  }
  for (const beat of BEATS) order.push({ route: `#/build/structure/${beat.n}`, label: `Beat ${beat.n}: ${beat.beatName}` });
  for (const boost of BOOSTS) order.push({ route: `#/build/boost/${boost.id}`, label: `Boost: ${boost.headline}` });
  order.push({ route: '#/build/tell', label: 'Read your story' });
  return order;
}

/** The cards either side of the one you are holding. A route the deal does not know has neither. */
export function dealNeighbours(story, route) {
  const order = dealOrder(story);
  // An Ingredient card opened without a question number is its first question.
  const wanted = /^#\/build\/ingredients\/(?!new-)[\w-]+$/.test(route) ? `${route}/0` : route;
  const at = order.findIndex((o) => o.route === wanted);
  if (at < 0) return { prev: null, next: null, index: -1, total: order.length };
  return { prev: order[at - 1] || null, next: order[at + 1] || null, index: at, total: order.length };
}
