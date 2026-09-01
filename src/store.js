// Storytellers, stories, persistence. Local-only for now; the shape is what a later sync phase
// would carry unchanged (CLAUDE.md D6, §7).

import { uid, nowIso } from './core.js';

const KEY = {
  storytellers: 'storyMachine.storytellers',
  current: 'storyMachine.currentStoryteller',
  currentStory: 'storyMachine.currentStory',
  story: (id) => `storyMachine.story.${id}`,
  index: 'storyMachine.storyIndex',
  prefs: 'storyMachine.prefs',
};

export const SCHEMA_VERSION = 1;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // private mode, quota, blocked site data — never throw at the caller
  }
}

// ---------------------------------------------------------------------------
// Preferences (theme, text size)
// ---------------------------------------------------------------------------

export function getPrefs() {
  return { theme: 'system', textScale: 1, ...read(KEY.prefs, {}) };
}

export function setPref(name, value) {
  write(KEY.prefs, { ...getPrefs(), [name]: value });
}

// ---------------------------------------------------------------------------
// Storytellers
// ---------------------------------------------------------------------------

export function getStorytellers() {
  return read(KEY.storytellers, []);
}

export function addStoryteller(name, emoji = '✶') {
  const teller = { id: uid('teller'), name, emoji, createdAt: nowIso() };
  write(KEY.storytellers, [...getStorytellers(), teller]);
  setCurrentStoryteller(teller.id);
  return teller;
}

export function removeStoryteller(id) {
  write(KEY.storytellers, getStorytellers().filter((t) => t.id !== id));
  for (const meta of listStories(id)) deleteStory(meta.id);
  if (getCurrentStorytellerId() === id) {
    const next = getStorytellers()[0];
    setCurrentStoryteller(next ? next.id : null);
  }
}

export function getCurrentStorytellerId() {
  return read(KEY.current, null);
}

export function setCurrentStoryteller(id) {
  write(KEY.current, id);
}

export function getCurrentStoryteller() {
  const id = getCurrentStorytellerId();
  return getStorytellers().find((t) => t.id === id) || null;
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export function blankStory(ownerId, title = 'Untitled story') {
  return {
    id: uid('story'),
    ownerId,
    title,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    schemaVersion: SCHEMA_VERSION,
    idea: { text: '', fromPrompt: null, rolls: [] },
    cast: [],
    worlds: [],
    inciting: { answers: {} },
    beats: {},
    boosts: {},
    snapshot: null,
    skipped: [],
  };
}

/** Back-fill defaults so an older record never crashes a newer screen (§7). */
export function normalizeStory(story) {
  const base = blankStory(story.ownerId, story.title);
  const out = {
    ...base,
    ...story,
    idea: { ...base.idea, ...(story.idea || {}) },
    inciting: { answers: {}, ...(story.inciting || {}) },
    beats: { ...(story.beats || {}) },
    boosts: { ...(story.boosts || {}) },
    cast: Array.isArray(story.cast) ? story.cast : [],
    worlds: Array.isArray(story.worlds) ? story.worlds : [],
    skipped: Array.isArray(story.skipped) ? story.skipped : [],
    snapshot: story.snapshot || null,
    schemaVersion: SCHEMA_VERSION,
  };
  if (!Array.isArray(out.idea.rolls)) out.idea.rolls = [];
  return out;
}

export function listStories(ownerId = getCurrentStorytellerId()) {
  return read(KEY.index, [])
    .filter((meta) => !ownerId || meta.ownerId === ownerId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getStory(id) {
  const raw = read(KEY.story(id), null);
  return raw ? normalizeStory(raw) : null;
}

export function saveStory(story) {
  const next = { ...story, updatedAt: nowIso() };
  write(KEY.story(next.id), next);
  const index = read(KEY.index, []).filter((m) => m.id !== next.id);
  index.push({ id: next.id, ownerId: next.ownerId, title: next.title, createdAt: next.createdAt, updatedAt: next.updatedAt });
  write(KEY.index, index);
  return next;
}

export function createStory(title, ownerId = getCurrentStorytellerId()) {
  const story = saveStory(blankStory(ownerId, title));
  setCurrentStoryId(story.id);
  return story;
}

export function deleteStory(id) {
  try { localStorage.removeItem(KEY.story(id)); } catch { /* nothing to do */ }
  write(KEY.index, read(KEY.index, []).filter((m) => m.id !== id));
  if (getCurrentStoryId() === id) setCurrentStoryId(null);
}

export function getCurrentStoryId() {
  return read(KEY.currentStory, null);
}

export function setCurrentStoryId(id) {
  write(KEY.currentStory, id);
}

export function getCurrentStory() {
  const id = getCurrentStoryId();
  return id ? getStory(id) : null;
}

// ---------------------------------------------------------------------------
// The snapshot — the "before" version, frozen when the Boost step is first opened (ruling A8)
// ---------------------------------------------------------------------------

/** A deep-enough copy of everything the Tell page renders, stamped with when it was taken. */
export function takeSnapshot(story) {
  return {
    ...story,
    snapshot: {
      takenAt: nowIso(),
      beats: JSON.parse(JSON.stringify(story.beats || {})),
      cast: JSON.parse(JSON.stringify(story.cast || [])),
      worlds: JSON.parse(JSON.stringify(story.worlds || [])),
      inciting: JSON.parse(JSON.stringify(story.inciting || { answers: {} })),
      idea: JSON.parse(JSON.stringify(story.idea || {})),
    },
  };
}

/** Freeze the draft the first time the Boost step is opened, and never again on its own. */
export function ensureSnapshot(story) {
  return story.snapshot ? null : takeSnapshot(story);
}

// ---------------------------------------------------------------------------
// Export / import — a supported feature, not a debug hatch (§4)
// ---------------------------------------------------------------------------

export function exportAll() {
  return {
    app: 'story-machine',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    storytellers: getStorytellers(),
    stories: read(KEY.index, []).map((m) => getStory(m.id)).filter(Boolean),
  };
}

export function importAll(payload, { merge = true } = {}) {
  if (!payload || payload.app !== 'story-machine') throw new Error('That file is not a Story Machine backup.');
  const tellers = merge ? getStorytellers() : [];
  const byId = new Map(tellers.map((t) => [t.id, t]));
  for (const t of payload.storytellers || []) byId.set(t.id, t);
  write(KEY.storytellers, [...byId.values()]);

  let count = 0;
  for (const raw of payload.stories || []) {
    saveStory(normalizeStory(raw));
    count++;
  }
  return { stories: count, storytellers: (payload.storytellers || []).length };
}
