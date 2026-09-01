// Shared plumbing for the browser harnesses: a static server, a browser, and fixture loading.
// One place, so smoke, the probe and the interaction audit all measure the same app.

import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp',
};

export function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, path === '/' ? 'index.html' : path);
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

export function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const dir = readdirSync(root).filter((d) => d.startsWith('chromium-')).sort().pop();
  if (!dir) throw new Error(`no chromium under ${root}; set CHROME_PATH`);
  return join(root, dir, 'chrome-linux', 'chrome');
}

export function launch() {
  return chromium.launch({ executablePath: chromePath() });
}

export function fixture(name) {
  return JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', `${name}.json`), 'utf8'));
}

/** Seed localStorage before the app boots, the way the app itself would have written it. */
export async function seed(context, name) {
  const data = fixture(name);
  await context.addInitScript((payload) => {
    try {
      localStorage.clear();
      localStorage.setItem('storyMachine.storytellers', JSON.stringify(payload.storytellers));
      const index = payload.stories.map((s) => ({ id: s.id, ownerId: s.ownerId, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt }));
      localStorage.setItem('storyMachine.storyIndex', JSON.stringify(index));
      for (const story of payload.stories) localStorage.setItem(`storyMachine.story.${story.id}`, JSON.stringify(story));
      if (payload.storytellers[0]) localStorage.setItem('storyMachine.currentStoryteller', JSON.stringify(payload.storytellers[0].id));
      // The heaviest story is written last, and it is the one worth measuring.
      const focus = payload.stories[payload.stories.length - 1];
      if (focus) localStorage.setItem('storyMachine.currentStory', JSON.stringify(focus.id));
    } catch { /* a harness that cannot seed still runs against a fresh app */ }
  }, data);
  return data;
}

/** Card art is generated locally and may be absent — a 404 on a face is not an app error. */
export function isMissingArt(message) {
  return /assets\/cards\/[\w-]+\.webp/.test(message.location?.()?.url || '');
}

// Every screen a kid can reach, including the ones inside a step — an audit that only visits the
// grids never clicks the controls that do the work.
export const ROUTES = [
  '#/stories',
  '#/build/idea',
  '#/build/ingredients',
  '#/build/ingredients/mid-hero-1',      // a character, one question at a time
  '#/build/ingredients/mid-hero-1/5',
  '#/build/ingredients/inciting',
  '#/build/structure',
  '#/build/structure/2',                 // the pre-filled beat
  '#/build/structure/7',
  '#/build/boost',
  '#/build/boost/boost-help',            // spawns a card
  '#/build/boost/boost-too-easy',        // sends you to a beat
  '#/build/boost/boost-narrator',        // neither
  '#/build/tell',
  '#/deck',
  '#/deck/prompts',
  '#/deck/structure',
  '#/deck/card/beat-5',
  '#/deck/card/prompt-s',
  '#/learn',
  '#/learn/beat-5',
  '#/tutorial',
  '#/settings',
  '#/example/example-hansel-gretel',
];

export const WIDTHS = [320, 360, 390, 768, 1024];
