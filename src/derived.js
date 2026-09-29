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

/** Which steps still have something untouched — drives the gentle dot (decision: marked, gently). */
export function blankSteps(story) {
  const p = progress(story);
  return {
    idea: !p.idea,
    ingredients: p.ingredients.done < p.ingredients.total,
    structure: p.beats.done < p.beats.total,
    boost: p.boosts.done === 0,
    tell: false,
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
 * The card a story is most about (G6): the main-character card once a hero has been answered, the
 * Idea card before that. Derived, never stored — a cover kept on the record could disagree with
 * the story it belongs to (§10.11). Read by the shelf and by the story header.
 */
export function coverCard(story) {
  const hero = (story.cast || []).find((c) => c.kind === 'hero' && hasAnyAnswer(c));
  if (hero) return INGREDIENTS.find((i) => i.kind === 'hero') || IDEA_CARD;
  return IDEA_CARD;
}

/**
 * What the story has invented so far (S3): every character and world with something written on
 * it, in the order they were made, with the card each one wears. Derived, never stored.
 */
export function castStrip(story) {
  const heroCard = INGREDIENTS.find((i) => i.kind === 'hero');
  const villainCard = INGREDIENTS.find((i) => i.kind === 'villain');
  const worldCard = INGREDIENTS.find((i) => i.kind === 'world');
  const people = (story.cast || []).filter(hasAnyAnswer).map((c) => ({
    id: c.id,
    kind: c.kind,
    art: (c.kind === 'villain' ? villainCard : heroCard)?.art,
    name: isBlank(c.answers?.name)
      ? (c.kind === 'villain' ? 'The antagonist' : 'The main character')
      : c.answers.name,
    href: `#/build/ingredients/${c.id}`,
  }));
  const places = (story.worlds || []).filter(hasAnyAnswer).map((w) => ({
    id: w.id,
    kind: 'world',
    art: worldCard?.art,
    name: isBlank(w.answers?.whereWhen) ? 'That place' : w.answers.whereWhen,
    href: `#/build/ingredients/${w.id}`,
  }));
  return [...people, ...places];
}
