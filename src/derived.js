// Everything computed from a story: progress, what is still blank, assembly for the Tell page.
// Pure functions over a normalized story record.

import { BEATS, BOOSTS, INGREDIENTS } from '../data.js';
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
