// Dead-data scan (CLAUDE.md §9, template §11.2.1) — the pass that finds this project's dominant
// defect: something extracted, exported and never read.
//
// Fails the build on:
//   * an export nothing reads at all — not its own file, not the app, not the tests
//   * a named import a file never uses
// Prints, without failing:
//   * exports only the tests read (fine for data invariants; suspicious for guidance and examples)
//   * exports only their own file reads (the `export` keyword is superfluous)
//
// Run: npm run scan

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

function jsIn(dir, prefix = '') {
  if (!existsSync(join(ROOT, dir))) return [];
  return readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.js') || f.endsWith('.mjs'))
    .map((f) => prefix + f);
}

const appFiles = [
  ...readdirSync(ROOT).filter((f) => f.endsWith('.js') && (f === 'data.js' || f.startsWith('data-'))),
  ...jsIn('src', 'src/'),
];
const testFiles = jsIn('tests', 'tests/');

const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const appSource = new Map(appFiles.map((f) => [f, read(f)]));
const testSource = new Map(testFiles.map((f) => [f, read(f)]));

const EXPORT_RE = /^export\s+(?:async\s+)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm;
const REEXPORT_RE = /^export\s*\{([^}]*)\}/gm;
const IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;

function importedNames(text) {
  const out = [];
  for (const m of text.matchAll(IMPORT_RE)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) out.push({ name, statement: m[0] });
    }
  }
  return out;
}

// Strip comments and string literals before asking "is this name used?" — otherwise a class name
// like 'explain' in `el('details', { class: 'explain' })` masks a dead import of `explain`.
function code(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    // Template literals are left intact: their ${...} parts are real usage.
    ;
}

const findings = [];
const notes = [];

// Which names does the app import, and which does only a test import?
const appImports = new Set();
const testImports = new Set();
for (const [, text] of appSource) for (const { name } of importedNames(text)) appImports.add(name);
for (const [, text] of testSource) for (const { name } of importedNames(text)) testImports.add(name);

// 1. exports nothing reads
for (const [file, text] of appSource) {
  const names = new Set();
  for (const m of text.matchAll(EXPORT_RE)) names.add(m[1]);
  for (const m of text.matchAll(REEXPORT_RE)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  for (const name of names) {
    const word = new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`, 'g');
    const usesInOwnFile = (code(text).match(word) || []).length > 1; // the declaration is one
    if (appImports.has(name)) continue;
    if (testImports.has(name)) { notes.push(`${file}: ${name} is read only by the tests`); continue; }
    if (usesInOwnFile) { notes.push(`${file}: ${name} is only used inside its own file — drop the export`); continue; }
    findings.push(`${file}: exports ${name}, and nothing anywhere reads it`);
  }
}

// 2. named imports a file never uses
for (const [file, text] of [...appSource, ...testSource]) {
  for (const { name, statement } of importedNames(text)) {
    const body = code(text.split(statement).join('').replace(REEXPORT_RE, ''));
    if (!new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`).test(body)) {
      findings.push(`${file}: imports ${name} and never uses it`);
    }
  }
}

for (const n of notes) console.log('  note: ' + n);
if (!findings.length) {
  console.log(`dead-data scan: clean across ${appFiles.length} app files (${notes.length} note(s))`);
  process.exit(0);
}
console.log(`dead-data scan: ${findings.length} finding(s)`);
for (const f of findings) console.log('  ' + f);
process.exit(1);
